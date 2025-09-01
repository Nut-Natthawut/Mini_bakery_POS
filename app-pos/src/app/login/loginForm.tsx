"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, UserCheck, Shield } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function LoginForm() {
  const router = useRouter();
  const [userType, setUserType] = useState("Staff");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password,userType: userType})
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || 'Login failed');
        return;
      }
      toast.success('Login successful');
        if (userType === "Owner") {
      router.push('/Owner/home');
    } else {
      
      router.push('/Owner/home');
    }
      
    } catch(error) {
      console.error(error);
      toast.error('There was an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFEDDB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ToastContainer position="top-center" />
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#BF9270] to-[#EAD3B4] rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Log in
            </h1>
            <p className="text-gray-600">Please select your user type and fill in the information.</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              User type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("Staff")}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all  ${
                  userType === "Staff"
                    ? " border-[#65451F] bg-[#F1E9E5] "
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <UserCheck className="w-5 h-5 mr-2" />
                <span className="font-medium ">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType("Owner")}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  userType === "Owner"
                    ? "border-[#65451F] bg-[#F1E9E5]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium text-[#65451F]">Owner</span>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#65451F] focus:border-transparent transition-colors"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#65451F] focus:border-transparent transition-colors"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#65451F] focus:ring-[#65451F] border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-[#65451F] transition-colors"
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border  rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                userType === "admin"
                  ? "bg-gradient-to-r from-[#BF9270] to-[#EAD3B4] hover:from-[#A8785C] hover:to-[#DCC7AE]"
                  : "bg-gradient-to-r from-[#BF9270] to-[#EAD3B4] hover:from-[#A8785C] hover:to-[#DCC7AE]"
              } ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                userType === "admin"
                  ? "focus:ring-[#65451F]"
                  : "focus:ring-[#65451F]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-lg h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                `Log in as ${userType}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
