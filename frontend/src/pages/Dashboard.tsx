import { useCallback, useEffect, useState } from "react";
import { api, CandidatoResumen, Oferta } from "../api/client";
import MiniClickableRow from "../components/MiniClickableRow";
import { NavButton } from "../components/NavButton";
import PdfDropzone from "../components/PdfDropzone";
import { stripHtml } from "../lib/html";
import { usePdfUpload } from "../hooks/usePdfUpload";

export default function Dashboard() {
  const [candidatos, setCandidatos] = useState<CandidatoResumen[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(() => {
    Promise.all([api.health(), api.listCandidatos(), api.listOfertas()])
      .then(([h, c, o]) => {
        setBackendOk(h.status === "ok");
        setCandidatos(c.candidatos);
        setOfertas(o.ofertas);
        setLoadError("");
      })
      .catch((e) => setLoadError(String(e)));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const { uploading, error: uploadError, notice, uploadFiles } = usePdfUpload(reload);

  return (
    <div className="dashboard page-section">
      <header className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p className="hint">
            Sube CVs, publica ofertas y evalúa con Jev al instante; cada consulta queda en el historial del candidato.
          </p>
        </div>
        <span className={`status-pill${backendOk ? " status-pill--ok" : backendOk === false ? " status-pill--bad" : ""}`}>
          {backendOk === null ? "Conectando…" : backendOk ? "API en línea" : "API caída"}
        </span>
      </header>

      {loadError && <p className="error">{loadError}</p>}

      <div className="kpi-grid kpi-grid--two">
        <div className="kpi-card">
          <span className="kpi-label">Candidatos</span>
          <span className="kpi-value">{candidatos.length}</span>
          <NavButton to="/candidatos" variant="ghost" size="sm">
            Ver todos
          </NavButton>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Ofertas activas</span>
          <span className="kpi-value">{ofertas.length}</span>
          <NavButton to="/ofertas" variant="ghost" size="sm">
            Gestionar
          </NavButton>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--hero">
        <section className="card dashboard-panel">
          <h3>Subir CVs</h3>
          <PdfDropzone onFiles={uploadFiles} disabled={uploading} />
          {uploading && <p className="hint">Extrayendo texto…</p>}
          {notice && <p className="notice">{notice}</p>}
          {uploadError && <p className="error">{uploadError}</p>}
        </section>

        <section className="card dashboard-panel dashboard-panel--actions">
          <h3>Acciones rápidas</h3>
          <div className="quick-actions">
            <NavButton to="/ofertas" variant="primary" className="btn-block">
              + Nueva oferta
            </NavButton>
            <NavButton to="/candidatos" variant="secondary" className="btn-block">
              Ir a candidatos
            </NavButton>
          </div>
        </section>
      </div>

      <div className="dashboard-grid dashboard-grid--lists">
        <section className="card dashboard-panel">
          <h3>Últimos candidatos</h3>
          {candidatos.length === 0 ? (
            <p className="hint">Sube un PDF arriba para empezar.</p>
          ) : (
            <ul className="mini-list">
              {candidatos.slice(0, 5).map((c) => (
                <MiniClickableRow
                  key={c.id}
                  to={`/candidatos/${c.id}`}
                  label={c.original_filename ?? c.id.slice(0, 8)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="card dashboard-panel">
          <h3>Últimas ofertas</h3>
          {ofertas.length === 0 ? (
            <p className="hint">Publica ofertas en la sección Ofertas.</p>
          ) : (
            <ul className="mini-list">
              {ofertas.slice(0, 5).map((o) => (
                <MiniClickableRow
                  key={o.id}
                  to={`/ofertas/${o.id}`}
                  label={o.titulo?.trim() || stripHtml(o.descripcion).slice(0, 48)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
