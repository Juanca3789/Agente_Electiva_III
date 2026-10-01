from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Literal

from paths import SECRET

JEV_URL = "https://api.typesafe.ai/v1/systemone"
MAX_OFERTAS = 255
ModoJev = Literal["encaje", "choice"]


def _api_key() -> str:
    if SECRET.is_file():
        return SECRET.read_text(encoding="utf-8").strip()
    key = (os.environ.get("TYPESAFE_API_KEY") or "").strip()
    if key:
        return key
    raise ValueError(f"Falta {SECRET} o TYPESAFE_API_KEY.")


def construir_peticion(cv: str, ofertas: dict[str, str]) -> tuple[dict[str, Any], ModoJev]:
    if not cv.strip():
        raise ValueError("CV vacío.")
    if not ofertas:
        raise ValueError("No hay ofertas.")
    if len(ofertas) > MAX_OFERTAS:
        raise ValueError(f"Máximo {MAX_OFERTAS} ofertas.")

    if len(ofertas) == 1:
        state: str | dict[str, Any] = {"cv": cv, "oferta": next(iter(ofertas.values()))}
        questions = {
            "encaja": {
                "type": "noul",
                "instructions": "¿El candidato en `cv` encaja con `oferta`?",
            }
        }
        modo: ModoJev = "encaje"
    else:
        state = cv
        questions = {
            "oferta": {
                "type": "choice",
                "instructions": "Selecciona la oferta que encaja con este CV.",
                "criteria": ofertas,
            }
        }
        modo = "choice"

    peticion = {"state": state, "model": "jev-latest", "questions": questions}
    return peticion, modo


def _system_one(state: str | dict[str, Any], questions: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(
        {"state": state, "model": "jev-latest", "questions": questions},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        JEV_URL,
        data=body,
        method="POST",
        headers={"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"TypeSafe {exc.code}: {exc.read().decode()}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"TypeSafe: {exc.reason}") from exc
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("TypeSafe devolvió JSON inválido.") from exc


def evaluar_cv(cv: str, ofertas: dict[str, str]) -> tuple[dict[str, Any], ModoJev, dict[str, Any]]:
    peticion, modo = construir_peticion(cv, ofertas)
    respuesta = _system_one(peticion["state"], peticion["questions"])
    return respuesta, modo, peticion


def evaluar_ofertas(cv: str, ofertas: dict[str, str]) -> dict[str, Any]:
    respuesta, _, _ = evaluar_cv(cv, ofertas)
    return respuesta


def evaluar_encaje(cv: str, texto_oferta: str) -> dict[str, Any]:
    return evaluar_ofertas(cv, {"_": texto_oferta})
