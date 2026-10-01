import subprocess
import tempfile
from pathlib import Path


def texto_desde_pdf(ruta: Path) -> str:
    if not ruta.is_file():
        raise FileNotFoundError(f"No existe el PDF: {ruta}")
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        salida = Path(tmp.name)
    try:
        try:
            ok = subprocess.run(
                ["pdftotext", "-layout", str(ruta), str(salida)],
                capture_output=True,
                check=False,
            )
        except FileNotFoundError as exc:
            raise RuntimeError("Instala poppler-utils (pdftotext).") from exc
        if ok.returncode != 0:
            raise RuntimeError("pdftotext no pudo leer el PDF.")
        texto = salida.read_text(encoding="utf-8", errors="replace").strip()
        if not texto:
            raise ValueError("PDF sin texto extraíble.")
        return texto
    finally:
        salida.unlink(missing_ok=True)
