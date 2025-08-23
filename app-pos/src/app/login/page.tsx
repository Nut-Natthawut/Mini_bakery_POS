"use client";

import { useState } from "react";
import { User, Lock, UserCheck, Shield } from "lucide-react";

export default function LoginPage() {
  const [userType, setUserType] = useState("staff");
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

    // จำลองการ login
    setTimeout(() => {
      console.log("Login attempt:", {
        userType,
        username: formData.username,
        password: formData.password,
      });
      alert(`เข้าสู่ระบบในฐานะ ${userType === "staff" ? "Staff" : "Admin"}`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              เข้าสู่ระบบ
            </h1>
            <p className="text-gray-600">กรุณาเลือกประเภทผู้ใช้และกรอกข้อมูล</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ประเภทผู้ใช้
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("staff")}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  userType === "staff"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <UserCheck className="w-5 h-5 mr-2" />
                <span className="font-medium">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType("admin")}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  userType === "admin"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium">Admin</span>
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
                ชื่อผู้ใช้
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="กรอกชื่อผู้ใช้"
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
                รหัสผ่าน
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="กรอกรหัสผ่าน"
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  จดจำฉันไว้
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                userType === "admin"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              } ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                userType === "admin"
                  ? "focus:ring-indigo-500"
                  : "focus:ring-blue-500"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังเข้าสู่ระบบ...
                </div>
              ) : (
                `เข้าสู่ระบบในฐานะ ${userType === "staff" ? "Staff" : "Admin"}`
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              โดยการเข้าสู่ระบบ คุณยอมรับ{" "}
              <a href="#" className="text-blue-600 hover:underline">
                เงื่อนไขการใช้งาน
              </a>{" "}
              และ{" "}
              <a href="#" className="text-blue-600 hover:underline">
                นโยบายความเป็นส่วนตัว
              </a>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <span className="font-semibold">Demo:</span>{" "}
            กรอกข้อมูลใดก็ได้เพื่อทดสอบ
          </p>
        </div>
      </div>
    </div>
  );
}
