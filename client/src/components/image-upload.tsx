import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analytics } from "@/lib/posthog";

interface ImageUploadProps {
  onImageSelect: (imageDataUrl: string) => void;
  onImageRemove: () => void;
  selectedImage: string | null;
}

export default function ImageUpload({ onImageSelect, onImageRemove, selectedImage }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Track image upload
    analytics.trackFeatureUsed('image_upload', {
      file_type: file.type,
      file_size: file.size,
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (selectedImage) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Screenshot uploaded</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onImageRemove}
              className="text-red-600 hover:text-red-700"
              data-testid="button-remove-image"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative">
            <img
              src={selectedImage}
              alt="Uploaded conversation screenshot"
              className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
              data-testid="img-uploaded-screenshot"
            />
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            The AI will extract conversation text from this screenshot for analysis
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragOver 
          ? 'border-primary bg-blue-50' 
          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }
      `}
      onClick={handleButtonClick}
      data-testid="dropzone-image-upload"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-gray-600" />
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-900">Upload a screenshot</p>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop or click to select an image
          </p>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>Supports: WhatsApp, Discord, Slack, Teams, SMS, and other messaging apps</p>
          <p className="mt-1">PNG, JPG, JPEG up to 10MB</p>
        </div>
      </div>
    </div>
  );
}