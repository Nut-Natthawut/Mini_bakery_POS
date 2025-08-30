import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";


export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <SidebarProvider>
      <AppSidebar />
      <div className="min-h-screen">
        <div className="flex">
          {/* Sidebar */}
          

          {/* Main Content */}

          <main className="flex-1 p-6">
            <SidebarTrigger />
            {children}

          </main>
        </div>
      </div>
      </SidebarProvider>
    </>
  );
}
