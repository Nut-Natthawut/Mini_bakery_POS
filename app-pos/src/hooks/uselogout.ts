"use client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
const useLogout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out successfully", {
          position: "top-center",
          autoClose: 2000,
        });

        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      } else {
        toast.error("Logout failed. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
      return;
    }
  };
  return { handleLogout };
};
export default useLogout;
