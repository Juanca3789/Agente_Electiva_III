"""Solo Flask. Ejecutar desde backend: python app.py"""

from __future__ import annotations

import tempfile
from pathlib import Path

from flask import Flask, jsonify, request

from cv import texto_desde_pdf
from db import store
from seleccionar import construir_peticion, evaluar_cv

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
app.json.ensure_ascii = False


@app.errorhandler(ValueError)
def _bad_request(exc: ValueError):
    return jsonify({"error": str(exc)}), 400


@app.errorhandler(KeyError)
def _missing(exc: KeyError):
    return jsonify({"error": str(exc)}), 404


@app.errorhandler(RuntimeError)
def _upstream(exc: RuntimeError):
    return jsonify({"error": str(exc)}), 502


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/ofertas")
def get_ofertas():
    return jsonify({"ofertas": store.listar_ofertas()})


@app.post("/api/ofertas")
def post_oferta():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ValueError("JSON esperado.")
    desc = str(body.get("descripcion") or body.get("description") or "").strip()
    titulo = body.get("titulo") or body.get("title")
    titulo = str(titulo).strip() if titulo else None
    oid = body.get("id") or body.get("oferta_id")
    oid = str(oid).strip() if oid else None
    return jsonify({"oferta": store.crear_oferta(desc, titulo=titulo, oid=oid)}), 201


@app.get("/api/ofertas/<oid>")
def get_oferta(oid: str):
    return jsonify({"oferta": store.obtener_oferta(oid)})


@app.patch("/api/ofertas/<oid>")
def patch_oferta(oid: str):
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ValueError("JSON esperado.")
    desc = str(body.get("descripcion") or body.get("description") or "").strip()
    if not desc:
        raise ValueError("Descripción requerida.")
    titulo = body.get("titulo") or body.get("title")
    titulo = str(titulo).strip() if titulo else None
    return jsonify({"oferta": store.actualizar_oferta(oid, desc, titulo=titulo)})


@app.delete("/api/ofertas/<oid>")
def delete_oferta(oid: str):
    store.borrar_oferta(oid)
    return jsonify({"status": "ok", "id": oid})


@app.get("/api/candidatos")
def get_candidatos():
    return jsonify({"candidatos": store.listar_candidatos()})


@app.post("/api/candidatos")
def post_candidato():
    f = request.files.get("file") or request.files.get("pdf")
    if not f or not f.filename or not f.filename.lower().endswith(".pdf"):
        raise ValueError("Campo file con PDF.")
    pdf = f.read()
    if not pdf:
        raise ValueError("PDF vacío.")
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        path = Path(tmp.name)
        path.write_bytes(pdf)
    try:
        texto = texto_desde_pdf(path)
    finally:
        path.unlink(missing_ok=True)
    candidato, duplicado = store.crear_candidato(pdf=pdf, texto=texto, filename=f.filename)
    status = 200 if duplicado else 201
    return jsonify({"candidato": candidato, "duplicado": duplicado}), status


@app.get("/api/candidatos/<cid>")
def get_candidato(cid: str):
    return jsonify({"candidato": store.obtener_candidato(cid)})


@app.delete("/api/candidatos/<cid>")
def delete_candidato(cid: str):
    store.borrar_candidato(cid)
    return jsonify({"status": "ok", "id": cid})


@app.get("/api/candidatos/<cid>/jev-preview")
def jev_preview(cid: str):
    cv = store.obtener_candidato(cid)["texto"]
    ofertas = store.ofertas_para_jev()
    if not ofertas:
        raise ValueError("No hay ofertas registradas.")
    peticion, modo = construir_peticion(cv, ofertas)
    return jsonify(
        {
            "candidato_id": cid,
            "ofertas_evaluadas": len(ofertas),
            "modo": modo,
            "peticion": peticion,
        }
    )


@app.get("/api/candidatos/<cid>/jev-historial")
def jev_historial(cid: str):
    store.obtener_candidato(cid)
    return jsonify({"consultas": store.listar_jev_consultas(cid)})


@app.post("/api/evaluar")
def post_evaluar():
    ofertas = store.ofertas_para_jev()
    if not ofertas:
        raise ValueError("No hay ofertas registradas.")

    cv: str | None = None
    cid: str | None = None
    if request.is_json and isinstance(body := request.get_json(silent=True), dict):
        cid = body.get("candidato_id") or body.get("cv_id")
        cid = str(cid).strip() if cid else None
        cv = str(body.get("cv") or body.get("cv_text") or "").strip() or None
    if cid:
        cv = store.obtener_candidato(cid)["texto"]
    if not cv:
        f = request.files.get("file") or request.files.get("pdf")
        if f and f.filename:
            pdf = f.read()
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                path = Path(tmp.name)
                path.write_bytes(pdf)
            try:
                cv = texto_desde_pdf(path)
            finally:
                path.unlink(missing_ok=True)
    if not cv:
        raise ValueError("candidato_id, cv en JSON, o PDF en file.")

    jev, modo, peticion = evaluar_cv(cv, ofertas)
    consulta = store.guardar_jev_consulta(
        candidato_id=cid,
        modo=modo,
        ofertas_evaluadas=len(ofertas),
        peticion=peticion,
        respuesta=jev,
    )
    return jsonify(
        {
            "candidato_id": cid,
            "ofertas_evaluadas": len(ofertas),
            "modo": modo,
            "jev": jev,
            "consulta_id": consulta["id"],
        }
    )


if __name__ == "__main__":
    # Sin reloader: evita ventana ECONNREFUSED (Vite devuelve HTTP 500 al proxy).
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)
