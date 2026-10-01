/** Extrae filas ordenables desde la respuesta cruda de TypeSafe. */
export type JevFila = {
  ofertaId: string | null;
  etiqueta: string;
  valor: number;
  confidence?: number;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function parsearResultadoJev(
  jev: Record<string, unknown>,
  titulosPorId: Record<string, string>,
): { filas: JevFila[]; confidence?: number; rawKey: string } {
  const results = asRecord(jev.answers) ?? asRecord(jev.results) ?? jev;

  const encaja = asRecord(results.encaja) ?? asRecord(asRecord(results.results)?.encaja);
  if (encaja) {
    const valor =
      asNumber(encaja.noul) ??
      asNumber(encaja.value) ??
      asNumber(encaja.score) ??
      asNumber(encaja.probability);
    const confidence = asNumber(encaja.confidence) ?? undefined;
    if (valor !== null) {
      const id = Object.keys(titulosPorId)[0] ?? null;
      const etiqueta = id ? (titulosPorId[id] ?? id) : "Encaje";
      return { filas: [{ ofertaId: id, etiqueta, valor, confidence }], confidence, rawKey: "encaja" };
    }
  }

  const oferta = asRecord(results.oferta) ?? asRecord(asRecord(results.results)?.oferta);
  if (oferta) {
    const probs = asRecord(oferta.probabilities) ?? asRecord(oferta.probs);
    const confidence = asNumber(oferta.confidence) ?? undefined;
    if (probs) {
      const filas = Object.entries(probs)
        .map(([ofertaId, p]) => {
          const valor = asNumber(p);
          if (valor === null) return null;
          return {
            ofertaId,
            etiqueta: titulosPorId[ofertaId] ?? ofertaId.slice(0, 8),
            valor,
            confidence,
          };
        })
        .filter((x): x is JevFila => x !== null)
        .sort((a, b) => b.valor - a.valor);
      return { filas, confidence, rawKey: "oferta" };
    }
  }

  return { filas: [], rawKey: "unknown" };
}

export function formatoPorcentaje(n: number): string {
  return `${Math.round(n * 1000) / 10}%`;
}
