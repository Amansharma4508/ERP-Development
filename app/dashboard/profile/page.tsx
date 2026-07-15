'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditProfilePage() {
  // Temporary dynamic setup, real integration me ye user session id se replace hoga
  const currentUserId = "user_dummy_123"; 

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form State
  const [formData, setFormData] = useState({
    memberId: "10029384", // Dummy Numeric Series Member ID (Disabled)
    fullName: "",
    email: "", // Registration email (Read-only for security)
    phoneNumber: "", // Goes to Supabase Metadata
    dob: "" // Goes to wallet_applications table
  });

  // Mock Fetch: Default data loading
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      fullName: "Amankumar Sharma",
      email: "aman.sharma@example.com",
      phoneNumber: "9876543210",
      dob: "1998-05-15"
    }));
  }, [currentUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Backend route.ts ko data hit kar rahe hain
      const response = await axios.post('/api/profile/update', {
        userId: currentUserId,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        dob: formData.dob
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile & metadata updated successfully!' });
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to update.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Edit Profile</h2>

      {message.text && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Member ID - DISABLED */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Member ID (Non-editable)</label>
          <input 
            type="text" 
            value={formData.memberId} 
            disabled 
            className="w-full p-2.5 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed font-mono"
          />
        </div>

        {/* Email - DISABLED (Auth secure fields bypass control) */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address (Registered)</label>
          <input 
            type="email" 
            value={formData.email} 
            disabled 
            className="w-full p-2.5 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
          <input 
            type="text" 
            name="fullName"
            value={formData.fullName} 
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Phone Number (Saves to Metadata) */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Phone Number</label>
          <input 
            type="tel" 
            name="phoneNumber"
            value={formData.phoneNumber} 
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Date of Birth</label>
          <input 
            type="date" 
            name="dob"
            value={formData.dob} 
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Saving Changes...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}