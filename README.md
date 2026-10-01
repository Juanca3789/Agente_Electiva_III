# Matching de aspirantes (Jev)

```text
backend/
  app.py          ← solo Flask (rutas)
  cv.py           ← PDF → texto
  seleccionar.py  ← POST a Jev
  db.py           ← SQLite
  ofertas.py      ← armar texto de vacante
  paths.py        ← data/ y secret
  secret
  data/agent.db
```

```bash
# 1) Backend (debe estar arriba antes que Vite)
cd backend
uv sync
python app.py

# 2) Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

Requisito: `pdftotext` (`poppler-utils`).
