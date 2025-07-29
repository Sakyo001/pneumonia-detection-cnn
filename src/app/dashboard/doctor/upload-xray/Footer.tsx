import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => (
  <footer className="bg-white border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex justify-center md:justify-start">
        <div className="flex items-center">
          <div className="mr-2 flex items-center justify-center w-7 h-7">
            <Image src="/icons/logo.png" alt="Logo" width={16} height={16} />
          </div>
          <span className="text-gray-500 text-sm">© 2025 MedRecord Hub. All rights reserved.</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer; 