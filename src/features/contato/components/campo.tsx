import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  htmlFor?: string;
  erro?: string;
  obrigatorio?: boolean;
  dica?: string;
  className?: string;
  children: React.ReactNode;
}

/** Rótulo + controle + mensagem de erro, padrão dos formulários públicos. */
export function Campo({ label, htmlFor, erro, obrigatorio, dica, className, children }: Props) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-foreground/90">
        {label}
        {obrigatorio && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {dica && !erro && <p className="text-xs text-muted-foreground">{dica}</p>}
      {erro && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
