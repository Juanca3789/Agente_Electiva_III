import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Candidato, JevConsulta, JevPreview, Oferta } from "../api/client";
import JevConsultaCard from "../components/JevConsultaCard";
import { NavButton } from "../components/NavButton";
import { stripHtml } from "../lib/html";

export default function CandidateDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidato | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [preview, setPreview] = useState<JevPreview | null>(null);
  const [historial, setHistorial] = useState<JevConsulta[]>([]);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const titulosPorId = useMemo(() => {
    const m: Record<string, string> = {};
    for (const o of ofertas) {
      m[o.id] = o.titulo?.trim() || stripHtml(o.descripcion).slice(0, 60) || o.id.slice(0, 8);
    }
    return m;
  }, [ofertas]);

  const reloadJev = useCallback(async () => {
    const [h, p] = await Promise.all([
      api.jevHistorial(id),
      api.jevPreview(id).catch(() => null),
    ]);
    setHistorial(h.consultas);
    setPreview(p);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setError("");
    Promise.all([api.getCandidato(id), api.listOfertas(), reloadJev()])
      .then(([c, o]) => {
        setCandidate(c.candidato);
        setOfertas(o.ofertas);
      })
      .catch((e) => setError(String(e)));
  }, [id, reloadJev]);

  async function remove() {
    if (!candidate || !confirm(`¿Eliminar el CV «${candidate.original_filename ?? id}» y su historial Jev?`)) return;
    setError("");
    setDeleting(true);
    try {
      await api.deleteCandidato(id);
      navigate("/candidatos", { replace: true });
    } catch (e) {
      setError(String(e));
      setDeleting(false);
    }
  }

  async function runEvaluar() {
    setError("");
    setEvaluating(true);
    try {
      await api.evaluar(id);
      await reloadJev();
    } catch (e) {
      setError(String(e));
    } finally {
      setEvaluating(false);
    }
  }

  const puedeEvaluar = ofertas.length > 0;

  return (
    <section className="page-section">
      <div className="page-toolbar">
        <NavButton to="/candidatos" variant="ghost" size="sm">
          ← Candidatos
        </NavButton>
      </div>

      <header className="detail-header">
        <h2>{candidate?.original_filename ?? "Candidato"}</h2>
        {candidate && (
          <div className="detail-header-actions">
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--sm"
              disabled={evaluating || deleting || !puedeEvaluar}
              onClick={() => void runEvaluar()}
            >
              {evaluating ? "Evaluando…" : "Evaluar"}
            </button>
            <button type="button" className="ui-btn ui-btn--muted ui-btn--sm" disabled={deleting || evaluating} onClick={() => void remove()}>
              {deleting ? "Eliminando…" : "Eliminar CV"}
            </button>
          </div>
        )}
      </header>

      {!puedeEvaluar && candidate && <p className="hint">Registra ofertas para poder evaluar.</p>}

      {error && <p className="error">{error}</p>}

      {candidate && (
        <>
          <div className="card card--flush">
            <p className="meta">Registrado: {new Date(candidate.created_at).toLocaleString()}</p>
            <p className="meta">{candidate.texto.length.toLocaleString()} caracteres en el CV</p>
          </div>

          <div className="card">
            <h3 className="section-title">Qué se enviaría a Jev ahora</h3>
            {!preview ? (
              <p className="hint">No hay ofertas registradas.</p>
            ) : (
              <pre className="code-block">{JSON.stringify(preview.peticion, null, 2)}</pre>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">Texto del CV (state)</h3>
            <pre className="code-block code-block--cv">{candidate.texto}</pre>
          </div>

          <div className="card">
            <h3 className="section-title">Historial de consultas Jev</h3>
            {historial.length === 0 ? (
              <p className="hint">Aún no hay evaluaciones.</p>
            ) : (
              <div className="jev-historial-list">
                {historial.map((c) => (
                  <JevConsultaCard key={c.id} consulta={c} titulosPorId={titulosPorId} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
