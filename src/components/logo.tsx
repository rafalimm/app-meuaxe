import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Símbolo: duas folhas de Espada-de-São-Jorge cruzadas                */
/* ------------------------------------------------------------------ */

const LEAF =
  "M0 0 C -8.5 -13 -12.5 -33 -11.5 -55 C -10.5 -76 -5 -95 0 -108 C 5 -95 10.5 -76 11.5 -55 C 12.5 -33 8.5 -13 0 0 Z";
const VEIN = "M0 -8 C -1.2 -32 -1.2 -62 0 -100";

export function AxeSymbol({
  size = 40,
  className,
  leaf = "#173D30",
  vein = "#F7F6F0",
  accent = "#C7A96B",
}: {
  size?: number;
  className?: string;
  leaf?: string;
  vein?: string;
  accent?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="Símbolo de duas folhas de espada-de-são-jorge cruzadas"
      className={className}
    >
      {/* folha esquerda (atrás) */}
      <g transform="translate(60 90) rotate(-27)">
        <path d={LEAF} fill={leaf} />
        <path d={VEIN} stroke={vein} strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
      </g>
      {/* folha direita (frente) */}
      <g transform="translate(60 90) rotate(27)">
        <path d={LEAF} fill={leaf} />
        <path d={VEIN} stroke={vein} strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
      </g>
      {/* laço dourado no cruzamento */}
      <circle cx="60" cy="88" r="4.6" fill={accent} />
      <circle cx="60" cy="88" r="7.6" stroke={accent} strokeWidth="1.4" opacity="0.55" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Logotipo completo                                                   */
/* ------------------------------------------------------------------ */

export function Logo({
  size = 40,
  withWordmark = true,
  light = false,
  className,
  symbolClassName,
}: {
  size?: number;
  withWordmark?: boolean;
  light?: boolean;
  className?: string;
  symbolClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <AxeSymbol
        size={size}
        leaf={light ? "#E7EEE6" : "#173D30"}
        vein={light ? "#102D24" : "#F7F6F0"}
        accent="#C7A96B"
        className={symbolClassName}
      />
      {withWordmark && (
        <span
          className={cn(
            "font-display font-semibold tracking-[0.14em] uppercase leading-none",
            light ? "text-on-forest" : "text-forest dark:text-on-forest",
          )}
          style={{ fontSize: size * 0.42 }}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
