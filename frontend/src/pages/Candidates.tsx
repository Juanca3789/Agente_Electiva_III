import { useCallback, useEffect, useState } from "react";
import { api, CandidatoResumen, Oferta } from "../api/client";
import { stripHtml } from "../lib/html";
import ClickableRow, { stopRowClick } from "../components/ClickableRow";
import PdfDropzone from "../components/PdfDropzone";
import { useEvaluarCandidato } from "../hooks/useEvaluarCandidato";
import { usePdfUpload } from "../hooks/usePdfUpload";
import { formatoPorcentaje, parsearResultadoJev } from "../api/jev";

export default function Candidates() {
  const [items, setItems] = useState<CandidatoResumen[]>([]);
  const [ofertasCount, setOfertasCount] = useState(0);
  const [titulosPorId, setTitulosPorId] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    Promise.all([api.listCandidatos(), api.listOfertas()])
      .then(([c, o]) => {
        setItems(c.candidatos);
        setOfertasCount(o.ofertas.length);
        const m: Record<string, string> = {};
        for (const oferta of o.ofertas) {
          m[oferta.id] = oferta.titulo?.trim() || stripHtml(oferta.descripcion).slice(0, 48) || oferta.id;
        }
        setTitulosPorId(m);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const { uploading, error: uploadError, notice, uploadFiles } = usePdfUpload(reload);
  const { evaluar, evaluatingId, lastResult, error: evalError, setLastResult } = useEvaluarCandidato(reload);

  const lastParsed =
    lastResult?.jev && typeof lastResult.jev === "object"
      ? parsearResultadoJev(lastResult.jev as Record<string, unknown>, titulosPorId)
      : null;

  return (
    <section className="page-section">
      <h2>Candidatos</h2>
      <div className="card">
        <PdfDropzone onFiles={uploadFiles} disabled={uploading} />
        {uploading && <p className="hint">Procesando PDF…</p>}
        {notice && <p className="notice">{notice}</p>}
        {(uploadError || error) && <p className="error">{uploadError || error}</p>}
      </div>

      {evalError && <p className="error">{evalError}</p>}

      {lastResult && lastParsed && lastParsed.filas.length > 0 && (
        <div className="card card--highlight">
          <p className="section-title">Última evaluación</p>
          <p className="meta">
            Modo {lastResult.modo} · {lastResult.ofertas_evaluadas} oferta(s)
          </p>
          <ul className="jev-mini-result">
            {lastParsed.filas.map((f) => (
              <li key={f.ofertaId ?? f.etiqueta}>
                <span>{f.etiqueta}</span>
                <strong>{formatoPorcentaje(f.valor)}</strong>
              </li>
            ))}
          </ul>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setLastResult(null)}>
            Ocultar
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="hint">Aún no hay candidatos.</p>
      ) : (
        <div className="card card--list">
          <ul className="entity-list">
            {items.map((c) => (
              <ClickableRow key={c.id} to={`/candidatos/${c.id}`}>
                <div className="entity-row-main">
                  <p className="entity-title">{c.original_filename ?? c.id}</p>
                  <p className="meta">{c.chars.toLocaleString()} caracteres</p>
                </div>
                <div className="entity-row-actions">
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary ui-btn--sm"
                    disabled={evaluatingId !== null || ofertasCount === 0}
                    onClick={(e) => {
                      stopRowClick(e);
                      void evaluar(c.id);
                    }}
                  >
                    {evaluatingId === c.id ? "Evaluando…" : "Evaluar"}
                  </button>
                </div>
              </ClickableRow>
            ))}
          </ul>
        </div>
      )}
      {ofertasCount === 0 && items.length > 0 && (
        <p className="hint">Registra ofertas antes de evaluar.</p>
      )}
    </section>
  );
}
