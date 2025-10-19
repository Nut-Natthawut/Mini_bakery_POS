// app/Owner/layout.tsx 
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getTokenPayload } from "@/lib/auth-helpers";
import AppToaster from "@/components/ui/AppToaster"; 


export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = getTokenPayload();
  if (!payload) {
    redirect("/login");
  }

  return (
    <>
      <SidebarProvider className="h-screen w-full bg-[#FFFDE4]">
        <AppSidebar />
        <div className="min-h-screen bg-[#FFFDE4]">
          <div className="flex">
            <main className="flex-1 p-6">
              <SidebarTrigger className="absolute top-4 z-10 w-10 hover:bg-white transition-all duration-200 [&_svg]:w-6 [&_svg]:h-6" />
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>

      
      <AppToaster />
    </>
  );
}
