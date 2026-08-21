# docs/api_contract.md
## GET /health
- Entrada: ninguna
- Salida: {"status": "ok"}
- Estados: 200
## POST /agent/ask
- Entrada: question, student_id, context
- Salida: answer, sources, needs_approval
- Estados: 200, 400, 500