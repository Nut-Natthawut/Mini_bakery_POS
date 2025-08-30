"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, UserCheck, Shield } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<"Staff" | "Owner">("Staff");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "", // เพิ่มฟิลด์ fullName
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
    
    // ตรวจสอบข้อมูลพื้นฐาน
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    try {
      const requestBody = {
        username: formData.username.trim(),
        password: formData.password,
        role: userType,
        ...(formData.fullName.trim() && { fullName: formData.fullName.trim() })
      };

      console.log('Sending registration request:', { ...requestBody, password: '[HIDDEN]' });

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      
      console.log('Registration response:', { status: res.status, data });

      if (!res.ok) {
        toast.error(data?.message || 'สมัครสมาชิกไม่สำเร็จ');
        return;
      }

      toast.success(data?.message || 'สมัครสมาชิกสำเร็จ');
      
      // รอ toast แสดงผลแล้วค่อย redirect
      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('มีข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFEDDB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ToastContainer position="top-center" autoClose={3000} />
          
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#BF9270] to-[#EAD3B4] rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              สมัครสมาชิก
            </h1>
            <p className="text-gray-600">เลือกประเภทผู้ใช้และกรอกข้อมูลเพื่อสร้างบัญชี</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ประเภทผู้ใช้
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("Staff")}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  userType === "Staff"
                    ? "border-[#65451F] bg-[#F1E9E5] text-[#65451F]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <UserCheck className="w-5 h-5 mr-2" />
                <span className="font-medium">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType("Owner")}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  userType === "Owner"
                    ? "border-[#65451F] bg-[#F1E9E5] text-[#65451F]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium">Owner</span>
              </button>
            </div>
          </div>

          {/* Register Form */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อผู้ใช้ *
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
                  placeholder="กรอกชื่อผู้ใช้"
                  required
                  minLength={3}
                />
              </div>
            </div>

            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อเต็ม (ไม่บังคับ)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#65451F] focus:border-transparent transition-colors"
                  placeholder="กรอกชื่อเต็ม"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน *
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
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border-0 rounded-lg shadow-sm text-sm font-medium text-white transition-all bg-gradient-to-r from-[#BF9270] to-[#EAD3B4] hover:from-[#A8785C] hover:to-[#DCC7AE] ${
                isLoading ? "opacity-75 cursor-not-allowed" : "hover:shadow-lg"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#65451F]`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังสมัครสมาชิก...
                </div>
              ) : (
                `สมัครสมาชิกในฐานะ ${userType}`
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              มีบัญชีแล้ว?{" "}
              <button
                onClick={() => router.push('/login')}
                className="text-[#65451F] hover:text-[#4A2F0E] font-medium transition-colors"
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}