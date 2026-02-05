"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ToastProvider } from "@/app/components/ui/toast";
import { ConfirmDialogProvider } from "@/app/components/ui/confirm-dialog";
import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { SessionExpiredModal } from "@/app/components/ui/session-expired-modal";

import { Sidebar } from "./_components/sidebar";
import { Header } from "./_components/header";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Inner layout that uses auth context
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    status,
    user,
    error,
    retryCount,
    logout,
    showSessionExpiredModal,
    clearSessionExpired,
    checkAuth,
  } = useAuth();

  useEffect(() => {
    document.body.classList.add("admin-dashboard-active");
    return () => {
      document.body.classList.remove("admin-dashboard-active");
    };
  }, []);

  // Only redirect to login if truly unauthenticated (no token)
  // NOT on transient errors or session_expired (modal handles that)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  // Show checking state
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-xl border border-border bg-white px-6 py-4 text-sm text-gray-800 shadow-sm">
          Checking admin session…
        </div>
      </div>
    );
  }

  // Show transient error state (but don't kick user out)
  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="mx-4 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                Connection Issue
              </h2>
              <p className="mt-1 text-sm text-amber-700">
                {error || "Unable to verify your session."}
              </p>
              {retryCount > 0 && retryCount <= 3 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Retrying... (attempt {retryCount}/3)
                </p>
              )}
              {retryCount > 3 && (
                <button
                  onClick={() => checkAuth()}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated, show nothing (redirect will happen)
  if (status === "unauthenticated") {
    return null;
  }

  // Authenticated or session_expired (modal will show)
  return (
    <>
      {/* Session Expired Modal - shown instead of hard redirect */}
      <SessionExpiredModal
        isOpen={showSessionExpiredModal}
        onClose={clearSessionExpired}
        message={error || undefined}
      />

      <div
        className="flex h-screen bg-white text-gray-800 overflow-hidden max-w-full"
        data-admin-dashboard
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <Sidebar
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div
          className="flex flex-1 flex-col overflow-hidden min-w-0 h-screen"
          style={{ height: "100vh", overflow: "hidden" }}
        >
          <Header user={user} onMenuClick={() => setSidebarOpen((prev) => !prev)} />
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

// Outer layout that provides auth context
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <AdminLayoutInner>{children}</AdminLayoutInner>
        </ConfirmDialogProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
