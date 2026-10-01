# Contrato HTTP (API)

Base en desarrollo: `http://127.0.0.1:5000`  
En producción: mismo origen que el front; nginx reenvía `/api/` y `/health` al Flask.

Formato de error (4xx/5xx):

```json
{ "error": "mensaje legible" }
```

---

## GET /health

- **Salida:** `{ "status": "ok" }`
- **Estados:** 200

---

## Ofertas

### GET /api/ofertas

- **Salida:** `{ "ofertas": [ Oferta, ... ] }`
- **Estados:** 200

### POST /api/ofertas

- **Body JSON:** `titulo?`, `descripcion` (HTML o texto), `id?` (opcional)
- **Salida:** `{ "oferta": Oferta }`
- **Estados:** 201, 400

### GET /api/ofertas/:id

- **Salida:** `{ "oferta": Oferta }`
- **Estados:** 200, 404

### PATCH /api/ofertas/:id

- **Body JSON:** `titulo?`, `descripcion` (requerida)
- **Salida:** `{ "oferta": Oferta }`
- **Estados:** 200, 400, 404

### DELETE /api/ofertas/:id

- **Salida:** `{ "status": "ok", "id": "..." }`
- **Estados:** 200, 404

**Oferta:**

```json
{
  "id": "uuid",
  "titulo": "string | null",
  "descripcion": "html o texto",
  "texto": "plano enviado a Jev",
  "created_at": "ISO-8601 UTC"
}
```

---

## Candidatos

### GET /api/candidatos

- **Salida:** `{ "candidatos": [ Resumen, ... ] }`

**Resumen:** `id`, `original_filename`, `chars`, `created_at`

### POST /api/candidatos

- **Body:** `multipart/form-data`, campo `file` o `pdf` (PDF)
- **Salida:** `{ "candidato": Candidato, "duplicado": boolean }`
- **Estados:** 201 (nuevo), 200 (duplicado), 400

**Candidato (detalle):** incluye `texto` (CV extraído).

### GET /api/candidatos/:id

- **Estados:** 200, 404

### DELETE /api/candidatos/:id

- **Salida:** `{ "status": "ok", "id": "..." }`
- **Estados:** 200, 404

### GET /api/candidatos/:id/jev-preview

- **Salida:** `{ "candidato_id", "ofertas_evaluadas", "modo": "encaje"|"choice", "peticion": { state, model, questions } }`
- **Estados:** 200, 400 (sin ofertas), 404

### GET /api/candidatos/:id/jev-historial

- **Salida:** `{ "consultas": [ ConsultaJev, ... ] }` orden desc por fecha
- **Estados:** 200, 404

**ConsultaJev:** `id`, `candidato_id`, `created_at`, `modo`, `ofertas_evaluadas`, `peticion`, `respuesta` (JSON TypeSafe)

---

## Evaluación

### POST /api/evaluar

Evalúa contra **todas** las ofertas registradas.

- **Body JSON (típico):** `{ "candidato_id": "uuid" }`
- **Alternativas:** `cv` / `cv_text` en JSON, o PDF en multipart (sin persistir candidato)
- **Salida:**

```json
{
  "candidato_id": "uuid | null",
  "ofertas_evaluadas": 2,
  "modo": "choice",
  "jev": { "... respuesta TypeSafe ..." },
  "consulta_id": "uuid"
}
```

- **Estados:** 200, 400, 404, 502 (fallo TypeSafe)

**Interpretación UI (respuesta TypeSafe):**

- Modo encaje (1 oferta): `answers.encaja.noul` → 0–1
- Modo choice: `answers.oferta.probabilities` → mapa `oferta_id → peso`

---

## Límites

- Máximo **255** ofertas por evaluación (límite Jev Choice).
- Tamaño PDF: ver `MAX_UPLOAD_MB` / `MAX_CONTENT_LENGTH`.
