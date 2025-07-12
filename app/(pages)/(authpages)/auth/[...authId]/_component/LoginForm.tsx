"use client"
import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, LoaderIcon } from 'lucide-react';
import { Captcha } from './Captcha';
import { redirect, useRouter } from 'next/navigation';
import { UserRole } from '@/app/interface';
import Link from 'next/link';
import { loginUser } from '@/app/actions/authActions';
import { toast } from 'sonner';

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' as UserRole,
    captcha: ''
  });
  const roles = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
    { value: "superadmin", label: "Super Admin" },
  ]
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageLoading,setPageLoading] = useState(false);
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.captcha) {
      newErrors.captcha = 'Please complete the captcha';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const router  = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const response   = await loginUser({
      email: formData.email,
      password: formData.password,
      role: formData.role
    });
    if (response.success) {
      if(response.registrationProcess == 'pending'){
        router.push(`/auth/${response.userRole == 'superadmin'? 'admin': response.userRole}/register`);
      }
      else{
        router.push(`/${response.userRole == 'superadmin' ? 'admin' : response.userRole}/dashboard`);
      }
      setFormData({
        email: '',
        password: '',
        role: 'student',
        captcha: ''
      });
    }
    else{
      setIsLoading(false);
      toast.error(response.message);
      return;
    }
    setIsLoading(false);
    // Handle login logic here

    
  };
  const roleColors = {
    student: 'bg-blue-600 hover:bg-blue-700',
    teacher: 'bg-green-600 hover:bg-green-700',
    admin: 'bg-purple-600 hover:bg-purple-700',
    superadmin: 'bg-purple-600 hover:bg-purple-700',
  };
  return <div className="bg-white max-w-lg w-full  py-8 px-4 shadow sm:rounded-lg sm:px-10">
      
      <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Login to your Account</h2>
            <p className="text-gray-600 mt-2">Login to your university account</p>
          </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>

        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input id="email" name="email" type="email" autoComplete="email" required className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} value={formData.password} onChange={e => setFormData({
            ...formData,
            password: e.target.value
          })} />
            <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOffIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
            </button>
            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
          </div>
        </div>
        <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={(e)=>setFormData(prev => ({...formData, role: e.target.value as UserRole}))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select your role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>
        <Captcha value={formData.captcha} onChange={value => setFormData({
        ...formData,
        captcha: value
      })} error={errors.captcha} />
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/auth/forgot-password"  className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>
          <div className="text-sm">
            <Link href="/auth/signup"  className="font-medium text-blue-600 hover:text-blue-500">
              Create an account
            </Link>
          </div>
        </div>
        <div>
          <button type="submit" disabled={isLoading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${roleColors[formData.role as keyof typeof roleColors]} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}>
            {isLoading ? <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : null}
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>;
};
