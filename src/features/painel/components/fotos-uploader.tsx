"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { adicionarFotosAction } from "../actions";

/** Arquivo escolhido: foto de celular passa de 5 MB, mas é reduzida antes do envio. */
const MAX_BYTES = 15 * 1024 * 1024;
/** GIF vai como está (preserva a animação), então vale o limite do que é enviado. */
const MAX_BYTES_GIF = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/gif", "image/webp"];
/** Fotos são reduzidas no navegador antes do envio (legado redimensionava para 800×600). */
const LARGURA_MAX = 1600;
const ALTURA_MAX = 1200;
const QUALIDADE_WEBP = 0.82;
const QUALIDADE_JPEG = 0.86;
/**
 * Tamanho por lote enviado à server action, medido no corpo já em base64 (o que trafega).
 * Fica bem abaixo dos limites do Next (10 MB no buffer do proxy por padrão, 20 MB configurados).
 */
const LOTE_BYTES = 6 * 1024 * 1024;

interface Pendente {
  id: string;
  file: File;
  preview: string;
  erro?: string;
}

interface Props {
  imovelId: string;
  totalAtual: number;
  limite: number;
}

function lerDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/**
 * Reduz e recodifica a foto no navegador: WebP quando o navegador sabe gerar (bem mais
 * leve que JPEG na mesma qualidade), JPEG caso contrário. Se a foto já cabia no tamanho
 * máximo e a versão recodificada não ficou menor, envia o arquivo original.
 */
async function otimizar(file: File): Promise<string> {
  if (file.type === "image/gif") return lerDataUrl(file); // preserva animação
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, LARGURA_MAX / bitmap.width, ALTURA_MAX / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return lerDataUrl(file);
    // Fundo branco: PNG com transparência viraria preto no JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    let saida = canvas.toDataURL("image/webp", QUALIDADE_WEBP);
    // Navegador sem encoder WebP devolve PNG em silêncio.
    if (!saida.startsWith("data:image/webp")) saida = canvas.toDataURL("image/jpeg", QUALIDADE_JPEG);
    if (escala === 1 && saida.length * 0.75 >= file.size) return lerDataUrl(file);
    return saida;
  } catch {
    return lerDataUrl(file);
  }
}

export function FotosUploader({ imovelId, totalAtual, limite }: Props) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<{ feito: number; total: number } | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const restantes = Math.max(0, limite - totalAtual);
  const validas = pendentes.filter((p) => !p.erro);
  const limiteCheio = restantes === 0;

  function adicionar(lista: FileList | File[]) {
    const arquivos = Array.from(lista);
    if (arquivos.length === 0) return;
    const novos: Pendente[] = [];
    let vagas = restantes - validas.length;
    for (const file of arquivos) {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      if (pendentes.some((p) => p.id === id)) continue;
      let erro: string | undefined;
      if (!TIPOS.includes(file.type)) erro = "Formato não suportado (use JPG, PNG, GIF ou WebP).";
      else if (file.type === "image/gif" && file.size > MAX_BYTES_GIF) erro = "GIF maior que 5 MB.";
      else if (file.size > MAX_BYTES) erro = "Arquivo maior que 15 MB.";
      else if (vagas <= 0) erro = "Excede o limite de fotos do plano.";
      else vagas -= 1;
      novos.push({ id, file, preview: URL.createObjectURL(file), erro });
    }
    setPendentes((atual) => [...atual, ...novos]);
    if (novos.some((n) => n.erro)) toast.warning("Alguns arquivos não podem ser enviados. Veja os avisos.");
  }

  function remover(id: string) {
    setPendentes((atual) => {
      const alvo = atual.find((p) => p.id === id);
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return atual.filter((p) => p.id !== id);
    });
  }

  function limpar() {
    pendentes.forEach((p) => URL.revokeObjectURL(p.preview));
    setPendentes([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function enviar() {
    if (validas.length === 0) return;
    setEnviando(true);
    setProgresso({ feito: 0, total: validas.length });
    let enviadas = 0;
    try {
      const urls: string[] = [];
      for (const p of validas) urls.push(await otimizar(p.file));

      // Envia em lotes para respeitar o limite de corpo da server action.
      const lotes: string[][] = [[]];
      let acumulado = 0;
      for (const u of urls) {
        const tam = u.length;
        if (acumulado + tam > LOTE_BYTES && lotes[lotes.length - 1]!.length > 0) {
          lotes.push([]);
          acumulado = 0;
        }
        lotes[lotes.length - 1]!.push(u);
        acumulado += tam;
      }

      for (const lote of lotes) {
        const r = await adicionarFotosAction(imovelId, lote);
        if (!r.ok) {
          toast.error(r.mensagem ?? "Falha ao enviar as fotos.");
          break;
        }
        enviadas += lote.length;
        setProgresso({ feito: enviadas, total: validas.length });
      }
      if (enviadas > 0) {
        toast.success(enviadas === 1 ? "1 foto adicionada." : `${enviadas} fotos adicionadas.`);
        limpar();
        router.refresh();
      }
    } catch {
      if (enviadas > 0) {
        // Um lote anterior já foi gravado: mostra o que entrou em vez de parecer que nada foi enviado.
        toast.error(`Só ${enviadas} de ${validas.length} fotos foram enviadas. Tente enviar as demais de novo.`);
        limpar();
        router.refresh();
      } else {
        toast.error("Não foi possível enviar as imagens. Tente enviar menos fotos por vez.");
      }
    } finally {
      setEnviando(false);
      setProgresso(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar fotos</CardTitle>
        <CardDescription>
          JPG, PNG ou WebP de até 15 MB cada (GIF até 5 MB). As fotos são reduzidas e otimizadas antes do envio. Proporção recomendada <strong>4:3</strong>. Você pode enviar várias de uma vez.{" "}
          {limiteCheio ? <span className="text-destructive">Limite de {limite} fotos atingido: remova alguma para enviar novas.</span> : <>Restam <strong>{restantes - validas.length}</strong> de {limite} vagas.</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            if (!limiteCheio && !enviando) setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            if (!limiteCheio && !enviando) adicionar(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            arrastando ? "border-brand bg-brand-soft" : "border-border hover:bg-muted/50",
            (limiteCheio || enviando) && "pointer-events-none opacity-60",
          )}
        >
          <CloudUpload className="size-8 text-brand" aria-hidden />
          <span className="text-sm font-medium">Arraste as fotos aqui ou clique para escolher</span>
          <span className="text-xs text-muted-foreground">Até {Math.max(0, restantes - validas.length)} arquivos neste envio</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={TIPOS.join(",")}
            multiple
            className="sr-only"
            disabled={limiteCheio || enviando}
            onChange={(e) => {
              if (e.target.files) adicionar(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {pendentes.length > 0 && (
          <>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-label="Fotos selecionadas">
              {pendentes.map((p) => (
                <li key={p.id} className={cn("relative overflow-hidden rounded-lg border bg-muted", p.erro && "border-destructive")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pré-visualização local (blob:) */}
                  <img src={p.preview} alt={p.file.name} className="aspect-[4/3] w-full object-cover" />
                  {!enviando && (
                    <button type="button" onClick={() => remover(p.id)} className="absolute top-1 right-1 rounded-full bg-background/90 p-1 text-foreground shadow hover:bg-background" aria-label={`Remover ${p.file.name} da seleção`}>
                      <X className="size-3.5" />
                    </button>
                  )}
                  {p.erro && (
                    <p className="absolute inset-x-0 bottom-0 bg-destructive/90 px-1.5 py-1 text-[10px] leading-tight text-white" role="alert">
                      {p.erro}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {progresso && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Enviando fotos…</span>
                  <span className="tabular-nums">
                    {progresso.feito}/{progresso.total}
                  </span>
                </div>
                <div role="progressbar" aria-valuemin={0} aria-valuemax={progresso.total} aria-valuenow={progresso.feito} className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progresso.total ? Math.max(5, (progresso.feito / progresso.total) * 100) : 0}%` }} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {validas.length} {validas.length === 1 ? "foto pronta" : "fotos prontas"} para envio
                {pendentes.length !== validas.length && ` · ${pendentes.length - validas.length} com problema`}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={limpar} disabled={enviando}>
                  Limpar
                </Button>
                <Button type="button" onClick={enviar} disabled={enviando || validas.length === 0}>
                  {enviando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <ImagePlus data-icon="inline-start" />}
                  Enviar {validas.length > 0 ? `${validas.length} ${validas.length === 1 ? "foto" : "fotos"}` : "fotos"}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
