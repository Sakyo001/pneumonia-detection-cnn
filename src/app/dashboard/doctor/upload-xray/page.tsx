"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import PatientInfoForm from './PatientInfoForm';
import EnhancedPatientInfoForm from './EnhancedPatientInfoForm';
import XrayUploadSection from './XrayUploadSection';
import AnalysisResultDisplay from './AnalysisResultDisplay';
import PrintOnlyReport from './PrintOnlyReport';
import Footer from './Footer';
import type { SymptomData } from './symptom-scoring';

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
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientMiddleName, setPatientMiddleName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("male");
  const [patientNotes, setPatientNotes] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [patientLocation, setPatientLocation] = useState("");
  const [reportedSymptoms, setReportedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  
  // Enhanced symptom data for accuracy improvement
  const [symptomData, setSymptomData] = useState<SymptomData>({
    // Primary symptoms
    fever: false,
    persistentCough: false,
    chestPain: false,
    difficultyBreathing: false,
    
    // Secondary symptoms
    fatigue: false,
    rapidBreathing: false,
    cracklingSounds: false,
    
    // Cough characteristics
    productiveCough: false,
    dryHackingCough: false,
    
    // Sputum characteristics
    clearSputum: false,
    yellowGreenSputum: false,
    bloodInSputum: false,
    
    // Onset
    suddenOnset: false,
    gradualOnset: false,
    
    // Associated symptoms
    muscleAches: false,
    chillsAndShaking: false,
    headache: false,
    soreThroat: false,
    nauseaVomiting: false,
    confusion: false,
    
    // Risk factors
    recentColdFlu: false,
    weakenedImmuneSystem: false,
    smoker: false,
    age65Plus: false,
    ageUnder5: false,
    chronicLungDisease: false,
    heartDisease: false,
    diabetes: false,
    
    // COVID-19 specific
    lossOfTasteSmell: false,
    knownCovidExposure: false,
    suddenSevereBreathing: false,
    
    // TB specific
    nightSweats: false,
    weightLoss: false,
    chronicCough: false,
    chronicCoughWeeks: undefined,
    hemoptysis: false,
    travelToTBEndemicArea: false,
    hivPositiveOrImmunocompromised: false,
    closeContactWithTBPatient: false,
    
    // Vital signs (optional)
    vitalSigns: {
      temperature: undefined,
      oxygenSaturation: undefined,
      heartRate: undefined,
      respiratoryRate: undefined,
    }
  });
  
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
    
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      setError('Please upload a valid image file (PNG, JPG, JPEG) or PDF.');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    
    // Check file size (10MB for images, 50MB for PDFs)
    const maxSize = isPDF ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size exceeds ${isPDF ? '50MB' : '10MB'} limit.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    
    setError(null);
    setSelectedFile(file);
    
    if (isPDF) {
      // For PDFs, use a data URI with PDF mime type
      setPreviewUrl('data:application/pdf;base64,pdf');
    } else {
      setPreviewUrl(URL.createObjectURL(file));
    }
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
      
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) {
        setError('Please upload a valid image file (PNG, JPG, JPEG) or PDF.');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      // Check file size (10MB for images, 50MB for PDFs)
      const maxSize = isPDF ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File size exceeds ${isPDF ? '50MB' : '10MB'} limit.`);
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      setAnalysisResult(null);
      
      if (isPDF) {
        setPreviewUrl('data:application/pdf;base64,pdf');
      } else {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select an X-ray image to upload.");
      return;
    }

    if (!patientFirstName.trim() || !patientLastName.trim()) {
      setError("Please enter the patient's first and last name.");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("xrayFile", selectedFile);
      formData.append("patientFirstName", patientFirstName);
      formData.append("patientMiddleName", patientMiddleName);
      formData.append("patientLastName", patientLastName);
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
        console.log("Prediction is truthy?", !!result.prediction);
        console.log("Prediction type:", typeof result.prediction);
        console.log("Confidence value:", result.confidence);
        console.log("Diagnosis value:", result.diagnosis);
        console.log("Is validation only:", result.isValidationOnly);
        console.log("DB saved:", result.dbSaved);
        console.log("Result keys:", Object.keys(result));
        console.log("=====================================");
        
        setAnalysisResult(result);
        console.log("[DEBUG] State updated with result, currentStep set to 0");
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
    setPatientFirstName("");
    setPatientMiddleName("");
    setPatientLastName("");
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
    <main className="flex flex-col min-h-screen bg-white">
      {/* Enhanced Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI X-Ray Analysis
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Advanced pneumonia detection powered by EfficientNet</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Link href="/dashboard/doctor">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Dashboard
                </motion.button>
              </Link>
              <Link href="/dashboard/doctor/all-scans">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  All Scans
                </motion.button>
              </Link>
              <Link href="/auth/logout">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload X-Ray for Analysis</h2>
              <p className="text-gray-600">Fill in patient information and upload the X-ray image for AI-powered diagnosis</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Model Accuracy:</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {accuracy ? `${accuracy}%` : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-8 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-2">AI-Powered Pneumonia Detection</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Our advanced EfficientNet model analyzes chest X-rays with up to <span className="font-bold">96% accuracy</span>, 
                providing rapid diagnosis and detailed insights to support your clinical decisions. 
                Each analysis includes confidence scores, pneumonia type classification, and recommended actions.
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3"
            >
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main form and result side-by-side */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8"
        >
          {/* Check if we have a medical result (non-validation) to show full-width */}
          {analysisResult && !["NON_XRAY", "COVID", "TB", "NON_XRAY_SAFETY"].includes(analysisResult.prediction || "") ? (
            /* Full-width results for medical diagnoses */
            <div className="space-y-6">
              <AnalysisResultDisplay
                analysisResult={analysisResult}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                totalSteps={totalSteps}
                previewUrl={previewUrl}
                patientName={[patientFirstName, patientMiddleName, patientLastName].filter(Boolean).join(' ')}
                patientAge={patientAge}
                patientGender={patientGender}
                patientNotes={patientNotes}
                medicalHistory={medicalHistory}
                reportedSymptoms={reportedSymptoms}
                resetForm={resetForm}
              />
            </div>
          ) : (
            /* Two-column layout for form + validation results or upload */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left: Patient Info Form always visible */}
              <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Patient Information</h3>
              </div>
              <EnhancedPatientInfoForm
                patientFirstName={patientFirstName}
                setPatientFirstName={setPatientFirstName}
                patientMiddleName={patientMiddleName}
                setPatientMiddleName={setPatientMiddleName}
                patientLastName={patientLastName}
                setPatientLastName={setPatientLastName}
                patientAge={patientAge}
                setPatientAge={setPatientAge}
                patientGender={patientGender}
                setPatientGender={setPatientGender}
                referenceNumber={referenceNumber}
                patientNotes={patientNotes}
                setPatientNotes={setPatientNotes}
                medicalHistory={medicalHistory}
                setMedicalHistory={setMedicalHistory}
                symptomData={symptomData}
                setSymptomData={setSymptomData}
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
            </div>
            
            {/* Right: Upload or Result */}
            <div className="space-y-6">
              {!analysisResult ? (
                <>
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">X-Ray Upload</h3>
                  </div>
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
                </>
              ) : (
                <AnalysisResultDisplay
                  analysisResult={analysisResult}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  totalSteps={totalSteps}
                  previewUrl={previewUrl}
                  patientName={[patientFirstName, patientMiddleName, patientLastName].filter(Boolean).join(' ')}
                  patientAge={patientAge}
                  patientGender={patientGender}
                  patientNotes={patientNotes}
                  medicalHistory={medicalHistory}
                  reportedSymptoms={reportedSymptoms}
                  resetForm={resetForm}
                />
              )}
            </div>
          </div>
          )}
          
          {/* Server status and submit button (only show before analysis) */}
          {!analysisResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-gray-100"
            >
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                {/* Server Status Card */}
                <div className="flex-1 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`relative w-3 h-3 rounded-full ${
                        serverStatus === 'online' ? 'bg-green-500' : 
                        serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}>
                        {serverStatus === 'online' && (
                          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Server Status: <span className={`${
                            serverStatus === 'online' ? 'text-green-600' : 
                            serverStatus === 'offline' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                          </span>
                        </p>
                        {serverStatus === 'offline' && (
                          <p className="text-xs text-red-600 mt-1">Using fallback predictions</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs bg-white text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 border border-indigo-200 transition-all shadow-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          checkServerStatus();
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Check Status
                        </span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 border border-gray-200 transition-all shadow-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(API_URL, '_blank');
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View API
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: isUploading ? 1 : 1.02 }}
                  whileTap={{ scale: isUploading ? 1 : 0.98 }}
                  className="lg:w-auto w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  disabled={isUploading}
                  form={undefined}
                  onClick={handleUpload as any}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing X-Ray...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Analyze X-Ray</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
                
      {/* Footer */}
      <Footer />
      
      {/* Print-only formal letter format */}
      {clientReady && analysisResult && (
        <PrintOnlyReport 
          analysisResult={analysisResult} 
          doctorInfo={doctorInfo} 
          printDate={printDate} 
          patientName={[patientFirstName, patientMiddleName, patientLastName].filter(Boolean).join(' ')} 
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