import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

const UploadPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !currentOrg) return;
    
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setProgress('Uploading file...');

    try {
      // 1. Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setProgress('Processing data...');

      // 2. Call Edge Function to process the file
      const { data, error: functionError } = await supabase.functions.invoke('ingest_run', {
        body: {
          bucket: 'uploads',
          path: fileName,
          org_id: currentOrg.id // Use currentOrg.id instead of user.id
        }
      });

      if (functionError) throw functionError;

      // 3. Show success toast
      toast({
        title: "Upload successful!",
        description: `Inserted ${data.inserted} rows • States crossed: ${data.states_crossed.join(', ')}`,
      });

      // 4. Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress('');
    }
  }, [user, currentOrg, toast, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Organization Selected</h2>
          <p className="text-gray-600 mb-6">Please select an organization to upload data.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Sales Data - {currentOrg.name}</h1>
          <p className="text-gray-600">Upload your sales data CSV to analyze nexus status</p>
        </div>

        <Card className="rounded-2xl shadow-lg border-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Sales Data Upload
            </CardTitle>
            <CardDescription>
              Drag and drop your CSV file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50 animate-pulse' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
                  <p className="text-lg text-gray-600">{progress}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  {isDragActive ? (
                    <p className="text-lg text-blue-600">Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="text-lg text-gray-600 mb-2">
                        Drag and drop your CSV file here, or click to select
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports CSV, XLS, and XLSX files
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isUploading && (
              <div className="mt-6 flex justify-center">
                <Button onClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  input?.click();
                }}>
                  Select File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
