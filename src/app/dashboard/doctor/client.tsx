"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// LogoutModal Component
function LogoutModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Semi-transparent backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Confirm Logout</h2>
            <p className="text-gray-600">
              Are you sure you want to log out of your account?
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Yes, Log Out
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-white text-indigo-600 font-medium rounded-md border border-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// New Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  percentage, 
  increasing = true 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  percentage?: number;
  increasing?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all relative overflow-hidden group"
    >
      {/* Background gradient decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${color}-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity`}></div>
      
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <motion.h3 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
              className="text-3xl font-bold text-gray-900"
            >
              {value.toLocaleString()}
            </motion.h3>
          </div>
          <div className={`p-3 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl shadow-lg`}>
            {icon}
          </div>
        </div>
        
        {percentage !== undefined && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className={`flex items-center gap-1 ${increasing ? 'text-green-600' : 'text-red-600'} bg-${increasing ? 'green' : 'red'}-50 px-2 py-1 rounded-lg`}>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={increasing ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} 
                />
              </svg>
              <span className="text-sm font-bold">{percentage}%</span>
            </div>
            <span className="text-xs text-gray-500">vs last month</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Donut Chart Component
function DonutChart({ normalCount, pneumoniaCount }: { normalCount: number; pneumoniaCount: number }) {
  const total = normalCount + pneumoniaCount;
  const normalPercentage = total > 0 ? Math.round((normalCount / total) * 100) : 0;
  const pneumoniaPercentage = total > 0 ? Math.round((pneumoniaCount / total) * 100) : 0;
  
  // Calculate the circumference of the circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the dash offset for each segment
  const normalDashOffset = circumference * (1 - normalPercentage / 100);
  const pneumoniaDashOffset = circumference; // Start at full circle
  
  return (
    <div className="w-48 mx-auto flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth="10" 
          />
          
          {/* Normal patients segment */}
          <motion.circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="10" 
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: normalDashOffset }}
            transition={{ duration: 1, delay: 0.5 }}
            transform="rotate(-90 50 50)"
          />
          
          {/* Pneumonia patients segment - only showing the part that's not normal */}
          <motion.circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="none" 
            stroke="#ef4444" 
            strokeWidth="10" 
            strokeDasharray={circumference} 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (normalPercentage / 100) }}
            transition={{ duration: 1, delay: 0.8 }}
            transform={`rotate(${360 * (1 - normalPercentage / 100) - 90} 50 50)`}
          />
          
          {/* Center text */}
          <text 
            x="50" 
            y="45" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-lg font-bold text-gray-700"
          >
            {total}
          </text>
          <text 
            x="50" 
            y="60" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-xs text-gray-500"
          >
            Total scans
          </text>
        </svg>
      </div>
      {/* Legend */}
      <div className="mt-4 w-full">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-gray-600">Normal ({normalPercentage}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span className="text-gray-600">Pneumonia ({pneumoniaPercentage}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function BarChart({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-sm">No data available.</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 0);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm text-gray-600 truncate pr-2">{item.name}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-5">
              <motion.div
                className="bg-indigo-500 h-5 rounded-full flex items-center justify-end pr-2"
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <span className="text-white text-xs font-medium">{item.value}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recent Scans Table Component
function RecentScansTable({ scans }: { scans: any[] }) {
  return (
    <div className="overflow-x-auto w-full rounded-xl border border-gray-100">
      <table className="min-w-[600px] w-full divide-y divide-gray-100">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Patient
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Result
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Confidence
            </th>
            <th scope="col" className="relative px-6 py-4">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {scans.map((scan, index) => (
            <motion.tr 
              key={scan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
              className="transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {scan.patientName.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{scan.patientName}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600 font-medium">{scan.date}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                  scan.result === 'Pneumonia' 
                    ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200' 
                    : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                }`}>
                  {scan.result}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {scan.confidence > 100 ? (scan.confidence / 100).toFixed(2) : scan.confidence}%
                  </div>
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        scan.result === 'Pneumonia' 
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : 'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ 
                        width: `${scan.confidence > 100 ? 100 : scan.confidence}%` 
                      }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link 
                  href={`/dashboard/doctor/scans/${scan.id}`} 
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold group"
                >
                  View
                  <svg 
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DoctorDashboardClient({ user }: { user: { id: string; role: string; name: string } }) {
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalScans: 0,
    pneumoniaCases: 0,
    normalCases: 0,
    todayScans: 0,
    recentScans: [] as any[]
  });
  const [chartsData, setChartsData] = useState<{
    genderDistribution: any[];
    ageDistribution: any[];
    locationDistribution: any[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isChartsLoading, setIsChartsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patient-records'>('dashboard');
  
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [isPatientsLoading, setIsPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // Add state for selected patient and their scans
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientScans, setPatientScans] = useState<any[]>([]);
  const [isScansLoading, setIsScansLoading] = useState(false);
  const [scansError, setScansError] = useState<string | null>(null);
  const [scanPage, setScanPage] = useState(1);
  const [scanTotalPages, setScanTotalPages] = useState(1);
  const SCANS_PER_PAGE = 10;
  const [scanSort, setScanSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  // Add state for all scans pagination and sorting
  const [allScans, setAllScans] = useState<any[]>([]);
  const [isAllScansLoading, setIsAllScansLoading] = useState(false);
  const [allScansError, setAllScansError] = useState<string | null>(null);
  const [allScansPage, setAllScansPage] = useState(1);
  const [allScansTotalPages, setAllScansTotalPages] = useState(1);
  const ALL_SCANS_PER_PAGE = 8;
  const [allScansSort, setAllScansSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  // Fetch dashboard data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch data from our API endpoint
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('Received dashboard data:', result.data);
        setDashboardData({
          totalScans: result.data.totalScans || 0,
          pneumoniaCases: result.data.pneumoniaCases || 0,
          normalCases: result.data.normalCases || 0,
          todayScans: result.data.todayScans || 0,
          recentScans: result.data.recentScans.map((scan: any) => ({
            ...scan,
            // Format date for display
            date: new Date(scan.date).toLocaleDateString()
          }))
        });
      } else {
        // Fallback to mock data if API call fails
        console.warn('Using fallback data for dashboard');
        generateMockData();
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use mock data when API fails
      generateMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartsData = async () => {
    setIsChartsLoading(true);
    try {
      const response = await fetch('/api/dashboard/charts-data');
      if (!response.ok) throw new Error('Failed to fetch charts data');
      const result = await response.json();
      if (result.success) {
        setChartsData(result.data);
      }
    } catch (error) {
      console.error("Error fetching charts data:", error);
    } finally {
      setIsChartsLoading(false);
    }
  };
  
  // Generate mock data for demo/fallback purposes
  const generateMockData = () => {
    // Generate some sample data
    const totalScans = Math.floor(Math.random() * 50) + 50; // 50-100
    const pneumoniaCases = Math.floor(Math.random() * 35) + 15; // 15-50
    const normalCases = totalScans - pneumoniaCases;
    const todayScans = Math.floor(Math.random() * 8) + 1; // 1-8
    
    // Generate recent scans
    const recentScans = Array.from({ length: 5 }, (_, i) => {
      const isPneumonia = Math.random() > 0.5;
      // Use 0.80-0.99 range for confidence to match API format (which is multiplied by 100)
      const rawConfidence = 0.80 + ((Math.floor(Math.random() * 20)) / 100);
      return {
        id: `scan-${i}`,
        patientName: `Patient ${String.fromCharCode(65 + i)}`,
        date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
        result: isPneumonia ? 'Pneumonia' : 'Normal',
        confidence: Math.round(rawConfidence * 100), // Convert to percentage (80-99%)
      };
    });
    
    setDashboardData({
      totalScans,
      pneumoniaCases,
      normalCases,
      todayScans,
      recentScans
    });
  };

  useEffect(() => {
    fetchData();
    fetchChartsData();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'patient-records') {
      setIsPatientsLoading(true);
      setPatientsError(null);
      fetch('/api/patients')
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch patients');
          const data = await res.json();
          setPatientRecords(data.patients || []);
        })
        .catch((err) => {
          setPatientsError('Could not load patient records.');
        })
        .finally(() => setIsPatientsLoading(false));
    }
  }, [activeTab]);

  // Fetch scans for selected patient
  useEffect(() => {
    if (selectedPatient) {
      setIsScansLoading(true);
      setScansError(null);
      fetch(`/api/scans/all?patientId=${selectedPatient.id}&page=${scanPage}&limit=${SCANS_PER_PAGE}&sortBy=${scanSort.key}&sortOrder=${scanSort.direction}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch scans');
          const result = await res.json();
          setPatientScans(result.data.scans || []);
          setScanTotalPages(result.data.pagination?.totalPages || 1);
        })
        .catch(() => setScansError('Could not load scans.'))
        .finally(() => setIsScansLoading(false));
    }
  }, [selectedPatient, scanPage, scanSort]);

  // Fetch all scans for doctor
  useEffect(() => {
    if (activeTab === 'patient-records') {
      setIsAllScansLoading(true);
      setAllScansError(null);
      fetch(`/api/scans/all?page=${allScansPage}&limit=${ALL_SCANS_PER_PAGE}&sortBy=${allScansSort.key}&sortOrder=${allScansSort.direction}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch scans');
          const result = await res.json();
          setAllScans(result.data.scans || []);
          setAllScansTotalPages(result.data.pagination?.totalPages || 1);
        })
        .catch(() => setAllScansError('Could not load scans.'))
        .finally(() => setIsAllScansLoading(false));
    }
  }, [activeTab, allScansPage, allScansSort]);
  
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Premium Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
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
                  MedRecord Hub
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Doctor's Dashboard</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Welcome back,</p>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-medium text-sm transition-all border border-red-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Premium Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => setActiveTab('dashboard')}
              className={`relative px-6 py-4 font-semibold text-sm transition-all ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </span>
              {activeTab === 'dashboard' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"
                />
              )}
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => setActiveTab('patient-records')}
              className={`relative px-6 py-4 font-semibold text-sm transition-all ${
                activeTab === 'patient-records'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Patient Records
              </span>
              {activeTab === 'patient-records' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"
                />
              )}
            </motion.button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
        {/* Page Header with Action Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Overview Dashboard</h2>
            <p className="text-gray-600">Monitor your pneumonia detection analytics and patient records</p>
          </div>
          <Link href="/dashboard/doctor/upload-xray">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload New X-Ray
            </motion.button>
          </Link>
        </motion.div>
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                  title="Total X-Ray Scans" 
                  value={dashboardData.totalScans} 
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  } 
                  color="indigo"
                  percentage={8}
                  increasing={true}
                />
                <StatCard 
                  title="Pneumonia Cases" 
                  value={dashboardData.pneumoniaCases} 
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  } 
                  color="red"
                  percentage={5}
                  increasing={true}
                />
                <StatCard 
                  title="Normal Cases" 
                  value={dashboardData.normalCases} 
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  } 
                  color="green"
                  percentage={12}
                  increasing={true}
                />
                <StatCard 
                  title="Today's Scans" 
                  value={dashboardData.todayScans} 
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  } 
                  color="yellow"
                />
              </div>
                   {/* Demographic Charts Section */}
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.3 }}
                     className="mb-8"
                   >
                     <div className="mb-6">
                       <h3 className="text-xl font-bold text-gray-900 mb-2">Patient Demographics</h3>
                       <p className="text-gray-600 text-sm">Analysis of patient distribution across different categories</p>
                     </div>
                    {isChartsLoading ? (
                      <div className="flex justify-center items-center h-48 bg-white rounded-2xl shadow-md">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                          <p className="text-gray-500 text-sm">Loading analytics...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all"
                        >
                          <BarChart title="Cases by Gender" data={chartsData?.genderDistribution || []} />
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all"
                        >
                          <BarChart title="Cases by Age Group" data={chartsData?.ageDistribution || []} />
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all"
                        >
                          <BarChart title="Top 10 Locations (Region)" data={chartsData?.locationDistribution || []} />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
              {/* Charts and Tables Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart */}
                <motion.div 
                  className="lg:col-span-1 bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Case Distribution</h3>
                    <p className="text-gray-600 text-sm">Overview of diagnostic results</p>
                  </div>
                  <DonutChart 
                    normalCount={dashboardData.normalCases} 
                    pneumoniaCount={dashboardData.pneumoniaCases} 
                  />
                </motion.div>
                {/* Recent Scans */}
                <motion.div 
                  className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Recent X-Ray Scans</h3>
                      <p className="text-gray-600 text-sm">Latest diagnostic results</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('patient-records')}
                      className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      View All
                    </motion.button>
                  </div>
                  <RecentScansTable scans={dashboardData.recentScans} />
                </motion.div>
              </div>
                 
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}
        {activeTab === 'patient-records' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-8"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Records</h2>
              <p className="text-gray-600">Comprehensive view of all patient X-ray scans and diagnostics</p>
            </div>
            {/* All Scans Table */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">All X-Ray Scans</h3>
                  <p className="text-sm text-gray-600">Click column headers to sort</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">
                    {allScans.length} {allScans.length === 1 ? 'record' : 'records'} found
                  </span>
                </div>
              </div>
              {isAllScansLoading ? (
                <div className="flex flex-col justify-center items-center h-64 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading patient records...</p>
                </div>
              ) : allScansError ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center"
                >
                  <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-semibold text-lg">{allScansError}</p>
                </motion.div>
              ) : allScans.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-12 text-center"
                >
                  <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-700 font-semibold text-xl mb-2">No scans found</p>
                  <p className="text-gray-600">Start by uploading your first X-ray scan</p>
                </motion.div>
              ) : (
                <div className="overflow-x-auto w-full rounded-2xl border border-gray-100 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th 
                          className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group" 
                          onClick={() => setAllScansSort({ key: 'patientName', direction: allScansSort.direction === 'asc' ? 'desc' : 'asc' })}
                        >
                          <div className="flex items-center gap-2">
                            Patient
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group" 
                          onClick={() => setAllScansSort({ key: 'date', direction: allScansSort.direction === 'asc' ? 'desc' : 'asc' })}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group" 
                          onClick={() => setAllScansSort({ key: 'result', direction: allScansSort.direction === 'asc' ? 'desc' : 'asc' })}
                        >
                          <div className="flex items-center gap-2">
                            Result
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group" 
                          onClick={() => setAllScansSort({ key: 'confidence', direction: allScansSort.direction === 'asc' ? 'desc' : 'asc' })}
                        >
                          <div className="flex items-center gap-2">
                            Confidence
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Reference #
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {allScans.map((scan, index) => (
                        <motion.tr 
                          key={scan.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                          className="transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {scan.patientName.charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{scan.patientName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 font-medium">
                              {scan.date ? new Date(scan.date).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                              scan.result === 'Pneumonia' 
                                ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200' 
                                : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                            }`}>
                              {scan.result}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {(scan.confidence > 1 ? (scan.confidence / 100).toFixed(2) : scan.confidence.toFixed(2))}%
                              </span>
                              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    scan.result === 'Pneumonia' 
                                      ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                      : 'bg-gradient-to-r from-green-500 to-green-600'
                                  }`}
                                  style={{ 
                                    width: `${scan.confidence > 1 ? 100 : scan.confidence * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">
                              {scan.referenceNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link 
                              href={`/dashboard/doctor/scans/${scan.id}`} 
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold group"
                            >
                              View
                              <svg 
                                className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pagination Controls */}
                  <div className="flex justify-center items-center px-6 py-5 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-2">
                      {Array.from({ length: allScansTotalPages }, (_, i) => i + 1).map((page) => (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAllScansPage(page)}
                          className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all shadow-sm ${
                            allScansPage === page
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                          disabled={allScansPage === page}
                        >
                          {page}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <div className="flex items-center">
                <div className="mr-2 flex items-center justify-center w-7 h-7">
                  <Image src="/icons/logo.png" alt="Logo" width={16} height={16} />
                </div>
                <span className="text-gray-500 text-sm">© 2025 MedRecord Hub. All rights reserved.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Logout Modal */}
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogout} 
      />
    </main>
  );
} 