# Requisitos funcionales (RF)

Actores: **Reclutador** (usuario de la UI). Sistema externo: **TypeSafe Jev**.

## RF-01 Gestión de ofertas

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| RF-01.1 | Registrar oferta | Título opcional + descripción (HTML); se persiste y se genera texto plano para Jev. |
| RF-01.2 | Listar y ver oferta | Listado en UI; detalle con preview HTML y texto plano para Jev. |
| RF-01.3 | Editar oferta | PATCH actualiza descripción/título y recalcula texto Jev. |
| RF-01.4 | Eliminar oferta | DELETE desde lista o detalle; deja de participar en evaluaciones. |

## RF-02 Gestión de candidatos (CV)

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| RF-02.1 | Subir PDF | Multipart `file`; extracción con `pdftotext`; guarda blob + texto. |
| RF-02.2 | Dedup por contenido | Mismo PDF → mismo registro; respuesta `duplicado: true`, HTTP 200. |
| RF-02.3 | Listar candidatos | Resumen: nombre archivo, tamaño texto, fecha. |
| RF-02.4 | Ver detalle | Texto CV, preview de petición Jev con ofertas actuales, historial. |
| RF-02.5 | Eliminar candidato | Borra CV e historial Jev asociado. |

## RF-03 Evaluación con Jev

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| RF-03.1 | Evaluar candidato | Con ≥1 oferta; usa candidato registrado (`candidato_id`). |
| RF-03.2 | Modo automático | 1 oferta → Noul; 2–255 → Choice con `criteria` = mapa id→texto. |
| RF-03.3 | Respuesta inmediata | Una request HTTP devuelve JSON TypeSafe; sin cola async en backend. |
| RF-03.4 | Historial | Cada evaluación guarda petición + respuesta en `jev_consultas`. |
| RF-03.5 | Punto de evaluación | Botón en lista y en detalle de candidato; requiere ofertas existentes. |

## RF-04 Interfaz

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| RF-04.1 | Dashboard | KPIs candidatos/ofertas; subida CV; accesos rápidos. |
| RF-04.2 | Listas clicables | Fila completa navega a detalle; acciones (Evaluar/Eliminar) no propagan click. |
| RF-04.3 | Historial legible | Entradas colapsables: fecha + oferta principal + %; detalle con JSON. |
| RF-04.4 | Editor ofertas | TipTap para descripción; título separado. |

## Requisitos no funcionales (RNF)

| ID | Requisito |
|----|-----------|
| RNF-01 | API key TypeSafe en `backend/secret` o env `TYPESAFE_API_KEY` (no commitear). |
| RNF-02 | PDF máximo configurable (`MAX_UPLOAD_MB`, alineado con nginx). |
| RNF-03 | Producción: Flask solo loopback; nginx sirve `frontend/dist` y proxy `/api`, `/health`. |
| RNF-04 | Errores API: cuerpo `{"error": "mensaje"}`; 400 validación, 404 no existe, 502 TypeSafe. |

## Trazabilidad UI ↔ API

| Pantalla | Endpoints principales |
|----------|----------------------|
| Dashboard | `GET /health`, listados candidatos/ofertas, `POST /api/candidatos` |
| Candidatos | list, upload, `POST /api/evaluar` |
| Detalle CV | `GET .../jev-preview`, `GET .../jev-historial`, DELETE candidato |
| Ofertas | CRUD `/api/ofertas` |
