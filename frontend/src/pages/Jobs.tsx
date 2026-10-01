import { useCallback, useEffect, useState } from "react";
import { api, Oferta } from "../api/client";
import ClickableRow, { stopRowClick } from "../components/ClickableRow";
import OfertaEditorForm from "../components/OfertaEditorForm";
import { stripHtml } from "../lib/html";

export default function Jobs() {
  const [items, setItems] = useState<Oferta[]>([]);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    api
      .listOfertas()
      .then((r) => setItems(r.ofertas))
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta oferta?")) return;
    setError("");
    try {
      await api.deleteOferta(id);
      reload();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <section className="page-section">
      <h2>Ofertas</h2>
      <OfertaEditorForm mode="create" onSaved={() => reload()} />

      {error && <p className="error">{error}</p>}
      {items.length === 0 ? (
        <p className="hint">Publica la primera oferta con el formulario de arriba.</p>
      ) : (
        <div className="card card--list">
          <ul className="entity-list">
            {items.map((o) => (
              <ClickableRow key={o.id} to={`/ofertas/${o.id}`}>
                <div className="entity-row-main">
                  <p className="entity-title">{o.titulo?.trim() || "Sin título"}</p>
                  <p className="oferta-list-desc">{stripHtml(o.descripcion).slice(0, 120)}</p>
                </div>
                <div className="entity-row-actions">
                  <button
                    type="button"
                    className="ui-btn ui-btn--muted ui-btn--sm"
                    onClick={(e) => {
                      stopRowClick(e);
                      void remove(o.id);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </ClickableRow>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
