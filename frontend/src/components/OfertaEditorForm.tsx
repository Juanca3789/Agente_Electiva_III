import { FormEvent, useState } from "react";
import { api, Oferta } from "../api/client";
import { isEmptyHtml } from "../lib/html";
import RichDescriptionEditor from "./RichDescriptionEditor";

type Props = {
  mode: "create" | "edit";
  initial?: Oferta;
  onSaved: (oferta: Oferta) => void;
  onCancel?: () => void;
};

export default function OfertaEditorForm({ mode, initial, onSaved, onCancel }: Props) {
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "<p></p>");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (isEmptyHtml(descripcion)) {
      setError("La descripción no puede estar vacía.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim() || undefined,
        descripcion,
      };
      const res =
        mode === "edit" && initial
          ? await api.updateOferta(initial.id, payload)
          : await api.createOferta(payload);
      onSaved(res.oferta);
      if (mode === "create") {
        setTitulo("");
        setDescripcion("<p></p>");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card oferta-form" onSubmit={submit}>
      <h3 className="form-section-title">{mode === "create" ? "Nueva oferta" : "Editar oferta"}</h3>

      <label className="label" htmlFor="oferta-titulo">
        Título de la vacante
      </label>
      <input
        id="oferta-titulo"
        className="title-input"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ej. Desarrollador backend Python"
        autoComplete="off"
      />

      <RichDescriptionEditor
        editorKey={mode === "edit" ? initial?.id : "new"}
        value={descripcion}
        onChange={setDescripcion}
      />

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>
          {saving ? "Guardando…" : mode === "create" ? "Publicar oferta" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
