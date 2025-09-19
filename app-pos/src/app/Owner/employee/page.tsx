"use client";
import React, { useState } from "react";

type Employee = {
  id: number;
  name: string;
  role: "Staff";
  avatar: string;
};

const employeesInit: Employee[] = [
  { id: 1, name: "ณัฐวุฒิ", role: "Staff", avatar: "/employees/emp1.jpg" },
  { id: 2, name: "ศิวกร", role: "Staff", avatar: "/employees/emp2.jpg" },
  { id: 3, name: "นพรกร", role: "Staff", avatar: "/employees/emp3.jpg" },
  { id: 4, name: "ชลกร", role: "Staff", avatar: "/employees/emp4.jpg" },
];

export default function EmployeePage() {
  const [employees, setEmployees] = useState(employeesInit);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (editing) {
      // แก้ไข
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editing.id ? { ...emp, name } : emp
        )
      );
    } else {
      // เพิ่ม
      const newEmp: Employee = {
        id: employees.length + 1,
        name,
        role: "Staff",
        avatar: "/employees/default.jpg",
      };
      setEmployees((prev) => [...prev, newEmp]);
    }
    setShowModal(false);
    setEditing(null);
  };

  return (
    <main className="p-7">
      <div className="mx-auto w-full  rounded-xl border border-black/60 bg-white shadow">
      
        {/* Table */}
       <div className="overflow-hidden rounded-xl border border-black/30">
  <table className="w-full table-fixed border-separate border-spacing-0">
    <thead>
      <tr className="text-left bg-[#B88C69]">
        <th className="w-16 border-b border-black/60 px-4 py-3 font-semibold">
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="rounded-md bg-[#C6D6AF] px-4 py-2 text-sm font-semibold text-black"
          >
            เพิ่ม
          </button>
        </th>
        <th className="w-28 border-b border-black/60 px-4 py-3 font-semibold">ภาพ</th>
        <th className="border-b border-black/60 px-4 py-3 font-semibold">ชื่อ</th>
        <th className="w-40 border-b border-black/60 px-4 py-3 font-semibold">หน้าที่</th>
        <th className="w-44 border-b border-black/60 px-4 py-3 text-right font-semibold"></th>
      </tr>
    </thead>
    <tbody>
      {employees.map((e, idx) => (
        <tr key={e.id}>
          <td className="border-b border-black/30 px-4 py-4 text-center">{idx + 1}</td>
          <td className="border-b border-black/30 px-4 py-3">
            <div className="h-14 w-14 overflow-hidden rounded-lg border border-black/30">
              <img src={e.avatar} alt={e.name} className="h-full w-full object-cover" />
            </div>
          </td>
          <td className="border-b border-black/30 px-4 py-4">{e.name}</td>
          <td className="border-b border-black/30 px-4 py-4">
            <span className="inline-block rounded-md bg-[#BDE0A8] px-3 py-1 text-sm font-semibold text-black">
              {e.role}
            </span>
          </td>
          <td className="border-b border-black/30 px-4 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditing(e);
                  setShowModal(true);
                }}
                className="rounded-md bg-[#A6C6DE] px-4 py-2 text-sm font-semibold text-black"
              >
                แก้ไข
              </button>
              <button
                onClick={() =>
                  setEmployees((prev) => prev.filter((p) => p.id !== e.id))
                }
                className="rounded-md bg-[#EBA5AD] px-4 py-2 text-sm font-semibold text-black"
              >
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editing ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}
              </h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">ชื่อ</label>
                <input
                  name="name"
                  defaultValue={editing?.name}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">รหัสผ่าน</label>
                <input type="password" name="password" className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">ยืนยันรหัสผ่าน</label>
                <input type="password" name="confirmPassword" className="w-full rounded border px-3 py-2" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="showpw" />
                <label htmlFor="showpw" className="text-sm">ดูรหัสผ่าน</label>
              </div>
              <div>
                <label className="block text-sm font-medium">ภาพผู้ใช้งาน</label>
                <input type="file" name="avatar" className="w-full rounded border px-3 py-2" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="reset"
                  className="rounded bg-pink-300 px-4 py-2 text-black"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded bg-gray-200 px-4 py-2 text-black"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-500 px-4 py-2 text-white"
                >
                  ตกลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
