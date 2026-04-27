"use client";

import React from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { StellarProvider } from "@/context/StellarContext";
import { ToastProvider } from "@/components/ui/toast-provider";
import { SkipLink } from "@/components/ui/skip-link";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import OfflineBanner from "./offline-banner";

/** True when the device reports fewer than 4 logical CPU cores. */
const isLowEnd =
  typeof navigator !== "undefined" &&
  typeof navigator.hardwareConcurrency === "number" &&
  navigator.hardwareConcurrency < 4;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {/* #548: skip Three.js canvas on low-end devices; use a lightweight CSS gradient instead */}
      {isLowEnd ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-[1]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(92,124,250,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(32,201,151,0.06) 0%, transparent 60%)",
          }}
        />
      ) : (
        <DottedSurface />
      )}
      <div className="mesh-gradient" aria-hidden="true" />
      <SkipLink />
      <StellarProvider>
        <ToastProvider>
          <ErrorBoundary>
            <OfflineBanner />
            <div className="relative z-10">{children}</div>
          </ErrorBoundary>
        </ToastProvider>
      </StellarProvider>
    </ThemeProvider>
  );
}

export default AppShell;
