import re
from html import unescape


def html_a_texto(raw: str) -> str:
    raw = raw.strip()
    if not raw:
        return ""
    if "<" not in raw:
        return raw
    text = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def validar_descripcion(descripcion: str) -> str:
    descripcion = descripcion.strip()
    if not html_a_texto(descripcion):
        raise ValueError("Descripción vacía.")
    return descripcion


def armar_texto(*, titulo: str | None, descripcion: str) -> str:
    descripcion_plano = html_a_texto(descripcion)
    if not descripcion_plano:
        raise ValueError("Descripción vacía.")
    if titulo and titulo.strip():
        return f"{titulo.strip()}\n\n{descripcion_plano}"
    return descripcion_plano
