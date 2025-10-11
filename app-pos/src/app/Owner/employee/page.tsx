"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Employee = {
  id: string;
  name: string;
  role: "Staff";
  avatar: string; // รองรับทั้ง path ปกติ และ blob: ที่มาจาก createObjectURL
};

// ป้องกันเคสที่บาง runtime ไม่มี crypto.randomUUID (เช่น บราวเซอร์เก่าหรือ polyfill หาย)
const makeId = () => {
  const g: any = globalThis as any;
  if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  // fallback แบบง่าย
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

const seedEmployees: Employee[] = [
  { id: makeId(), name: "ณัฐวุฒิ", role: "Staff", avatar: "/employees/emp1.jpg" },
  { id: makeId(), name: "ศิวกร", role: "Staff", avatar: "/employees/emp2.jpg" },
  { id: makeId(), name: "นพรกร", role: "Staff", avatar: "/employees/emp3.jpg" },
  { id: makeId(), name: "ชลกร", role: "Staff", avatar: "/employees/emp4.jpg" },
];

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [showPw, setShowPw] = useState(false);

  // อ้างอิงฟอร์ม เพื่อ reset ได้สะดวกและเคลียร์ state ตอนปิด
  const formRef = useRef<HTMLFormElement | null>(null);

  // ปิดโมดอลแบบรวมศูนย์ + เคลียร์ของที่ต้องเคลียร์
  const closeModal = () => {
    formRef.current?.reset();
    setShowPw(false);
    setEditing(null);
    setShowModal(false);
  };

  // ปิดด้วย Esc
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string | null)?.trim() || "";
    const password = (fd.get("password") as string) || "";
    const confirm = (fd.get("confirmPassword") as string) || "";
    const file = (fd.get("avatar") as File) ?? null;

    if (!name) return alert("กรุณากรอกชื่อ");
    // ถ้าเป็นการเพิ่มใหม่ ค่อยบังคับรหัสผ่าน (ตอนแก้ไขไม่บังคับ)
    if (!editing) {
      if (!password) return alert("กรุณากรอกรหัสผ่าน");
      if (password !== confirm) return alert("รหัสผ่านไม่ตรงกัน");
    }

    // ถ้าแนบไฟล์ ใช้ blob URL; ถ้าไม่แนบ ให้คงค่าเดิม (ตอนแก้ไข) หรือใช้ default (ตอนเพิ่ม)
    const avatar =
      file && file.size > 0
        ? URL.createObjectURL(file)
        : editing?.avatar ?? "/employees/default.jpg";

    if (editing) {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === editing.id ? { ...emp, name, avatar } : emp))
      );
    } else {
      const newEmp: Employee = {
        id: makeId(),
        name,
        role: "Staff",
        avatar,
      };
      setEmployees((prev) => [...prev, newEmp]);
    }

    closeModal();
  };

  return (
    <main className="p-7">
      <div className="mx-auto w-full rounded-xl border border-black/60 bg-white shadow">
        <div className="overflow-hidden rounded-xl border border-black/30">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="text-left bg-[#B88C69]">
                <th className="w-16 border-b border-black/60 px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setShowModal(true);
                    }}
                    className="rounded-md bg-[#C6D6AF] px-4 py-2 text-sm font-semibold text-black"
                  >
                    เพิ่ม
                  </button>
                </th>
                <th scope="col" className="w-28 border-b border-black/60 px-4 py-3 font-semibold">
                  ภาพ
                </th>
                <th scope="col" className="border-b border-black/60 px-4 py-3 font-semibold">
                  ชื่อ
                </th>
                <th scope="col" className="w-40 border-b border-black/60 px-4 py-3 font-semibold">
                  หน้าที่
                </th>
                <th scope="col" className="w-44 border-b border-black/60 px-4 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, idx) => (
                <tr key={e.id}>
                  <td className="border-b border-black/30 px-4 py-4 text-center">{idx + 1}</td>
                  <td className="border-b border-black/30 px-4 py-3">
                    <div className="h-14 w-14 overflow-hidden rounded-lg border border-black/30">
                      {/* revoke blob URL หลังโหลดเสร็จ เพื่อลด memory leak */}
                      <img
                        src={e.avatar}
                        alt={e.name}
                        className="h-full w-full object-cover"
                        onLoad={(ev) => {
                          const src = (ev.currentTarget as HTMLImageElement).src;
                          if (src.startsWith("blob:")) {
                            try {
                              URL.revokeObjectURL(src);
                            } catch {}
                          }
                        }}
                      />
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
                        type="button"
                        onClick={() => {
                          setEditing(e);
                          setShowModal(true);
                        }}
                        className="rounded-md bg-[#A6C6DE] px-4 py-2 text-sm font-semibold text-black"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`ยืนยันลบ ${e.name}?`)) {
                            setEmployees((prev) => prev.filter((p) => p.id !== e.id));
                          }
                        }}
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onMouseDown={(e) => {
            // ปิดเมื่อคลิกพื้นที่มืด (ตรวจว่า target คือ backdrop เอง)
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()} // กันบับเบิลจากกล่องโมดอล
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="modalTitle" className="text-lg font-bold">
                {editing ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="ปิด"
                className="rounded px-2 py-1 hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium" htmlFor="name">
                  ชื่อ
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={editing?.name}
                  className="w-full rounded border px-3 py-2"
                  autoFocus
                />
              </div>

              {!editing && (
                <>
                  <div>
                    <label className="block text-sm font-medium" htmlFor="password">
                      รหัสผ่าน
                    </label>
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      name="password"
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" htmlFor="confirmPassword">
                      ยืนยันรหัสผ่าน
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPw ? "text" : "password"}
                      name="confirmPassword"
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showpw"
                      checked={showPw}
                      onChange={(e) => setShowPw(e.target.checked)}
                    />
                    <label htmlFor="showpw" className="text-sm">
                      ดูรหัสผ่าน
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium" htmlFor="avatar">
                  ภาพผู้ใช้งาน
                </label>
                <input
                  id="avatar"
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="reset" className="rounded bg-pink-300 px-4 py-2 text-black">
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded bg-gray-200 px-4 py-2 text-black"
                >
                  ปิด
                </button>
                <button type="submit" className="rounded bg-blue-500 px-4 py-2 text-white">
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
