"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { writeTextToClipboard } from "./copy-button.helpers";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export default function CopyButton({
  value,
  label = "Copy to clipboard",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy(): Promise<void> {
    await writeTextToClipboard(value);
    setCopied(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={label}
      title={copied ? "Copied!" : label}
      className={`relative p-1.5 rounded-lg text-dark-500 hover:text-brand-400 hover:bg-white/5 transition-all outline-none ${className}`}
    >
      {copied ? <Check className="h-4 w-4 text-accent-300" /> : <Copy className="h-4 w-4" />}
      {copied && (
        <span
          role="status"
          className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-accent-400/30 bg-dark-900/95 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-accent-300"
        >
          Copied!
        </span>
      )}
    </button>
  );
}