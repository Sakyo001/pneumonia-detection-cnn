"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  doctorId?: string;
  createdAt?: string;
}

interface UserFormData {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  doctorId?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
    doctorId: "",
  });

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear previous errors
        
        const response = await fetch("/api/admin/users");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || "Failed to fetch users");
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setIsEditMode(false);
    // Generate auto Doctor ID
    const generatedDoctorId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    setCurrentUser({
      name: "",
      email: "",
      password: "",
      role: "DOCTOR",
      doctorId: generatedDoctorId,
    });
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setIsEditMode(true);
    setCurrentUser({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "", // Clear password for edit
      role: user.role,
      doctorId: user.doctorId,
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    try {
      setError(null); // Clear previous errors
      
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to delete user");
      }
      
      // Remove from state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null); // Clear previous errors
      
      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch("/api/admin/users", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to ${isEditMode ? "update" : "create"} user`);
      }
      
      const savedUser = await response.json();
      
      if (isEditMode) {
        setUsers(users.map(user => (user.id === savedUser.id ? savedUser : user)));
      } else {
        setUsers([savedUser, ...users]);
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} user:`, err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">User Management</h3>
          <p className="text-sm text-gray-600">Manage system users and access levels</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-xl transition-all flex items-center gap-2"
          onClick={handleAddUser}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New User
        </motion.button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3"
        >
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Doctor ID
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((user, index) => (
                <motion.tr 
                  key={user.id} 
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
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      user.role === 'ADMIN' 
                        ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200' 
                        : user.role === 'DOCTOR' 
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                    {user.doctorId ? (
                      <span className="bg-gray-50 px-2 py-1 rounded">{user.doctorId}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold mr-4 inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No users found</p>
                      <p className="text-gray-400 text-sm mt-1">Get started by adding a new user</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {isEditMode ? "Edit User" : "Add New User"}
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                  {isEditMode ? "Update user information" : "Create a new system user"}
                </p>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={currentUser.name}
                      onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password {isEditMode && <span className="text-gray-500 font-normal text-xs">(leave blank to keep unchanged)</span>}
                    </label>
                    <input
                      type="password"
                      value={currentUser.password}
                      onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all"
                      placeholder={isEditMode ? "Enter new password" : "Create a password"}
                      required={!isEditMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      User Role
                    </label>
                    <select
                      value={currentUser.role}
                      onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all bg-white"
                    >
                      <option value="ADMIN">Administrator</option>
                      <option value="DOCTOR">Doctor</option>
                      <option value="PATIENT">Patient</option>
                    </select>
                  </div>
                  
                  {currentUser.role === "DOCTOR" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Doctor ID
                        {!isEditMode && <span className="text-indigo-600 font-normal text-xs ml-1">(Auto-generated)</span>}
                      </label>
                      <input
                        type="text"
                        value={currentUser.doctorId || ""}
                        disabled={!isEditMode}
                        onChange={(e) => isEditMode && setCurrentUser({ ...currentUser, doctorId: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl transition-all font-mono text-sm ${
                          !isEditMode
                            ? "border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed"
                            : "border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        }`}
                        placeholder="Enter doctor ID"
                      />
                      {!isEditMode && (
                        <p className="text-xs text-gray-500 mt-2">
                          <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          This ID is automatically generated for unique identification
                        </p>
                      )}
                    </motion.div>
                  )}
                  
                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                    >
                      {isEditMode ? "Update User" : "Create User"}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}