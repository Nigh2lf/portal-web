"use client";

import { useCallback, useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

interface GRecaptcha {
  ready(cb: () => void): void;
  execute(siteKey: string, opts: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: GRecaptcha;
  }
}

/**
 * reCAPTCHA v3 opcional: só carrega o script quando `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
 * está definida. `obterToken` devolve `undefined` quando desativado ou em falha,
 * e o server action segue sem o token (o backend decide se exige).
 */
export function useRecaptcha() {
  const carregado = useRef(false);

  useEffect(() => {
    if (!SITE_KEY || carregado.current) return;
    carregado.current = true;
    if (document.querySelector("script[data-recaptcha]")) return;
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = "1";
    document.head.appendChild(script);
  }, []);

  const obterToken = useCallback(async (action: string): Promise<string | undefined> => {
    if (!SITE_KEY || typeof window === "undefined" || !window.grecaptcha) return undefined;
    const g = window.grecaptcha;
    return new Promise((resolve) => {
      try {
        g.ready(() => {
          g.execute(SITE_KEY, { action })
            .then(resolve)
            .catch(() => resolve(undefined));
        });
      } catch {
        resolve(undefined);
      }
    });
  }, []);

  return { ativo: Boolean(SITE_KEY), obterToken };
}
