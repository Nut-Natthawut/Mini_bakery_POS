"use client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const LogoutPage = () => {
  const router = useRouter();

    const handleLogout = async () => {
      toast.success("Logged out successfully");
    await fetch("/api/logout", { method: "POST" , credentials: "include" });
    

    await new Promise((r) => setTimeout(r, 1000));

    setTimeout(() => {
      router.push("/login");
    }, 3000);
  };
  return (
  <>
    <button onClick={handleLogout}>Logout</button>
  </> 
  )
}
export default LogoutPage;