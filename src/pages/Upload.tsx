import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import FileUpload from '@/components/upload/FileUpload';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  pages?: number;
  estimated?: boolean;
  estimatedPages?: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedFiles = sessionStorage.getItem('uploadedFiles');
    if (savedFiles) {
      try {
        const files = JSON.parse(savedFiles);
        setUploadedFiles(files);
      } catch (error) {
        console.error('Failed to load saved files:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (uploadedFiles.length > 0) {
      sessionStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles]);

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  const handleRemoveFile = async (fileId: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    
    if (fileToRemove && fileToRemove.url) {
      try {
        // Extract file path from URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/documents/path/to/file.pdf
        const urlParts = fileToRemove.url.split('/documents/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          console.log(`[Delete] Removing file from storage: ${filePath}`);
          
          // Delete from Supabase Storage
          const { error } = await supabase.storage
            .from('documents')
            .remove([filePath]);
          
          if (error) {
            console.error('[Delete] Error removing file from storage:', error);
            toast.error('Failed to delete file from storage');
          } else {
            console.log('[Delete] File successfully removed from storage');
            toast.success('File removed');
          }
        }
      } catch (error) {
        console.error('[Delete] Error:', error);
      }
    }
    
    // Remove from state
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      if (updated.length === 0) {
        sessionStorage.removeItem('uploadedFiles');
      }
      return updated;
    });
  };

  const handlePageCountChange = (fileId: string, pageCount: number) => {
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, pages: Math.max(1, pageCount) } : f
      )
    );
  };

  const proceedToCustomize = () => {
    const filesWithoutPages = uploadedFiles.filter(
      f => f.status === 'success' && (!f.pages || f.pages <= 0)
    );

    if (filesWithoutPages.length > 0) {
      alert('Please enter valid page count for all DOCX files before proceeding.');
      return;
    }

    const successFiles = uploadedFiles.filter(f => f.status === 'success');
    
    if (successFiles.length === 0) return;
    
    sessionStorage.setItem('uploadedFiles', JSON.stringify(successFiles));
    navigate('/customize');
  };

  const getFileStatus = (file: UploadedFile): 'complete' | 'pending' | 'error' | 'uploading' => {
    if (file.status === 'uploading') return 'uploading';
    if (file.status === 'error') return 'error';
    if (file.status === 'success' && file.estimated && (!file.pages || file.pages <= 0)) return 'pending';
    if (file.status === 'success' && file.pages && file.pages > 0) return 'complete';
    return 'pending';
  };

  const successfulUploads = uploadedFiles.filter(f => f.status === 'success').length;
  const failedUploads = uploadedFiles.filter(f => f.status === 'error').length;
  const pendingPageCount = uploadedFiles.filter(f => 
    f.status === 'success' && f.estimated && (!f.pages || f.pages <= 0)
  ).length;

  const totalPages = uploadedFiles
    .filter(f => f.status === 'success' && f.pages && f.pages > 0)
    .reduce((sum, f) => sum + (f.pages || 0), 0);

  const allPageCountsValid = uploadedFiles
    .filter(f => f.status === 'success')
    .every(f => f.pages && f.pages > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
            <p className="text-gray-600">
              Upload PDF, DOCX, or image files to get started
            </p>
            {/* ✅ Add helpful info box */}
            <div className="mt-4 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-800">
                📁 Upload up to <strong>5 files</strong> at once (50MB max per file)
              </p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Files Uploaded</p>
                  <p className="text-2xl font-bold text-blue-600">{successfulUploads}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalPages > 0 ? totalPages : '-'}
                  </p>
                </div>
                {pendingPageCount > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Pending Input</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingPageCount}</p>
                  </div>
                )}
                {failedUploads > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{failedUploads}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <FileUpload 
            onFilesUploaded={handleFilesUploaded}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />

          {uploadedFiles.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Uploaded Files ({uploadedFiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((file) => {
                    const fileStatus = getFileStatus(file);
                    
                    return (
                      <div 
                        key={file.id} 
                        className={`p-4 rounded-lg border ${
                          fileStatus === 'complete' ? 'bg-green-50 border-green-200' :
                          fileStatus === 'pending' ? 'bg-orange-50 border-orange-200' :
                          fileStatus === 'error' ? 'bg-red-50 border-red-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {fileStatus === 'complete' && (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          )}
                          {fileStatus === 'pending' && (
                            <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          )}
                          {fileStatus === 'error' && (
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          {fileStatus === 'uploading' && (
                            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900 truncate">{file.name}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(file.id)}
                                className="ml-2 h-7"
                              >
                                Remove
                              </Button>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            {file.status === 'success' && (
                              <>
                                {file.estimated ? (
                                  <div className="mt-2 p-3 bg-white border border-orange-300 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <Label htmlFor={`page-count-${file.id}`} className="text-xs font-medium">
                                        Enter page count:
                                      </Label>
                                      <Input
                                        id={`page-count-${file.id}`}
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={file.pages || ''}
                                        placeholder="e.g., 46"
                                        className="w-24 h-8 text-sm"
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value && parseInt(value) > 0) {
                                            handlePageCountChange(file.id, parseInt(value));
                                          } else if (value === '') {
                                            handlePageCountChange(file.id, 0);
                                          }
                                        }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                      ⚠️ Owner will verify before printing
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-green-600 text-sm">
                                      ✓ {file.pages} {file.pages === 1 ? 'page' : 'pages'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({file.type.includes('pdf') ? 'PDF - auto-detected' : 'Image'})
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {file.status === 'error' && (
                              <p className="text-sm text-red-600 mt-1">{file.error || 'Upload failed'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">File Status Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span><strong>Green:</strong> File ready (page count entered)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded"></div>
                  <span><strong>Orange:</strong> Waiting for page count input</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
                  <span><strong>Red:</strong> Upload failed</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {successfulUploads > 0 && (
            <div className="mt-6">
              <Button 
                onClick={proceedToCustomize}
                size="lg"
                className="w-full"
                disabled={!allPageCountsValid}
              >
                {!allPageCountsValid ? (
                  'Please enter page count for all DOCX files'
                ) : (
                  <>
                    Customize Print Options ({successfulUploads} {successfulUploads === 1 ? 'file' : 'files'}, {totalPages} {totalPages === 1 ? 'page' : 'pages'})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
