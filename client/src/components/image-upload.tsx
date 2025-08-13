import { useState, useRef } from "react";
import { Upload, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void;
  onImageRemove: () => void;
  selectedImage: string | null;
}

export default function ImageUpload({ onImageSelect, onImageRemove, selectedImage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64 for display and API call
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (selectedImage) {
    return (
      <div className="relative">
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Screenshot uploaded</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-gray-500 hover:text-red-500"
              data-testid="button-remove-image"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <img 
            src={selectedImage} 
            alt="Uploaded screenshot" 
            className="max-h-48 max-w-full rounded-lg object-contain"
            data-testid="img-uploaded-screenshot"
          />
          <p className="text-xs text-gray-500 mt-2">
            The AI will extract text from this image and analyze the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="area-image-upload"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      <div className="space-y-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Image className="w-6 h-6 text-gray-500" />
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Upload Screenshot</h3>
          <p className="text-xs text-gray-500 mb-3">
            Upload a screenshot of a conversation from any messaging app
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-primary border-primary hover:bg-primary/5"
          data-testid="button-select-image"
        >
          <Upload className="w-4 h-4 mr-2" />
          Select Image
        </Button>
        
        <p className="text-xs text-gray-400">
          Or drag and drop an image here
        </p>
      </div>
    </div>
  );
}