/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useRef, useState } from "react";
import type { Role, UIUser } from "@/types/type";
import { toast, Toaster } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UIRegisterSchema,
  UIUpdateUserSchema,
  type UIRegisterInput,
  type UIUpdateUserInput,
  toCreatePayload,
  toUpdatePayload,
} from "@/types/auth-ui";

export default function EmployeesPage() {
  const [rows, setRows] = useState<UIUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UIUser | null>(null);
  const [confirming, setConfirming] = useState<UIUser | null>(null);

  // === react-hook-form (สลับ schema ตามโหมด เพิ่ม/แก้ไข) ===
  const isEdit = Boolean(editing);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UIRegisterInput | UIUpdateUserInput>({
    // cast resolver to any to avoid incompatible Resolver overload between two schemas
    resolver: zodResolver(isEdit ? UIUpdateUserSchema : UIRegisterSchema) as any,
    mode: "onBlur",
  });

  // === โหลดข้อมูลจาก API ===
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users?role=Staff", { cache: "no-store" });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.message || res.statusText);
      setRows(out);
    } catch (e: any) {
      const msg = e?.message || "โหลดข้อมูลไม่สำเร็จ";
      setError(msg);
      toast.error(msg, { id: "users-load" });
    } finally {
      setLoading(false);
    }
  };

  // กัน Strict Mode เรียกซ้ำ
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    load();
  }, []);

  // === เปิดโมดอล: เพิ่ม ===
  const onOpenAdd = () => {
    setEditing(null);
    reset({
      username: "",
      password: "",
      confirmPassword: "",
      role: "Staff",
      fullName: "",
    } as UIRegisterInput);
    setOpen(true);
  };

  // === เปิดโมดอล: แก้ไข ===
  const onOpenEdit = (u: UIUser) => {
    setEditing(u);
    reset({
      role: u.role as Role,
      fullName: u.fullName ?? "",
      newPassword: "",
    } as UIUpdateUserInput);
    setOpen(true);
  };

  const close = () => {
    reset({} as any);
    setEditing(null);
    setOpen(false);
  };

  // === Submit หลังผ่าน Zod แล้ว ===
  const submit = handleSubmit(async (values:any) => {
    try {
      let res: Response;
      if (isEdit && editing) {
        const body = toUpdatePayload(values as UIUpdateUserInput);
        res = await fetch(`/api/users/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const body = toCreatePayload(values as UIRegisterInput);
        res = await fetch(`/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.message || res.statusText);

      toast.success(isEdit ? "อัปเดตผู้ใช้สำเร็จ" : "สร้างผู้ใช้สำเร็จ", {
        id:
          isEdit && editing
            ? `update-${editing.id}`
            : `create-${(values as any).username || "new"}`,
      });

      await load();
      close();
    } catch (e: any) {
      toast.error(e?.message || "บันทึกไม่สำเร็จ", { id: "user-save" });
    }
  });

  // === Confirm Delete ===
  const handleConfirmDelete = async () => {
    if (!confirming) return;
    const u = confirming;
    const tid = `delete-${u.id}`;

    toast.loading("กำลังลบผู้ใช้...", { id: tid });
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.message || res.statusText);

      toast.success("ลบผู้ใช้สำเร็จ", { id: tid });
      await load();
    } catch (e: any) {
      toast.error(e?.message || "ลบไม่สำเร็จ", { id: tid });
    } finally {
      setConfirming(null);
    }
  };

  return (
    <main className="p-7">
      <Toaster richColors position="top-center" />

      <div className="mb-4 flex items-center justify-between">
        <button
          className="rounded-md px-4 py-2 text-sm font-semibold text-black"
          style={{ background: "#C6D6AF" }}
          onClick={onOpenAdd}
        >
          เพิ่ม
        </button>
      </div>

      <div className="mx-auto w-full rounded-xl border border-black/60 bg-white shadow">
        <div className="overflow-hidden rounded-xl border border-black/30">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="text-left" style={{ background: "#B88C69" }}>
                <th className="w-16 border-b border-black/60 px-4 py-3 font-semibold">
                  ลำดับ
                </th>
                <th className="w-64 border-b border-black/60 px-4 py-3 font-semibold">
                  Username
                </th>
                <th className="border-b border-black/60 px-4 py-3 font-semibold">
                  ชื่อ-สกุล
                </th>
                <th className="w-40 border-b border-black/60 px-4 py-3 font-semibold">
                  บทบาท
                </th>
                <th className="w-44 border-b border-black/60 px-4 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-red-600">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                rows.map((u, idx) => (
                  <tr key={u.id}>
                    <td className="border-b border-black/30 px-4 py-4 text-center">
                      {idx + 1}
                    </td>
                    <td className="border-b border-black/30 px-4 py-4">
                      {u.username}
                    </td>
                    <td className="border-b border-black/30 px-4 py-4">
                      {u.fullName}
                    </td>
                    <td className="border-b border-black/30 px-4 py-4">
                      <span
                        className="inline-block rounded-md px-3 py-1 text-sm font-semibold text-black"
                        style={{ background: "#BDE0A8" }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="border-b border-black/30 px-4 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(u)}
                          className="rounded-md px-4 py-2 text-sm font-semibold text-black"
                          style={{ background: "#A6C6DE" }}
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(u)}
                          className="rounded-md px-4 py-2 text-sm font-semibold text-black"
                          style={{ background: "#EBA5AD" }}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* โมดอล เพิ่ม/แก้ไข */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {isEdit ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {!isEdit && (
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    className="w-full rounded border px-3 py-2"
                    autoFocus
                    {...register("username" as const)}
                  />
                  {"username" in errors && (
                    <p className="mt-1 text-xs text-red-600">
                      {(errors as any).username?.message}
                    </p>
                  )}
                </div>
              )}

              {!isEdit && (
                <>
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor="password"
                    >
                      รหัสผ่าน
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="w-full rounded border px-3 py-2"
                      {...register("password" as const)}
                    />
                    {"password" in errors && (
                      <p className="mt-1 text-xs text-red-600">
                        {(errors as any).password?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor="confirmPassword"
                    >
                      ยืนยันรหัสผ่าน
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className="w-full rounded border px-3 py-2"
                      {...register("confirmPassword" as const)}
                    />
                    {"confirmPassword" in errors && (
                      <p className="mt-1 text-xs text-red-600">
                        {(errors as any).confirmPassword?.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium" htmlFor="fullName">
                  ชื่อ-สกุล
                </label>
                <input
                  id="fullName"
                  className="w-full rounded border px-3 py-2"
                  {...register("fullName" as const)}
                />
                {"fullName" in errors && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).fullName?.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="role">
                  บทบาท
                </label>
                <select
                  id="role"
                  className="w-full rounded border px-3 py-2"
                  {...register("role" as const)}
                  defaultValue={isEdit ? editing?.role : "Staff"}
                >
                  <option value="Staff">Staff</option>
                  <option value="Owner">Owner</option>
                </select>
                {"role" in errors && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).role?.message}
                  </p>
                )}
              </div>

              {isEdit && (
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor="newPassword"
                  >
                    เปลี่ยนรหัสผ่าน (ถ้าต้องการ)
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className="w-full rounded border px-3 py-2"
                    {...register("newPassword" as const)}
                  />
                  {"newPassword" in errors && (
                    <p className="mt-1 text-xs text-red-600">
                      {(errors as any).newPassword?.message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded bg-gray-200 px-4 py-2"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded px-4 py-2 text-white disabled:opacity-60"
                  style={{ background: "#3b82f6" }}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* โมดอลยืนยันการลบ */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirming(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmTitle"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 id="confirmTitle" className="text-lg font-bold">
                ยืนยันการลบผู้ใช้
              </h3>
              <p className="mt-2 text-sm text-gray-700">
                ต้องการลบผู้ใช้{" "}
                <span className="font-semibold">{confirming.username}</span>{" "}
                ใช่หรือไม่?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded bg-gray-200 px-4 py-2 text-black"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded px-4 py-2 text-white"
                style={{ background: "#dc2626" }}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
