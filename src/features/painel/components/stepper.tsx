"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  rotulo: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** Contador inteiro com botões −/+ (quartos, vagas etc.). */
export function Stepper({ id, value, onChange, min = 0, max = 99, rotulo, ...a11y }: Props) {
  const limitar = (n: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)));
  return (
    <div className="flex items-center" role="group" aria-label={rotulo}>
      <Button type="button" variant="outline" size="icon-sm" className="h-8 rounded-r-none" onClick={() => onChange(limitar(value - 1))} disabled={value <= min} aria-label={`Diminuir ${rotulo}`}>
        <Minus />
      </Button>
      <Input
        {...a11y}
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(limitar(e.target.valueAsNumber))}
        className="h-8 w-16 rounded-none border-x-0 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button type="button" variant="outline" size="icon-sm" className="h-8 rounded-l-none" onClick={() => onChange(limitar(value + 1))} disabled={value >= max} aria-label={`Aumentar ${rotulo}`}>
        <Plus />
      </Button>
    </div>
  );
}
