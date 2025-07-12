"use client"
import React, { useState } from 'react';
import { LoaderIcon } from 'lucide-react';
import { Captcha } from './Captcha';
interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}
export const ForgotPasswordForm = ({
  onBackToLogin
}: ForgotPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    captcha: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.captcha) {
      newErrors.captcha = 'Please complete the captcha';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };
  if (isSubmitted) {
    return <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent password reset instructions to {formData.email}
          </p>
          <button type="button" onClick={onBackToLogin} className="mt-6 font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </button>
        </div>
      </div>;
  }
  return <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you instructions to reset your
          password.
        </p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input type="email" id="email" autoComplete="email" className={`mt-1 block w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} value={formData.email} onChange={e => setFormData({
          ...formData,
          email: e.target.value
        })} />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
        </div>
        <Captcha value={formData.captcha} onChange={value => setFormData({
        ...formData,
        captcha: value
      })} error={errors.captcha} />
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBackToLogin} className="font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </button>
        </div>
        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {isLoading ? <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : null}
            {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
          </button>
        </div>
      </form>
    </div>;
};"use client"
import React, { useState } from 'react';
import { LoaderIcon } from 'lucide-react';
import { Captcha } from './Captcha';
interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}
export const ForgotPasswordForm = ({
  onBackToLogin
}: ForgotPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    captcha: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.captcha) {
      newErrors.captcha = 'Please complete the captcha';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };
  if (isSubmitted) {
    return <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent password reset instructions to {formData.email}
          </p>
          <button type="button" onClick={onBackToLogin} className="mt-6 font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </button>
        </div>
      </div>;
  }
  return <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you instructions to reset your
          password.
        </p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input type="email" id="email" autoComplete="email" className={`mt-1 block w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} value={formData.email} onChange={e => setFormData({
          ...formData,
          email: e.target.value
        })} />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
        </div>
        <Captcha value={formData.captcha} onChange={value => setFormData({
        ...formData,
        captcha: value
      })} error={errors.captcha} />
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBackToLogin} className="font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </button>
        </div>
        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {isLoading ? <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : null}
            {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
          </button>
        </div>
      </form>
    </div>;
};
