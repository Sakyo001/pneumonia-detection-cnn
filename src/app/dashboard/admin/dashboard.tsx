"use client";

import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import UserManagement from "./components/UserManagement";
import PneumoniaManagement from "./components/PneumoniaManagement";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default function AdminDashboard({ user }: { 
  user: { 
    id: string; 
    email: string;
    name: string; 
    role: string;
  } 
}) {
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 0,
    pneumoniaCases: 0,
    activeDoctors: 0,
    avgConfidence: 0
  });
  const [scanData, setScanData] = useState([]);
  const [pneumoniaData, setPneumoniaData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  const formatModelAccuracy = (value: number | null) => {
    if (value === null || isNaN(value)) return '0%';
    // Ensure the value is capped at 100%
    const cappedValue = Math.min(value, 100);
    return `${cappedValue.toFixed(1)}%`;
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      
      console.log('Admin dashboard received data:', data);
      
      // Validate and format the data
      if (data && typeof data === 'object') {
        const formattedData = {
          stats: {
            totalScans: Number(data.stats?.totalScans) || 0,
            pneumoniaCases: Number(data.stats?.pneumoniaCases) || 0,
            activeDoctors: Number(data.stats?.activeDoctors) || 0,
            avgConfidence: Math.min(Number(data.stats?.avgConfidence) || 0, 100)
          },
          scanData: Array.isArray(data.scanData) ? data.scanData : [],
          pneumoniaData: Array.isArray(data.pneumoniaData) ? data.pneumoniaData : [],
          doctorData: Array.isArray(data.doctorData) ? data.doctorData : []
        };
        
        console.log('Formatted admin dashboard data:', formattedData);
        
        setStats(formattedData.stats);
        setScanData(formattedData.scanData);
        setPneumoniaData(formattedData.pneumoniaData);
        setDoctorData(formattedData.doctorData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'pneumonia':
        return <PneumoniaManagement />;
      default:
        return (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Total Scans</p>
                      <motion.h3 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
                        className="text-3xl font-bold text-gray-900"
                      >
                        {stats.totalScans.toLocaleString()}
                      </motion.h3>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Pneumonia Cases</p>
                      <motion.h3 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
                        className="text-3xl font-bold text-gray-900"
                      >
                        {stats.pneumoniaCases.toLocaleString()}
                      </motion.h3>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Active Doctors</p>
                      <motion.h3 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
                        className="text-3xl font-bold text-gray-900"
                      >
                        {stats.activeDoctors.toLocaleString()}
                      </motion.h3>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Model Accuracy</p>
                      <motion.h3 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                        className="text-3xl font-bold text-gray-900"
                      >
                        {formatModelAccuracy(stats.avgConfidence)}
                      </motion.h3>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Scans Over Time Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Scans Over Time</h3>
                  <p className="text-gray-600 text-sm">Monthly scan trends and pneumonia detection rates</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scanData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="scans" stroke="#6366F1" strokeWidth={3} name="Total Scans" dot={{ fill: '#6366F1', r: 4 }} />
                      <Line type="monotone" dataKey="pneumonia" stroke="#EF4444" strokeWidth={3} name="Pneumonia Cases" dot={{ fill: '#EF4444', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Pneumonia Distribution Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Pneumonia Distribution</h3>
                  <p className="text-gray-600 text-sm">Breakdown of detection results</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pneumoniaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pneumoniaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Doctor Activity Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 lg:col-span-2 hover:shadow-xl transition-all"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Doctor Activity</h3>
                  <p className="text-gray-600 text-sm">Performance metrics for each doctor</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doctorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <YAxis yAxisId="left" orientation="left" stroke="#6366F1" style={{ fontSize: '12px' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10B981" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="scans" fill="#6366F1" name="Total Scans" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="right" dataKey="accuracy" fill="#10B981" name="Accuracy %" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </>
        );
    }
  };

  return (
    <React.Fragment>
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
                  <p className="text-sm text-gray-600 mt-0.5">Admin Dashboard</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Administrator</p>
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
                onClick={() => setActiveSection('dashboard')}
                className={`relative px-6 py-4 font-semibold text-sm transition-all ${
                  activeSection === 'dashboard'
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
                {activeSection === 'dashboard' && (
                  <motion.div 
                    layoutId="activeAdminTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"
                  />
                )}
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                onClick={() => setActiveSection('users')}
                className={`relative px-6 py-4 font-semibold text-sm transition-all ${
                  activeSection === 'users'
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  User Management
                </span>
                {activeSection === 'users' && (
                  <motion.div 
                    layoutId="activeAdminTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"
                  />
                )}
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                onClick={() => setActiveSection('pneumonia')}
                className={`relative px-6 py-4 font-semibold text-sm transition-all ${
                  activeSection === 'pneumonia'
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Pneumonia Data
                </span>
                {activeSection === 'pneumonia' && (
                  <motion.div 
                    layoutId="activeAdminTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"
                  />
                )}
              </motion.button>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">System Overview</h2>
                <p className="text-gray-600">Monitor platform statistics and analytics</p>
              </div>
            </motion.div>
          )}
          {activeSection === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">User Management</h2>
              <p className="text-gray-600">Manage doctors and administrators</p>
            </motion.div>
          )}
          {activeSection === 'pneumonia' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Pneumonia Data</h2>
              <p className="text-gray-600">View and analyze pneumonia detection records</p>
            </motion.div>
          )}

          {isLoading && activeSection === 'dashboard' ? (
            <div className="flex flex-col justify-center items-center h-64 bg-white rounded-2xl shadow-md">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading dashboard data...</p>
            </div>
          ) : (
            renderSection()
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
      </main>

      {isLogoutModalOpen && (
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleLogout}
        />
      )}
    </React.Fragment>
  );
} 