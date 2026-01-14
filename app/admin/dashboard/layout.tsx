"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ToastProvider } from "@/app/components/ui/toast";
import { ConfirmDialogProvider } from "@/app/components/ui/confirm-dialog";

import { Sidebar } from "./_components/sidebar";
import { Header } from "./_components/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      router.push("/admin/login");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-xl border border-border bg-white px-6 py-4 text-sm text-gray-800 shadow-sm">
          Checking admin session…
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <div className="flex h-screen bg-white text-gray-800">
          <Sidebar pathname={pathname} user={user} onLogout={handleLogout} />

          <div className="flex flex-1 flex-col overflow-hidden">
            <Header user={user} />
            <main className="flex-1 overflow-y-auto bg-white">
              <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
          </div>
        </div>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}

