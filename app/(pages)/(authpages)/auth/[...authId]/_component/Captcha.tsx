"use client"
import React, { useEffect, useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
interface CaptchaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
export const Captcha = ({
  value,
  onChange,
  error
}: CaptchaProps) => {
  const [captchaText, setCaptchaText] = useState('');
  const generateCaptcha = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaText(result);
  };
  useEffect(() => {
    generateCaptcha();
  }, []);
  return <div>
      <label className="block text-sm font-medium text-gray-700">
        Security Check
      </label>
      <div className="mt-1 flex space-x-4">
        <div className="flex-1">
          <input type="text" className={`block w-full border ${error ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} placeholder="Enter the code shown" value={value} onChange={e => onChange(e.target.value.toUpperCase())} />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 px-4 py-2 rounded-md select-none font-mono text-lg tracking-wider">
            {captchaText}
          </div>
          <button type="button" onClick={generateCaptcha} className="p-2 text-gray-400 hover:text-gray-500">
            <RefreshCwIcon size={20} />
          </button>
        </div>
      </div>
    </div>;
};
