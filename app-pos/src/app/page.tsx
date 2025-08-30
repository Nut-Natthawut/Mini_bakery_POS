import Link from "next/link";
import { Lock } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#FFEDDB] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-[#BF9270] to-[#EAD3B4] rounded-full flex items-center justify-center mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mini bakery POS</h1>
            <p className="text-gray-600">ระบบจัดการร้านเบเกอรี่ขนาดเล็ก เริ่มต้นใช้งานได้ทันที!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/login" className="block">
              <div className="w-full text-center py-3 px-4 rounded-lg bg-gradient-to-r from-[#BF9270] to-[#EAD3B4] text-white font-medium shadow hover:from-[#A8785C] hover:to-[#DCC7AE] transition-colors">
                เข้าสู่ระบบ
              </div>
            </Link>
            <Link href="/register" className="block">
              <div className="w-full text-center py-3 px-4 rounded-lg border border-[#E5D5C8] text-[#65451F] font-medium bg-[#F9F3EF] hover:bg-[#F1E9E5] transition-colors">
                สมัครสมาชิก
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default HomePage

