from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parent

for env_path in (REPO_ROOT / ".env", ROOT / ".env"):
    if env_path.is_file():
        load_dotenv(env_path)


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return default
    return int(raw)


FLASK_HOST = os.environ.get("FLASK_HOST", "127.0.0.1")
FLASK_PORT = _env_int("FLASK_PORT", 5000)
FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "0").strip().lower() in ("1", "true", "yes")

_data = os.environ.get("BACKEND_DATA_DIR", "").strip()
DATA = Path(_data) if _data else ROOT / "data"

_max_mb = _env_int("MAX_UPLOAD_MB", 10)
MAX_CONTENT_LENGTH = _max_mb * 1024 * 1024
