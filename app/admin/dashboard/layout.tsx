"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ToastProvider } from "@/app/components/ui/toast";
import { ConfirmDialogProvider } from "@/app/components/ui/confirm-dialog";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogFooter } from "@/app/components/ui/dialog";
import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { Sidebar } from "./_components/sidebar";
import { Header } from "./_components/header";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, logout, clearSessionExpired, showSessionExpiredModal } = useAuth();

  useEffect(() => {
    document.body.classList.add("admin-dashboard-active");
    return () => document.body.classList.remove("admin-dashboard-active");
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnTo = pathname ? encodeURIComponent(pathname) : "";
      router.push(returnTo ? `/admin/login?returnTo=${returnTo}` : "/admin/login");
    }
  }, [status, pathname, router]);

  const goToLogin = () => {
    clearSessionExpired();
    const returnTo = pathname ? encodeURIComponent(pathname) : "";
    router.push(returnTo ? `/admin/login?returnTo=${returnTo}` : "/admin/login");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-xl border border-border bg-white px-6 py-4 text-sm text-gray-800 shadow-sm">
          Checking admin session…
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <>
      <Dialog
        open={showSessionExpiredModal}
        onOpenChange={(open) => !open && goToLogin()}
        title="Session expired"
        maxWidth="sm"
        footer={
          <DialogFooter className="justify-end">
            <Button onClick={goToLogin}>Log in</Button>
          </DialogFooter>
        }
      >
        <p className="text-sm text-muted-foreground">Please log in again to continue.</p>
      </Dialog>

      <div
        className="flex h-screen bg-white text-gray-800 overflow-hidden max-w-full"
        data-admin-dashboard
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <Sidebar pathname={pathname} user={user} onLogout={handleLogout} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0 h-screen" style={{ height: "100vh", overflow: "hidden" }}>
          <Header user={user} />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/40 min-w-0"
            style={{ overflowY: "auto", overflowX: "hidden" }}
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8 w-full min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <DashboardShell>{children}</DashboardShell>
        </ConfirmDialogProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
