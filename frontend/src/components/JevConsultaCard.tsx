import { useMemo } from "react";
import { JevConsulta } from "../api/client";
import { formatoPorcentaje, parsearResultadoJev } from "../api/jev";

type Props = {
  consulta: JevConsulta;
  titulosPorId: Record<string, string>;
};

export default function JevConsultaCard({ consulta, titulosPorId }: Props) {
  const parsed = useMemo(
    () => parsearResultadoJev(consulta.respuesta, titulosPorId),
    [consulta.respuesta, titulosPorId],
  );

  const principal = parsed.filas[0];

  return (
    <details className="jev-historial-item">
      <summary className="jev-historial-summary">
        <span className="jev-historial-chevron" aria-hidden="true" />
        <div className="jev-historial-summary-text">
          <time className="jev-historial-fecha" dateTime={consulta.created_at}>
            {new Date(consulta.created_at).toLocaleString()}
          </time>
          {principal ? (
            <span className="jev-historial-lead">
              {principal.etiqueta} <strong>{formatoPorcentaje(principal.valor)}</strong>
            </span>
          ) : (
            <span className="meta">Sin resultado interpretable</span>
          )}
        </div>
      </summary>
      <div className="jev-historial-body">
        {parsed.filas.length > 1 && (
          <>
            <p className="label">Ranking</p>
            <ul className="jev-mini-result">
              {parsed.filas.map((f) => (
                <li key={f.ofertaId ?? f.etiqueta}>
                  <span>{f.etiqueta}</span>
                  <strong>{formatoPorcentaje(f.valor)}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="label">Petición enviada</p>
        <pre className="code-block">{JSON.stringify(consulta.peticion, null, 2)}</pre>
        <p className="label">Respuesta TypeSafe</p>
        <pre className="code-block">{JSON.stringify(consulta.respuesta, null, 2)}</pre>
      </div>
    </details>
  );
}
