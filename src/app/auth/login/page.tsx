"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Login() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Navigation Bar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md shadow-sm"
      >
        <motion.div 
          className="flex items-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="mr-2 flex items-center justify-center w-7 h-7">
            <Image src="/icons/logo.png" alt="Logo" width={16} height={16} />
          </div>
          <h1 className="font-semibold text-gray-800">MedRecord Hub</h1>
        </motion.div>
        <div>
          <Link href="/" className="text-indigo-600 text-sm hover:text-indigo-800 font-medium transition-colors">
            Back to Home
          </Link>
        </div>
      </motion.nav>

      {/* Login Content */}
      <div className="flex flex-1 justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Image src="/icons/logo.png" alt="Logo" width={28} height={28} />
                </div>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-800 mb-1"
              >
                Welcome Back
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-sm"
              >
                Sign in to continue to MedRecord Hub
              </motion.p>
            </div>

            {/* Login Options */}
            <div className="space-y-4">
              {/* Admin Login - Now clickable with Link */}
              <Link href="/auth/login/admin">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(79, 70, 229, 0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center mr-4 group-hover:from-indigo-200 group-hover:to-indigo-100 transition-all">
                      <Image src="/images/admin.png" alt="Admin" width={28} height={28} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">Sign in as Admin</h3>
                      <p className="text-xs text-gray-500">Full system control and management</p>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Doctor Login - Now clickable with Link */}
              <Link href="/auth/login/doctor">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(79, 70, 229, 0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center mr-4 group-hover:from-indigo-200 group-hover:to-indigo-100 transition-all">
                      <Image src="/images/doctor.png" alt="Doctor" width={28} height={28} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">Sign in as Doctor</h3>
                      <p className="text-xs text-gray-500">Access patient records and appointments</p>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Divider */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="relative my-6"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs text-gray-500 font-medium">or</span>
                </div>
              </motion.div>

              {/* Patient Access */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="text-center"
              >
                <Link 
                  href="/dashboard/patient" 
                  className="group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center text-indigo-600 hover:text-indigo-800 text-sm font-medium py-3 px-4 rounded-lg hover:bg-indigo-50 transition-all"
                  >
                    <span className="mr-2">
                      <Image src="/images/patient.png" alt="Patient" width={20} height={20} />
                    </span>
                    Continue as Patient (Public View)
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                    </svg>
                  </motion.div>
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  No login required for basic information
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

       {/* Simple Footer */}
       <motion.footer 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1 }}
         className="bg-white/80 backdrop-blur-md py-4 border-t text-center text-sm text-gray-600"
       >
        <div className="container mx-auto">
          <p>© 2025 MedRecord Hub • <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">Privacy</a> • <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">Terms</a></p>
        </div>
      </motion.footer>
    </main>
  );
} 