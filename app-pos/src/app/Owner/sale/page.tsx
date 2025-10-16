// src/app/Owner/sale/page.tsx
'use client'

import { useState } from 'react'
import { Download, Printer, Trash2 } from 'lucide-react'

type Sale = {
  id: number; orderCode: string; seller: string; items: string; price: number; date: string
}

export default function SalePage() {
  const [rows, setRows] = useState<Sale[]>([
    { id: 1, orderCode: '6664452', seller: 'staff', items: '1 รายการ', price: 489, date: '28/08/68' },
    { id: 2, orderCode: '8566444', seller: 'staff', items: '2 รายการ', price: 398, date: '29/08/68' },
    { id: 3, orderCode: '9974555', seller: 'staff', items: '2 รายการ', price: 894, date: '30/08/68' },
    { id: 4, orderCode: '22156977', seller: 'staff', items: '1 รายการ', price: 900, date: '31/08/68' },
  ])

  // 🔸 state สำหรับ modal
  const [bill, setBill] = useState<Sale | null>(null)
  const [confirmDel, setConfirmDel] = useState<Sale | null>(null)

  const handleExport = () => alert('Export Excel')
  const openBill = (row: Sale) => setBill(row)
  const openConfirm = (row: Sale) => setConfirmDel(row)
  const doDelete = () => {
    if (!confirmDel) return
    setRows(prev => prev.filter(r => r.id !== confirmDel.id))
    setConfirmDel(null)
  }

  return (
    <div className="min-h-screen bg-[#FFFCE8]">
      <div className="w-full px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#7A4E1A]">Sales Reports</h2>
          <button
            type="button"
            onClick={handleExport}
            className="flex h-9 w-[96px] items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>

        {/* กล่องตาราง */}
        <div className="overflow-hidden rounded-xl border border-[#c7a574] bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '26%' }} />
            </colgroup>
            <thead className="bg-[#c7a574] text-white">
              <tr className="h-11">
                <th className="px-3 text-left">No</th>
                <th className="px-3 text-left">รหัสคำสั่งซื้อ</th>
                <th className="px-3 text-left">ผู้ขาย</th>
                <th className="px-3 text-left">รายการ</th>
                <th className="px-3 text-left">ราคา</th>
                <th className="px-3 text-left">วันที่</th>
                <th className="px-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="h-12 border-t border-[#eee] odd:bg-white even:bg-[#fff7ef]">
                  <td className="px-3">{i + 1}</td>
                  <td className="px-3">{r.orderCode}</td>
                  <td className="px-3">{r.seller}</td>
                  <td className="px-3">{r.items}</td>
                  <td className="px-3">{r.price.toFixed(2)}</td>
                  <td className="px-3">{r.date}</td>
                  <td className="px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openBill(r) }}
                        className="inline-flex h-8 w-[88px] items-center justify-center gap-1 rounded-md bg-[#cfe0ff] text-[#1b4fbf] hover:bg-[#bcd3ff]"
                      >
                        <Printer className="h-4 w-4" />
                        พิมพ์
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openConfirm(r) }}
                        className="inline-flex h-8 w-[88px] items-center justify-center gap-1 rounded-md bg-[#ffd4d4] text-[#9b1c1c] hover:bg-[#ffc3c3]"
                      >
                        <Trash2 className="h-4 w-4" />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🧾 Modal: ใบเสร็จ */}
      {bill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[420px] rounded-lg bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-center text-lg font-semibold">บิล</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold">รหัสคำสั่งซื้อ</td>
                  <td className="py-1 text-right">{bill.orderCode}</td>
                </tr>
                <tr>
                  <td className="pt-2 font-semibold">รายการ</td>
                  <td className="pt-2 text-right font-semibold">ราคา</td>
                </tr>
                <tr>
                  <td className="border-t border-gray-300 py-2 text-gray-700">
                    เค้กช็อกโกแลต ( {bill.items} )
                  </td>
                  <td className="border-t border-gray-300 py-2 text-right text-gray-700">
                    {bill.price.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="border-t border-gray-300 py-2 font-semibold">รวม</td>
                  <td className="border-t border-gray-300 py-2 text-right font-semibold">
                    {bill.price.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBill(null)}
                className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white hover:bg-blue-600"
              >
                พิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑 Modal: ยืนยันลบ */}
      {confirmDel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[360px] rounded-lg bg-white p-5 shadow-xl">
            <p className="text-center text-[#7A4E1A]">ต้องการลบหรือไม่</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDel(null)}
                className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={doDelete}
                className="rounded-md bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
