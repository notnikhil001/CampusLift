import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { College } from '../types';
import { User, Mail, Lock, Building, Phone, BookOpen, GraduationCap } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    collegeId: '',
    phoneNumber: '',
    course: '',
    year: '1st Year',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<College[]>('/colleges').then((res) => {
      if (res.success && res.data) {
        setColleges(res.data);
        if (res.data.length > 0) {
          setSelectedCollege(res.data[0]);
          setFormData((prev) => ({ ...prev, collegeId: res.data[0].id }));
        }
      }
    });
  }, []);

  const handleCollegeChange = (id: string) => {
    const found = colleges.find((c) => c.id === id) || null;
    setSelectedCollege(found);
    setFormData((prev) => ({ ...prev, collegeId: id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    const res = await register(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Registration successful! Check your email to verify.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">Create Student Account</h2>
      <p className="text-sm text-slate-500 text-center mb-6">
        Connect with verified students for shared Auto/Taxi travel
      </p>

      {error && (
        <div className="bg-rose-50 text-rose-700 text-sm p-3.5 rounded-xl mb-4 border border-rose-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-xl mb-4 border border-emerald-200 font-medium">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="Aman Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* College Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            College / Institution
          </label>
          <div className="relative">
            <Building className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <select
              value={formData.collegeId}
              onChange={(e) => handleCollegeChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (@{c.emailDomain})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* College Email */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              College Email
            </label>
            {selectedCollege && (
              <span className="text-[11px] font-semibold text-indigo-600">
                Must end with @{selectedCollege.emailDomain}
              </span>
            )}
          </div>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              placeholder={`student@${selectedCollege?.emailDomain || 'college.edu'}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 chars, 1 uppercase & 1 number"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Phone & Course */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone (Private)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                placeholder="+91..."
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Year
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Course / Department
          </label>
          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-100 disabled:opacity-50 mt-2"
        >
          {isSubmitting ? 'Registering...' : 'Create Student Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-indigo-600 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
