import React from 'react';

interface XrayUploadSectionProps {
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (u: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

const XrayUploadSection: React.FC<XrayUploadSectionProps> = ({
  selectedFile, setSelectedFile, previewUrl, setPreviewUrl, fileInputRef, handleFileChange, handleDragOver, handleDrop
}) => (
  <div>
    <h3 className="text-lg font-medium text-gray-800 mb-4">X-Ray Upload</h3>
    <div 
      className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          fileInputRef.current?.click();
        }
      }}
    >
      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative h-48 w-full max-w-xs mx-auto">
            <img 
              src={previewUrl} 
              alt="X-ray preview" 
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>
          <p className="text-sm text-gray-600 break-all">{selectedFile?.name}</p>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              setPreviewUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-indigo-600 text-sm hover:text-indigo-800"
            key="change-file-button"
          >
            Change file
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col sm:flex-row text-sm text-gray-600 justify-center items-center gap-1">
            <label 
              htmlFor="xray-upload" 
              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
              onClick={e => e.stopPropagation()}
            >
              <span>Upload an X-ray</span>
              <input 
                id="xray-upload" 
                name="xray-upload" 
                type="file" 
                className="sr-only" 
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                key="xray-file-input"
                onClick={e => e.stopPropagation()}
              />
            </label>
            <p className="pl-0 sm:pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
        </div>
      )}
    </div>
  </div>
);

export default XrayUploadSection; 