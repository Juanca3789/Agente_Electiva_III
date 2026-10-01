# Evolución del producto (proceso mental)

Este documento fija **por qué** el sistema dejó de ser OrientaU/Ollama y qué decisiones de diseño sostienen el MVP actual.

## Línea de tiempo

| Etapa | Enfoque | Qué se intentaba | Por qué se abandonó |
|-------|---------|------------------|---------------------|
| **OrientaU Agent** (commit git inicial) | Flask en `app/`, `POST /agent/ask` | Agente académico mock: pregunta + `student_id` → respuesta con fuentes | Fuera del alcance de la electiva (matching laboral) |
| **OrientaU matching (Ollama)** | `backend/app/` monolito, colas, LLM estructurado | Extraer perfiles CV/oferta, compatibilidad por rúbrica, front `/api/v1/*` | Frágil, costoso de mantener, respuestas poco accionables; desalineado con “elegir oferta” |
| **Jev (TypeSafe System One)** | `backend/` plano + SQLite + React | CV texto + ofertas → **probabilidades reales** o **grado de encaje** | Corte correcto: el modelo elige entre vacantes, no inventa etiquetas LLM |

## Decisiones que no se negocian

1. **Jev elige entre ofertas registradas**  
   Las opciones de un `Choice` son los **textos de vacante** (id → texto), no categorías inventadas (`compatible`, `parcial`, etc.).

2. **Una oferta → Noul, varias → Choice**  
   Con una sola vacante, `Choice` colapsa (~1.0); se usa **Noul** (`encaja`) para un score 0–1. Con 2–255 ofertas, **Choice** devuelve reparto en `probabilities`.

3. **Sin cola de “procesamiento”**  
   La llamada a TypeSafe es **síncrona** desde la API; el front espera y muestra resultado. El historial se **persiste** en SQLite (`jev_consultas`), no hay estado `processing` en candidatos.

4. **Simplicidad operativa**  
   Flask en un archivo de rutas; dominio en módulos planos; HTTP directo a TypeSafe (sin SDK). PDF → texto con `pdftotext` (Poppler).

5. **Ofertas con título + descripción enriquecida**  
   Se guarda HTML para UI/preview futuro; a Jev va **texto plano** (`html_a_texto` + título).

6. **CV duplicado por hash**  
   Mismo PDF (SHA-256) → mismo candidato; evita basura al re-subir.

## Fuera de alcance (explícito)

- Autenticación / multi-tenant.
- Extracción estructurada de skills con LLM local.
- Matching batch masivo sin interacción del reclutador.
- Agente de trámites académicos (OrientaU original).

## Referencias técnicas

- Integración Jev: `backend/seleccionar.py` (`construir_peticion`, `evaluar_cv`).
- Persistencia: `backend/db.py`, `backend/data/agent.db` (gitignored).
- UI: `frontend/` (Vite + React), consume `/api/*` vía nginx en producción.
