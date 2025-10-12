"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(searchParams?.get("error") || "");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          role: "ADMIN"
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        throw new Error("Received non-JSON response from server");
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (data.user) {
          try {
            localStorage.setItem('userInfo', JSON.stringify({
              id: data.user.id,
              name: data.user.name,
              role: data.user.role
            }));
          } catch (storageError) {
            console.error('Failed to cache user info:', storageError);
          }
        }
        
        router.push("/dashboard/admin");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  }

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
          <Link href="/auth/login" className="text-purple-600 text-sm hover:text-purple-800 font-medium transition-colors">
            Back to Login
          </Link>
        </div>
      </motion.nav>

      {/* Admin Login Content */}
      <div className="flex flex-1 justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          >
            <div className="text-center mb-6">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Image src="/images/admin.png" alt="Admin" width={40} height={40} />
                </div>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-800 mb-1"
              >
                Admin Login
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-sm"
              >
                Access the administrative dashboard
              </motion.p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start"
                >
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label 
                  htmlFor="email" 
                  className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'email' ? 'text-purple-600' : 'text-gray-700'}`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-purple-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="admin@medrecord.com" 
                    defaultValue="admin@medrecord.com"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-3 py-3 border-2 text-gray-700 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label 
                  htmlFor="password" 
                  className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'password' ? 'text-purple-600' : 'text-gray-700'}`}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-purple-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="Enter your password" 
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-3 py-3 border-2 text-gray-700 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="#" className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
                    Forgot password?
                  </a>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to Admin Dashboard
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-gray-600 mb-4">
                This area is restricted to authorized administrators only
              </p>
              {/* Sample login info for demo purposes */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg text-xs text-gray-600 text-left"
              >
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="font-semibold text-purple-900 mb-2">Demo Credentials:</p>
                    <p className="mb-1"><span className="font-medium">Email:</span> admin@medrecord.com</p>
                    <p><span className="font-medium">Password:</span> admin123</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Simple Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="bg-white/80 backdrop-blur-md py-4 border-t text-center text-sm text-gray-600"
      >
        <div className="container mx-auto">
          <p>© 2025 MedRecord Hub • <a href="#" className="text-purple-600 hover:text-purple-800 transition-colors">Privacy</a> • <a href="#" className="text-purple-600 hover:text-purple-800 transition-colors">Terms</a></p>
        </div>
      </motion.footer>
    </main>
  );
}
