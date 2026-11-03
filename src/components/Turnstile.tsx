"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: Record<string, string | (() => void) | ((token: string) => void)>
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  siteKey: string;
  resetKey: number;
  onToken: (token: string) => void;
};

export function Turnstile({ siteKey, resetKey, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready || !window.turnstile || !containerRef.current) return;
    if (widgetRef.current) return;

    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      language: "nl",
      theme: "light",
      action: "generate",
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });

    return () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [onToken, ready, siteKey]);

  useEffect(() => {
    if (widgetRef.current && window.turnstile) {
      window.turnstile.reset(widgetRef.current);
      onToken("");
    }
  }, [onToken, resetKey]);

  return (
    <div className="turnstile-wrap">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={containerRef} />
      <small>Gratis botcontrole. Want AI-rekeningen zijn minder grappig.</small>
    </div>
  );
}
