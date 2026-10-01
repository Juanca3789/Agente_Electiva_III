# Electiva III — Matching de aspirantes (Jev)

Sistema para registrar **CVs en PDF** y **ofertas laborales**, y evaluar encaje con **[TypeSafe System One (Jev)](https://typesafe.ai/)**.  
Reemplaza el enfoque anterior (OrientaU + Ollama + colas) por una API pequeña y respuestas accionables (probabilidades / score).

## Documentación (RF y diseño)

| Documento | Contenido |
|-----------|-----------|
| [docs/evolucion.md](docs/evolucion.md) | Proceso mental: OrientaU → Ollama → Jev; decisiones de arquitectura |
| [docs/requisitos_funcionales.md](docs/requisitos_funcionales.md) | RF/RNF y trazabilidad pantallas ↔ API |
| [docs/api_contract.md](docs/api_contract.md) | Contrato HTTP endpoint por endpoint |

## Estructura del repo

```text
backend/           Flask + SQLite (dominio en módulos planos)
  app.py           Rutas HTTP
  cv.py            PDF → texto (pdftotext)
  seleccionar.py   Petición y llamada a Jev
  db.py            Persistencia + historial consultas
  ofertas.py       HTML → texto plano para Jev
  paths.py         data/, secret
  secret           API key TypeSafe (gitignored)
  data/agent.db    SQLite (gitignored)

frontend/          React + Vite
  dist/            Build estático para nginx (gitignored)

deploy/            Ejemplos nginx + systemd para AWS/EC2
.env.example       Variables de despliegue (copiar a .env)
```

## Desarrollo local

Requisito: **Poppler** (`pdftotext`).

```bash
cd backend
uv sync
# backend/secret con la API key, o export TYPESAFE_API_KEY=...
python app.py

cd frontend
npm install
npm run dev    # proxy /api → :5000
```

## Producción (nginx)

1. `cd frontend && npm ci && npm run build`
2. Configurar `.env` desde `.env.example` (`FRONTEND_ROOT`, `FLASK_*`, rutas en servidor).
3. Usar `deploy/nginx.conf.example` y unit systemd (`deploy/electiva.service.example` o equivalente).
4. Flask solo en loopback; el navegador habla con nginx (estáticos + `/api`).

## Evolución en git

Los commits antiguos guardan el prototipo **OrientaU Agent** (`POST /agent/ask`). El matching con Ollama **no quedó versionado** (`.gitignore` de `backend/` en su momento). El estado actual en `main` es el stack **Jev** descrito en [docs/evolucion.md](docs/evolucion.md).
