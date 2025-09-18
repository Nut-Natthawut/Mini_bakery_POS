"use client";

const LogoutPage = () => {
    const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.replace("/login");
  };
  return (
   <>
    <button onClick={handleLogout}>Logout</button>
   </> 
  )
}
export default LogoutPage;