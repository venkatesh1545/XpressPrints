import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { UploadedFile } from '@/pages/Upload';
import * as pdfjsLib from 'pdfjs-dist';

// IMPORTANT: Use bundled worker for production
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
}

export default function FileUpload({ onFilesUploaded, uploadedFiles, onRemoveFile }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const getPageCount = async (file: File): Promise<{ pages: number; estimated: boolean }> => {
    try {
      // PDF files - Auto-detect (accurate)
      if (file.type === 'application/pdf') {
        console.log(`[PDF Detection] Processing: ${file.name}`);
        
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          verbosity: 0,
          isEvalSupported: false,
        });
        
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        
        console.log(`[PDF Detection] ✅ ${numPages} pages detected`);
        
        await pdf.destroy();
        
        return { pages: numPages, estimated: false };
      } 
      
      // DOCX/DOC files - Return 0 (requires manual entry)
      else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        console.log(`[DOCX Detection] Manual entry required for ${file.name}`);
        return { pages: 0, estimated: true };
      } 
      
      // Image files - Always 1 page
      else if (file.type.startsWith('image/')) {
        console.log(`[Image Detection] 1 page for ${file.name}`);
        return { pages: 1, estimated: false };
      }
      
      throw new Error('File type not supported. Please upload PDF, DOCX/DOC, or image files (PNG/JPG).');
      
    } catch (error) {
      console.error('[Page Detection] Error:', error);
      throw error;
    }
  };

  const uploadToSupabase = async (file: File): Promise<{ url: string; pages: number; estimated: boolean }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      console.log(`[Upload] Starting upload: ${filePath}`);

      const { pages, estimated } = await getPageCount(file);
      console.log(`[Upload] Page count: ${pages} (${estimated ? 'needs manual entry' : 'accurate'})`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[Upload] Supabase error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload to storage');
      }

      console.log('[Upload] File uploaded successfully');

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return { url: urlData.publicUrl, pages, estimated };
    } catch (error) {
      console.error('[Upload] Error:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      toast.error('Please sign in to upload files');
      return;
    }

    setIsUploading(true);

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${file.name}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const
    }));

    const currentFiles = [...uploadedFiles, ...newFiles];
    onFilesUploaded(currentFiles);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const fileId = newFiles[i].id;

      try {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('File size exceeds 50MB');
        }

        const { url, pages, estimated } = await uploadToSupabase(file);

        const updatedFiles = currentFiles.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                url, 
                pages,
                estimated,
                estimatedPages: pages,
                status: 'success' as const 
              }
            : f
        );
        onFilesUploaded(updatedFiles);

        if (estimated) {
          toast.warning(
            `${file.name} uploaded. Please enter page count.`,
            { duration: 4000 }
          );
        } else {
          toast.success(`${file.name} uploaded (${pages} ${pages === 1 ? 'page' : 'pages'})`);
        }
        
      } catch (error) {
        console.error('[Upload] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        const updatedFiles = currentFiles.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        );
        onFilesUploaded(updatedFiles);

        toast.error(`${file.name}: ${errorMessage}`);
      }
    }

    setIsUploading(false);
  }, [uploadedFiles, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    maxFiles: 5,
    disabled: isUploading || uploadedFiles.length >= 5,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        if (rejection.errors[0]?.code === 'file-invalid-type') {
          toast.error(
            `${rejection.file.name}: File type not supported. Please upload PDF, DOCX/DOC, or image files (PNG/JPG).`,
            { duration: 5000 }
          );
        }
      });
    }
  });

  return (
    <Card>
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          } ${isUploading || uploadedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600">Uploading and processing...</p>
            </div>
          ) : uploadedFiles.length >= 5 ? (
            <div className="space-y-4">
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">Maximum 5 files reached</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-blue-600 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  PDF, DOCX, DOC, PNG, JPG (max 50MB)
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {uploadedFiles.length > 0 
                  ? `${uploadedFiles.length}/5 files uploaded`
                  : 'Upload up to 5 files'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
