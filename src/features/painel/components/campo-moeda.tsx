"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const comCentavos = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function formatar(v: number | null, decimais: 0 | 2) {
  if (v === null || Number.isNaN(v)) return "";
  return decimais === 0 ? inteiro.format(v) : comCentavos.format(v);
}

interface Props extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (v: number | null) => void;
  prefixo?: string;
  /** Casas decimais aceitas na digitação (2 para R$, 0 para inteiros). */
  decimais?: 0 | 2;
}

/**
 * Entrada numérica com máscara pt-BR (ex.: "R$ 1.250.000,00"). Os dígitos são
 * tratados como centavos (modo caixa eletrônico); o texto exibido é derivado
 * do valor numérico, então o componente é totalmente controlado.
 */
export function CampoMoeda({ value, onChange, prefixo = "R$", decimais = 2, className, ...props }: Props) {
  const texto = formatar(value, decimais);

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, "").slice(0, 15);
    if (!digitos) {
      onChange(null);
      return;
    }
    onChange(decimais === 0 ? Number(digitos) : Number(digitos) / 100);
  }

  return (
    <div className="relative">
      {prefixo && (
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden>
          {prefixo}
        </span>
      )}
      <Input {...props} type="text" inputMode="numeric" autoComplete="off" value={texto} onChange={aoDigitar} className={cn("tabular-nums", prefixo && "pl-9", className)} />
    </div>
  );
}
