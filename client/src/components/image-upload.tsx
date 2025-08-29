import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analytics } from "@/lib/posthog";

interface ImageUploadProps {
  onImagesChange: (imageDataUrls: string[]) => void;
  selectedImages: string[];
}

export default function ImageUpload({ onImagesChange, selectedImages }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (files: FileList) => {
    const validImages: string[] = [];
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        // Track image upload
        analytics.trackFeatureUsed('image_upload', {
          file_type: file.type,
          file_size: file.size,
        });

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          validImages.push(result);
          
          // Update the images array when this file is processed
          if (validImages.length === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
            onImagesChange([...selectedImages, ...validImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesSelect(files);
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
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = selectedImages.filter((_, index) => index !== indexToRemove);
    onImagesChange(newImages);
  };

  const removeAllImages = () => {
    onImagesChange([]);
  };

  if (selectedImages.length > 0) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedImages.length} screenshot{selectedImages.length > 1 ? 's' : ''} uploaded
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleButtonClick}
                className="text-blue-600 hover:text-blue-700"
                data-testid="button-add-more-images"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add More
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeAllImages}
                className="text-red-600 hover:text-red-700"
                data-testid="button-remove-all-images"
              >
                <X className="w-4 h-4" />
                Remove All
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  data-testid={`img-uploaded-screenshot-${index}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="w-3 h-3" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            The AI will extract conversation text from {selectedImages.length > 1 ? 'these screenshots' : 'this screenshot'} for analysis
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            data-testid="input-file-upload-multiple"
          />
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
          ? 'border-primary bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
        }
      `}
      onClick={handleButtonClick}
      data-testid="dropzone-image-upload"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-300 dark:text-gray-400">Upload screenshots</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Drag and drop or click to select multiple images
          </p>
        </div> 
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Supports: WhatsApp, Discord, Slack, Teams, SMS, and other messaging apps</p>
          <p className="mt-1">PNG, JPG, JPEG up to 10MB each • Select multiple screenshots at once</p>
        </div>
      </div>
    </div>
  );
}