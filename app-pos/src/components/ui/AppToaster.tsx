// components/ui/AppToaster.tsx
'use client';

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand
      toastOptions={{
        className: "font-poppins text-sm shadow-md",
      }}
    />
  );
}
