import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { UploadedFile } from '@/pages/Upload';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
          verbosity: 0
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

      // Get page count
      const { pages, estimated } = await getPageCount(file);
      console.log(`[Upload] Page count: ${pages} (${estimated ? 'needs manual entry' : 'accurate'})`);

      // Upload to Supabase Storage
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

      // Get public URL
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
    // ✅ Check file count limit
    const currentCount = uploadedFiles.length;
    const newCount = acceptedFiles.length;
    const totalCount = currentCount + newCount;

    if (totalCount > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} files. You currently have ${currentCount} file${currentCount !== 1 ? 's' : ''}.`);
      return;
    }

    // ✅ Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 50MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // ✅ REMOVED AUTH CHECK - Allow guest uploads
    // Guest users can now upload files without authentication

    setIsUploading(true);

    // ✅ Show progress toast
    if (acceptedFiles.length > 1) {
      toast.info(`Uploading ${acceptedFiles.length} files...`);
    }

    // Initialize files with uploading status
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${file.name}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const
    }));

    const currentFiles = [...uploadedFiles, ...newFiles];
    onFilesUploaded(currentFiles);

    // ✅ Upload files in parallel for faster performance
    const uploadPromises = acceptedFiles.map(async (file, index) => {
      const fileId = newFiles[index].id;
      
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error('File size exceeds 50MB');
        }

        // Upload file
        const { url, pages, estimated } = await uploadToSupabase(file);

        if (estimated) {
          toast.warning(
            `${file.name} uploaded. Please enter page count.`,
            { duration: 4000 }
          );
        } else {
          toast.success(`${file.name} uploaded (${pages} ${pages === 1 ? 'page' : 'pages'})`);
        }

        return {
          ...newFiles[index],
          url, 
          pages,
          estimated,
          estimatedPages: pages,
          status: 'success' as const 
        };

      } catch (error) {
        console.error(`[Upload] Error for ${file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        toast.error(`${file.name}: ${errorMessage}`);

        return {
          ...newFiles[index],
          status: 'error' as const,
          error: errorMessage
        };
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Update state with final results
    const finalFiles = [...uploadedFiles, ...uploadResults];
    onFilesUploaded(finalFiles);

    setIsUploading(false);

    // ✅ Show summary for multiple files
    if (acceptedFiles.length > 1) {
      const successCount = uploadResults.filter(f => f.status === 'success').length;
      const errorCount = uploadResults.filter(f => f.status === 'error').length;

      if (successCount > 0 && errorCount === 0) {
        toast.success(`All ${successCount} files uploaded successfully!`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.info(`${successCount} succeeded, ${errorCount} failed`);
      }
    }

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
    multiple: true,
    maxFiles: MAX_FILES,
    disabled: isUploading || uploadedFiles.length >= MAX_FILES,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        if (rejection.errors[0]?.code === 'file-invalid-type') {
          toast.error(
            `${rejection.file.name}: File type not supported. Please upload PDF, DOCX/DOC, or image files (PNG/JPG).`,
            { duration: 5000 }
          );
        } else if (rejection.errors[0]?.code === 'too-many-files') {
          toast.error(`You can only upload up to ${MAX_FILES} files at once.`);
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
          } ${isUploading || uploadedFiles.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600">Uploading and processing...</p>
            </div>
          ) : uploadedFiles.length >= MAX_FILES ? (
            <div className="space-y-4">
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">Maximum {MAX_FILES} files reached</p>
              <p className="text-xs text-gray-500">Remove files to upload more</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-blue-600 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  or click to browse
                </p>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>PDF, DOCX, DOC, PNG, JPG (max 50MB each)</p>
                <p className="font-medium text-blue-600">
                  {uploadedFiles.length > 0 
                    ? `${uploadedFiles.length}/${MAX_FILES} files uploaded - ${MAX_FILES - uploadedFiles.length} remaining`
                    : `Upload up to ${MAX_FILES} files at once`
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
