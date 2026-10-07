"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra de progresso no topo da página durante qualquer navegação.
 *
 * O `loading.tsx` do App Router só aparece ao entrar numa rota nova; quando só a
 * query string muda (abas, ordenação, paginação, filtros) a tela antiga fica
 * parada até a API responder. Esta barra começa no clique em qualquer link
 * interno (ou em `iniciarNavegacao()`, para quem usa `router.push`) e termina
 * quando o pathname ou os parâmetros da URL mudam.
 */

const TEMPO_MAXIMO_MS = 30_000;

let ativa = false;
const ouvintes = new Set<() => void>();

function notificar() {
  for (const f of ouvintes) f();
}

/** Liga a barra. Idempotente; termina sozinha quando a URL muda. */
export function iniciarNavegacao() {
  if (ativa) return;
  ativa = true;
  notificar();
}

/** Desliga a barra (chamado automaticamente na troca de URL). */
export function concluirNavegacao() {
  if (!ativa) return;
  ativa = false;
  notificar();
}

function assinar(cb: () => void) {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}
const snapshot = () => ativa;
const snapshotServidor = () => false;

/** Clique que o Next vai tratar como navegação interna (sem nova aba, sem âncora). */
function cliqueNavegaInterno(e: MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const alvo = e.target as Element | null;
  const a = alvo?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  let url: URL;
  try {
    url = new URL(a.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  // Mesma página (só âncora `#`): nada a carregar.
  if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
  return true;
}

export function NavegacaoProgresso() {
  const navegando = useSyncExternalStore(assinar, snapshot, snapshotServidor);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barra = useRef<HTMLDivElement>(null);
  const primeiraRenderizacao = useRef(true);

  // Começa no clique em links internos e no botão voltar/avançar do navegador.
  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (cliqueNavegaInterno(e)) iniciarNavegacao();
    };
    const aoVoltar = () => iniciarNavegacao();
    document.addEventListener("click", aoClicar);
    window.addEventListener("popstate", aoVoltar);
    return () => {
      document.removeEventListener("click", aoClicar);
      window.removeEventListener("popstate", aoVoltar);
    };
  }, []);

  // Termina quando a URL muda (a página nova chegou).
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    concluirNavegacao();
  }, [pathname, searchParams]);

  // Animação direto no DOM: cresce até ~85% enquanto espera; fecha em 100% e some.
  useEffect(() => {
    const el = barra.current;
    if (!el) return;
    const temporizadores: number[] = [];
    const depois = (ms: number, f: () => void) => temporizadores.push(window.setTimeout(f, ms));

    if (navegando) {
      document.body.setAttribute("data-navegando", "");
      el.style.transition = "none";
      el.style.opacity = "1";
      el.style.width = "0%";
      el.setAttribute("aria-hidden", "false");
      depois(20, () => {
        el.style.transition = "width 8s cubic-bezier(0.1, 0.7, 0.3, 1)";
        el.style.width = "85%";
      });
      // Segurança: navegação cancelada, erro ou URL igual à atual.
      depois(TEMPO_MAXIMO_MS, concluirNavegacao);
    } else {
      document.body.removeAttribute("data-navegando");
      if (el.style.opacity === "1") {
        el.style.transition = "width 180ms ease-out, opacity 300ms ease 150ms";
        el.style.width = "100%";
        el.style.opacity = "0";
        depois(500, () => {
          el.style.transition = "none";
          el.style.width = "0%";
          el.setAttribute("aria-hidden", "true");
        });
      }
    }
    return () => temporizadores.forEach((t) => window.clearTimeout(t));
  }, [navegando]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        ref={barra}
        role="progressbar"
        aria-label="Carregando página"
        aria-hidden="true"
        className="h-full bg-cta shadow-[0_0_8px_var(--cta)]"
        style={{ width: "0%", opacity: 0 }}
      />
    </div>
  );
}
