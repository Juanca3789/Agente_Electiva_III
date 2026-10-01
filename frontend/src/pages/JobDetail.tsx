import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NavButton } from "../components/NavButton";
import { api, Oferta } from "../api/client";
import OfertaEditorForm from "../components/OfertaEditorForm";

export default function JobDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [oferta, setOferta] = useState<Oferta | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [showTextoJev, setShowTextoJev] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getOferta(id)
      .then((r) => setOferta(r.oferta))
      .catch((e) => setError(String(e)));
  }, [id]);

  async function remove() {
    if (!oferta || !confirm(`¿Eliminar la oferta «${oferta.titulo?.trim() || id}»?`)) return;
    setError("");
    setDeleting(true);
    try {
      await api.deleteOferta(id);
      navigate("/ofertas", { replace: true });
    } catch (e) {
      setError(String(e));
      setDeleting(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-toolbar">
        <NavButton to="/ofertas" variant="ghost" size="sm">
          ← Ofertas
        </NavButton>
      </div>

      {error && <p className="error">{error}</p>}

      {oferta && editing ? (
        <OfertaEditorForm
          mode="edit"
          initial={oferta}
          onSaved={(o) => {
            setOferta(o);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        oferta && (
          <>
            <header className="detail-header">
              <h2 className="oferta-view-title">{oferta.titulo?.trim() || "Sin título"}</h2>
              <div className="detail-header-actions">
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setEditing(true)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn--muted ui-btn--sm"
                  disabled={deleting}
                  onClick={() => void remove()}
                >
                  {deleting ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </header>

            <div className="card">
              <p className="meta">ID: {oferta.id}</p>
              <p className="meta">Creada: {new Date(oferta.created_at).toLocaleString()}</p>
            </div>

            <div className="card">
              <h3 className="form-section-title">Vista previa (descripción)</h3>
              <div className="rich-preview" dangerouslySetInnerHTML={{ __html: oferta.descripcion }} />
            </div>

            <div className="card">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setShowTextoJev((v) => !v)}>
                {showTextoJev ? "Ocultar texto enviado a Jev" : "Ver texto plano para Jev"}
              </button>
              {showTextoJev && <pre className="code-block">{oferta.texto}</pre>}
            </div>
          </>
        )
      )}
    </section>
  );
}
