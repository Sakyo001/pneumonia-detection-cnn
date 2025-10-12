import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDropWithDrag = (e: React.DragEvent) => {
    setIsDragging(false);
    handleDrop(e);
  };

  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-105' 
            : previewUrl 
              ? 'border-gray-200 bg-gray-50 hover:border-indigo-300' 
              : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
        }`}
        onDragOver={(e) => {
          handleDragOver(e);
          handleDragEnter(e);
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDropWithDrag}
        onClick={(e) => {
          if (e.target === e.currentTarget || !previewUrl) {
            fileInputRef.current?.click();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative h-64 w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={previewUrl} 
                  alt="X-ray preview" 
                  className="w-full h-full object-contain bg-gray-900"
                />
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Uploaded
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <motion.button 
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                key="change-file-button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove & Choose New
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 py-8"
            >
              <motion.div
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4"
              >
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </motion.div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDragging ? 'Drop your X-ray here' : 'Upload X-Ray Image'}
                </h4>
                <div className="flex flex-col items-center gap-2">
                  <label 
                    htmlFor="xray-upload" 
                    className="relative cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Choose File
                    </span>
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
                  <p className="text-sm text-gray-600">or drag and drop</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                  </svg>
                  PNG, JPG, JPEG
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Max 10MB
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Tips Section */}
      {!previewUrl && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-blue-900 mb-1">Upload Tips</h5>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Ensure the X-ray image is clear and well-lit</li>
                <li>• Frontal chest X-rays provide the best results</li>
                <li>• Higher resolution images yield more accurate analysis</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default XrayUploadSection; 