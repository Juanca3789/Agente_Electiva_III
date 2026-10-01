from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Iterator

from ofertas import armar_texto, validar_descripcion
from paths import DATA, DB_PATH


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        DATA.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_schema(self) -> None:
        with self._conn() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS candidatos (
                    id TEXT PRIMARY KEY,
                    original_filename TEXT,
                    pdf BLOB NOT NULL,
                    texto TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS ofertas (
                    id TEXT PRIMARY KEY,
                    titulo TEXT,
                    descripcion TEXT NOT NULL,
                    texto TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS jev_consultas (
                    id TEXT PRIMARY KEY,
                    candidato_id TEXT,
                    created_at TEXT NOT NULL,
                    modo TEXT NOT NULL,
                    ofertas_evaluadas INTEGER NOT NULL,
                    peticion_json TEXT NOT NULL,
                    respuesta_json TEXT NOT NULL
                );
                """
            )
            self._ensure_column(conn, "candidatos", "pdf_hash", "TEXT")
            conn.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_candidatos_pdf_hash "
                "ON candidatos(pdf_hash) WHERE pdf_hash IS NOT NULL"
            )

    @staticmethod
    def _ensure_column(conn: sqlite3.Connection, table: str, column: str, decl: str) -> None:
        cols = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
        if column not in cols:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")

    @staticmethod
    def _pdf_hash(pdf: bytes) -> str:
        return hashlib.sha256(pdf).hexdigest()

    def crear_candidato(self, *, pdf: bytes, texto: str, filename: str | None) -> tuple[dict[str, Any], bool]:
        """Devuelve (candidato, duplicado). Mismo PDF → mismo registro."""
        pdf_hash = self._pdf_hash(pdf)
        with self._lock, self._conn() as conn:
            row = conn.execute("SELECT id FROM candidatos WHERE pdf_hash=?", (pdf_hash,)).fetchone()
            if row is not None:
                return self.obtener_candidato(row["id"]), True

            cid = str(uuid.uuid4())
            now = _now()
            conn.execute(
                "INSERT INTO candidatos (id, original_filename, pdf, texto, created_at, pdf_hash) "
                "VALUES (?,?,?,?,?,?)",
                (cid, filename, pdf, texto, now, pdf_hash),
            )
        return self.obtener_candidato(cid), False

    def listar_candidatos(self) -> list[dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT id, original_filename, length(texto) AS chars, created_at "
                "FROM candidatos ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]

    def obtener_candidato(self, cid: str) -> dict[str, Any]:
        with self._conn() as conn:
            row = conn.execute("SELECT * FROM candidatos WHERE id=?", (cid,)).fetchone()
        if row is None:
            raise KeyError(cid)
        return {
            "id": row["id"],
            "original_filename": row["original_filename"],
            "texto": row["texto"],
            "created_at": row["created_at"],
        }

    def borrar_candidato(self, cid: str) -> None:
        with self._lock, self._conn() as conn:
            conn.execute("DELETE FROM jev_consultas WHERE candidato_id=?", (cid,))
            cur = conn.execute("DELETE FROM candidatos WHERE id=?", (cid,))
            if cur.rowcount == 0:
                raise KeyError(cid)

    def crear_oferta(
        self, descripcion: str, *, titulo: str | None = None, oid: str | None = None
    ) -> dict[str, Any]:
        descripcion = validar_descripcion(descripcion)
        oid = (oid or str(uuid.uuid4())).strip()
        texto = armar_texto(titulo=titulo, descripcion=descripcion)
        titulo_db = titulo.strip() if titulo and titulo.strip() else None
        now = _now()
        with self._lock, self._conn() as conn:
            try:
                conn.execute(
                    "INSERT INTO ofertas (id, titulo, descripcion, texto, created_at) VALUES (?,?,?,?,?)",
                    (oid, titulo_db, descripcion, texto, now),
                )
            except sqlite3.IntegrityError as exc:
                raise ValueError(f"Ya existe {oid!r}.") from exc
        return self.obtener_oferta(oid)

    def listar_ofertas(self) -> list[dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT id, titulo, descripcion, texto, created_at FROM ofertas ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]

    def obtener_oferta(self, oid: str) -> dict[str, Any]:
        with self._conn() as conn:
            row = conn.execute("SELECT * FROM ofertas WHERE id=?", (oid,)).fetchone()
        if row is None:
            raise KeyError(oid)
        return dict(row)

    def actualizar_oferta(
        self, oid: str, *, descripcion: str, titulo: str | None = None
    ) -> dict[str, Any]:
        descripcion = validar_descripcion(descripcion)
        texto = armar_texto(titulo=titulo, descripcion=descripcion)
        titulo_db = titulo.strip() if titulo and titulo.strip() else None
        with self._lock, self._conn() as conn:
            cur = conn.execute(
                "UPDATE ofertas SET titulo=?, descripcion=?, texto=? WHERE id=?",
                (titulo_db, descripcion, texto, oid),
            )
            if cur.rowcount == 0:
                raise KeyError(oid)
        return self.obtener_oferta(oid)

    def borrar_oferta(self, oid: str) -> None:
        with self._lock, self._conn() as conn:
            cur = conn.execute("DELETE FROM ofertas WHERE id=?", (oid,))
            if cur.rowcount == 0:
                raise KeyError(oid)

    def ofertas_para_jev(self) -> dict[str, str]:
        return {o["id"]: o["texto"] for o in self.listar_ofertas()}

    def guardar_jev_consulta(
        self,
        *,
        candidato_id: str | None,
        modo: str,
        ofertas_evaluadas: int,
        peticion: dict[str, Any],
        respuesta: dict[str, Any],
    ) -> dict[str, Any]:
        consulta_id = str(uuid.uuid4())
        now = _now()
        with self._lock, self._conn() as conn:
            conn.execute(
                "INSERT INTO jev_consultas "
                "(id, candidato_id, created_at, modo, ofertas_evaluadas, peticion_json, respuesta_json) "
                "VALUES (?,?,?,?,?,?,?)",
                (
                    consulta_id,
                    candidato_id,
                    now,
                    modo,
                    ofertas_evaluadas,
                    json.dumps(peticion, ensure_ascii=False),
                    json.dumps(respuesta, ensure_ascii=False),
                ),
            )
        return {
            "id": consulta_id,
            "candidato_id": candidato_id,
            "created_at": now,
            "modo": modo,
            "ofertas_evaluadas": ofertas_evaluadas,
        }

    def listar_jev_consultas(self, candidato_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT id, candidato_id, created_at, modo, ofertas_evaluadas, peticion_json, respuesta_json "
                "FROM jev_consultas WHERE candidato_id=? ORDER BY created_at DESC LIMIT ?",
                (candidato_id, limit),
            ).fetchall()
        out: list[dict[str, Any]] = []
        for row in rows:
            out.append(
                {
                    "id": row["id"],
                    "candidato_id": row["candidato_id"],
                    "created_at": row["created_at"],
                    "modo": row["modo"],
                    "ofertas_evaluadas": row["ofertas_evaluadas"],
                    "peticion": json.loads(row["peticion_json"]),
                    "respuesta": json.loads(row["respuesta_json"]),
                }
            )
        return out


store = Store()
