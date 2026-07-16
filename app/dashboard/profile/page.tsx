'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/auth-context';

export default function EditProfilePage() {
  const { user, isLoading: authLoading } = useAuth(); // custom auth context se
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ memberId: "", fullName: "", email: "", phoneNumber: "", dob: "" });

  useEffect(() => {
    if (authLoading) return; // auth context abhi localStorage se load ho raha hai, wait karo

    if (!user) {
      setMessage({ type: 'error', text: 'Please login to view your profile.' });
      setDataLoading(false);
      return;
    }

const fetchUserData = async () => {
    try {
      const { data } = await axios.get(`/api/profile/get?userId=${user.id}`);
      if (data.success && data.data) {
        // Yahan sidha data.data.member_id use karein
        setFormData({
          memberId: data.data.member_id || "", 
          fullName: data.data.full_name || "",
          email: data.data.email || "",
          phoneNumber: data.data.phone_number || "",
          dob: data.data.dob || ""
        });
      }
    } catch (err: any) {
      console.error("Fetch Error:", err.response?.data || err.message);
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setDataLoading(false);
    }
  };

    fetchUserData();
  }, [authLoading, user]);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/profile/update', { userId: user.id, ...formData });
      
      // Success message show karein
      setMessage({ 
        type: 'success', 
        text: 'Profile updated! ' 
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return <div className="max-w-2xl mx-auto mt-10 p-6 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
      {message.text && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-semibold">Member ID</label>
        <input type="text" value={formData.memberId} disabled className="w-full p-2.5 border bg-gray-100 cursor-not-allowed" />

        <label className="block text-sm font-semibold">Email</label>
        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border" required />

        <label className="block text-sm font-semibold">Full Name</label>
        <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full p-2.5 border" required />

        <label className="block text-sm font-semibold">Phone Number</label>
        <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full p-2.5 border" required />

        <label className="block text-sm font-semibold">Date of Birth</label>
        <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full p-2.5 border" required />

        <button type="submit" disabled={loading || !user} className="w-full bg-blue-600 text-white p-3 mt-4 rounded hover:bg-blue-700">
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}