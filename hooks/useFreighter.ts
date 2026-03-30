"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isFreighterInstalled,
  connectWallet,
  getPublicKey,
} from "@/lib/stellar/wallet";

export interface UseFreighterReturn {
  publicKey: string | null;
  isConnected: boolean;
  isFreighterInstalled: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useFreighter(): UseFreighterReturn {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check installation and restore connection on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const extensionInstalled = await isFreighterInstalled();
        if (cancelled) return;
        setInstalled(extensionInstalled);

        if (extensionInstalled) {
          const key = await getPublicKey();
          if (cancelled) return;
          if (key) setPublicKey(key);
        }
      } catch {
        // Silently fail on init — user can connect manually
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const key = await connectWallet();
      setPublicKey(key);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
  }, []);

  return {
    publicKey,
    isConnected: publicKey !== null,
    isFreighterInstalled: installed,
    isLoading,
    error,
    connect,
    disconnect,
  };
}
