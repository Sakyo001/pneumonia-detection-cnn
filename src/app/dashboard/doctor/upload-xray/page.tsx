"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import PatientInfoForm from './PatientInfoForm';
import XrayUploadSection from './XrayUploadSection';
import AnalysisResultDisplay from './AnalysisResultDisplay';
import PrintOnlyReport from './PrintOnlyReport';
import Footer from './Footer';

// Define the analysis result type to fix TypeScript errors
interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  pneumoniaType: string | null;
  severity: string | null;
  severityDescription: string | null;
  recommendedAction: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  referenceNumber: string;
  originalReference?: string;
  timestamp: string;
  usingMock?: boolean;
  error?: string;
  dbSaved?: boolean;
  scanId?: string;
  message?: string;
  symptoms?: string[];
  medicalHistory: string;
  patientNotes: string;
  isValidationOnly?: boolean; // Added for validation-only results
}

// Extend AnalysisResult to allow 'prediction' and optional 'confidence'
type ExtendedAnalysisResult = AnalysisResult & { 
  prediction?: string; 
  confidence?: number; 
  isValidationOnly?: boolean;
};

// Define doctor info interface
type DoctorInfo = {
  name: string;
  title: string;
  department: string;
  hospital: string;
};

// Use environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://efficientnetb0-validation.onrender.com';

export default function UploadXrayPage() {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  
  // Add print styles
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      styleRef.current.innerHTML = `
        @media print {
          header, footer, .no-print, button, h2.text-2xl, .bg-indigo-50 {
            display: none !important;
          }
          body, html {
            margin: 0;
            padding: 0;
            font-size: 12pt;
            background: white !important;
          }
          .page-break {
            page-break-after: always;
            clear: both;
            display: block;
            height: 0;
          }
          .print-only {
            display: block !important;
          }
          @page {
            size: letter;
            margin: 0.75in;
          }
          .mx-auto {
            float: none !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          h1, h2, h3, p {
            orphans: 3;
            widows: 3;
          }
          h1, h2, h3 {
            page-break-after: avoid;
          }
        }
      `;
      document.head.appendChild(styleRef.current);
    }
    
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExtendedAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [modelInfo, setModelInfo] = useState<string>("EfficientNet Model");
  const [accuracy, setAccuracy] = useState<number | null>(96);
  
  // Step navigation for results display
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  
  // Patient information
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("male");
  const [patientNotes, setPatientNotes] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [patientLocation, setPatientLocation] = useState("");
  const [reportedSymptoms, setReportedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Doctor info
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({
    name: "Dr. Jonathan Smith",
    title: "Radiologist, MD",
    department: "Department of Radiology",
    hospital: "Central Medical Center"
  });

  // Location state
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedRegionCode, setSelectedRegionCode] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCityCode, setSelectedCityCode] = useState("");
  const [barangays, setBarangays] = useState<any[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState("");

  // Client ready state
  const [clientReady, setClientReady] = useState(false);
  const [printDate, setPrintDate] = useState('');

  // Common symptoms
  const commonSymptoms = [
    "Bluish lips or fingernails", "Chest pain", "Chills", "Confusion (especially in elderly)",
    "Cough (dry or productive)", "Diarrhea", "Fatigue", "Fever", "Headache", "Loss of appetite",
    "Muscle aches", "Nausea", "Night sweats", "Rapid breathing", "Shortness of breath",
    "Sputum production", "Sweating", "Vomiting", "Weight loss", "Wheezing"
  ];

  // Initialize component
  useEffect(() => {
    setClientReady(true);
    setPrintDate(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    setReferenceNumber(generateReferenceNumber());
    
    // Fetch regions
    fetch("https://psgc.gitlab.io/api/regions/")
      .then(res => res.json())
      .then(data => setRegions(data));
  }, []);

  // Fetch cities when region changes
  useEffect(() => {
    if (selectedRegionCode) {
      fetch(`https://psgc.gitlab.io/api/regions/${selectedRegionCode}/cities-municipalities/`)
        .then(res => res.json())
        .then(data => setCities(data));
      setSelectedCity("");
      setSelectedCityCode("");
      setBarangays([]);
      setSelectedBarangay("");
    } else {
      setCities([]);
      setSelectedCity("");
      setSelectedCityCode("");
      setBarangays([]);
      setSelectedBarangay("");
    }
  }, [selectedRegionCode]);

  // Fetch barangays when city changes
  useEffect(() => {
    if (selectedCityCode) {
      fetch(`https://psgc.gitlab.io/api/regions/${selectedRegionCode}/barangays/`)
        .then(res => res.json())
        .then(data => {
          const cityBarangays = data.filter((brgy: any) => brgy.cityCode === selectedCityCode);
          setBarangays(cityBarangays);
        });
      setSelectedBarangay("");
    } else {
      setBarangays([]);
      setSelectedBarangay("");
    }
  }, [selectedCityCode, selectedRegionCode]);

  // Update patient location
  useEffect(() => {
    if (selectedRegion && selectedCity && selectedBarangay) {
      setPatientLocation(`${selectedBarangay}, ${selectedCity}, ${selectedRegion}`);
    } else {
      setPatientLocation("");
    }
  }, [selectedRegion, selectedCity, selectedBarangay]);

  // Utility functions
  const generateReferenceNumber = () => {
    if (typeof window === 'undefined') return 'XR-XXXXXX-XXXX';
    const now = new Date();
    const dateStr = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `XR-${dateStr}-${randomPart}`;
  };

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const apiTestResponse = await fetch('/api/model-test');
      if (apiTestResponse.ok) {
        const testData = await apiTestResponse.json();
        if (testData.success && testData.isModelLoaded) {
          setServerStatus('online');
          setModelInfo(`Deployed API at ${testData.apiUrl} - Model loaded successfully`);
          return;
        }
      }
      const response = await fetch('/api/model-status');
      if (response.ok) {
        const data = await response.json();
        setServerStatus('online');
        if (data.model) {
          setModelInfo(data.model);
        }
      } else {
        setServerStatus('offline');
      }
    } catch (err) {
      console.error('Error checking server status:', err);
      setServerStatus('offline');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
      setAnalysisResult(null);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select an X-ray image to upload.");
      return;
    }

    if (!patientName.trim()) {
      setError("Please enter the patient's name.");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("xrayFile", selectedFile);
      formData.append("patientName", patientName);
      formData.append("patientAge", patientAge);
      formData.append("patientGender", patientGender);
      formData.append("patientNotes", patientNotes);
      formData.append("medicalHistory", medicalHistory);
      formData.append("referenceNumber", referenceNumber);
      formData.append("patientLocation", patientLocation);
      formData.append("region", selectedRegion);
      formData.append("city", selectedCity);
      formData.append("barangay", selectedBarangay);
      formData.append("reportedSymptoms", JSON.stringify(reportedSymptoms));
      
      const response = await fetch('/api/upload-xray', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json() as ExtendedAnalysisResult;
      
      if (result.error) {
        setError(result.error);
        setAnalysisResult(null);
      } else {
        console.log("=== FRONTEND ANALYSIS RESULT DEBUG ===");
        console.log("Full result object:", result);
        console.log("Prediction value:", result.prediction);
        console.log("Confidence value:", result.confidence);
        console.log("Is validation only:", result.isValidationOnly);
        console.log("DB saved:", result.dbSaved);
        console.log("=====================================");
        
        setAnalysisResult(result);
        setCurrentStep(0); // Start with the first step
        
        // Log the successful analysis
        if (result.isValidationOnly) {
          console.log("Validation result - not saved to database:", result);
        } else {
          console.log("Analysis complete with database save:", result);
        }
      }
    } catch (err) {
      console.error("Error uploading X-ray:", err);
      setError("An error occurred while uploading and analyzing the X-ray. Please try again or contact support if the issue persists.");
      setAnalysisResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
    setPatientName("");
    setPatientAge("");
    setPatientGender("male");
    setPatientNotes("");
    setMedicalHistory("");
    setCurrentStep(0);
    setReferenceNumber(generateReferenceNumber());
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPatientLocation("");
    setSelectedRegion("");
    setSelectedRegionCode("");
    setSelectedCity("");
    setSelectedCityCode("");
    setSelectedBarangay("");
    setReportedSymptoms([]);
    setCustomSymptom("");
  };

  const router = useRouter();

  return (
    <main className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex items-center justify-center w-8 h-8">
                <Image src="/icons/logo.png" alt="Logo" width={20} height={20} />
              </div>
              <h1 className="font-semibold text-gray-800 text-lg">MedRecord Hub</h1>
            </div>
            <Link 
              href="/dashboard/doctor" 
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow w-full max-w-full overflow-x-auto px-2 sm:px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload X-Ray for Analysis</h2>
        <div className="text-xs text-gray-500 mb-2">Model accuracy: {accuracy ? `${accuracy}%` : 'N/A'}</div>
        
        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 mb-6">
          <div className="flex items-center">
            <div className="mr-3 text-indigo-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            </div>
            <div>
              <p className="text-sm text-indigo-800 font-medium">Using EfficientNet model for highly accurate pneumonia detection</p>
              <p className="text-xs text-indigo-600 mt-0.5">Our EfficientNet model achieves up to 96% accuracy on pneumonia classification from chest X-rays.</p>
            </div>
          </div>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Main form and result side-by-side */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-50 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Patient Info Form always visible */}
            <PatientInfoForm
              patientName={patientName}
              setPatientName={setPatientName}
              patientAge={patientAge}
              setPatientAge={setPatientAge}
              patientGender={patientGender}
              setPatientGender={setPatientGender}
              referenceNumber={referenceNumber}
              patientNotes={patientNotes}
              setPatientNotes={setPatientNotes}
              medicalHistory={medicalHistory}
              setMedicalHistory={setMedicalHistory}
              reportedSymptoms={reportedSymptoms}
              setReportedSymptoms={setReportedSymptoms}
              customSymptom={customSymptom}
              setCustomSymptom={setCustomSymptom}
              commonSymptoms={commonSymptoms}
              regions={regions}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              selectedRegionCode={selectedRegionCode}
              setSelectedRegionCode={setSelectedRegionCode}
              cities={cities}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              selectedCityCode={selectedCityCode}
              setSelectedCityCode={setSelectedCityCode}
              barangays={barangays}
              selectedBarangay={selectedBarangay}
              setSelectedBarangay={setSelectedBarangay}
            />
            {/* Right: Upload or Result */}
          {!analysisResult ? (
              <XrayUploadSection
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
              />
            ) : (
              <AnalysisResultDisplay
                analysisResult={analysisResult}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                totalSteps={totalSteps}
                previewUrl={previewUrl}
                patientName={patientName}
                patientAge={patientAge}
                patientGender={patientGender}
                patientNotes={patientNotes}
                reportedSymptoms={reportedSymptoms}
                resetForm={resetForm}
              />
                    )}
                  </div>
          {/* Server status and submit button (only show before analysis) */}
          {!analysisResult && (
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mt-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <div className={`w-2 h-2 rounded-full ${
                    serverStatus === 'online' ? 'bg-green-500' : 
                    serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-xs text-gray-600">Server: {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}</span>
                  <button 
                    className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2 text-xs text-indigo-600 cursor-pointer hover:text-indigo-800 hover:underline border border-indigo-100 rounded-md px-3 py-1 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      checkServerStatus();
                    }}
                  >
                    Check Status
                  </button>
                  <button 
                    className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md cursor-pointer hover:bg-indigo-200 border border-indigo-200 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                    window.open(API_URL, '_blank');
                    }}
                  >
                    View API
                  </button>
                  {serverStatus === 'offline' && (
                    <span className="ml-2 text-xs text-red-500">
                      Using fallback predictions
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isUploading}
                form={undefined}
                onClick={handleUpload as any}
                >
                  {isUploading ? 'Analyzing...' : 'Analyze X-Ray'}
                </button>
                    </div>
                  )}
                  </div>
                </div>
                
      {/* Footer */}
      <Footer />
      
      {/* Print-only formal letter format */}
      {clientReady && analysisResult && (
        <PrintOnlyReport 
          analysisResult={analysisResult} 
          doctorInfo={doctorInfo} 
          printDate={printDate} 
          patientName={patientName} 
          patientAge={patientAge} 
          patientGender={patientGender} 
          patientNotes={patientNotes} 
          patientLocation={patientLocation} 
          previewUrl={previewUrl} 
        />
      )}
    </main>
  );
} 