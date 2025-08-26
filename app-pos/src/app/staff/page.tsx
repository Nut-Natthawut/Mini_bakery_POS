"use client";

import { useRouter } from "next/navigation";

export default function StaffPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Staff Dashboard
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          ยินดีต้อนรับเข้าสู่ระบบในฐานะพนักงาน
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
