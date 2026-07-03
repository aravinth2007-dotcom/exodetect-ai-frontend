'use client';

import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FileUploaderProps {
  onFileSelect: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export function FileUploader({ onFileSelect, isLoading = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const validateAndProcessFile = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setFileName(file.name);
      await onFileSelect(file);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      setFileName(null);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await validateAndProcessFile(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        await validateAndProcessFile(files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Light Curve Data</CardTitle>
        <CardDescription>
          Upload a CSV file containing NASA Kepler light curve data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Drag and drop your file</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click the button below to select a CSV file
          </p>
          <label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              disabled={isLoading}
              className="hidden"
            />
            <Button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector(
                  'input[type="file"]'
                ) as HTMLInputElement;
                input?.click();
              }}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading ? 'Analyzing...' : 'Select File'}
            </Button>
          </label>

          {fileName && (
            <div className="mt-4 text-sm text-muted-foreground">
              Selected: <span className="font-medium">{fileName}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/50 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Expected CSV Format:</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Your CSV file should contain columns for time and flux data. Common column names:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• <span className="font-mono">TIME</span> or <span className="font-mono">JD</span> (time data)</li>
            <li>• <span className="font-mono">FLUX</span>, <span className="font-mono">SAP_FLUX</span>, or <span className="font-mono">PDCSAP_FLUX</span> (flux data)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
