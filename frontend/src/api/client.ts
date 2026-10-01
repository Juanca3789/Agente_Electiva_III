export type CandidatoResumen = {
  id: string;
  original_filename: string | null;
  chars: number;
  created_at: string;
};

export type Candidato = CandidatoResumen & {
  texto: string;
};

export type Oferta = {
  id: string;
  titulo: string | null;
  descripcion: string;
  texto: string;
  created_at: string;
};

export type EvaluarResponse = {
  candidato_id: string | null;
  ofertas_evaluadas: number;
  modo: "encaje" | "choice";
  jev: Record<string, unknown>;
  consulta_id?: string;
};

export type JevPreview = {
  candidato_id: string;
  ofertas_evaluadas: number;
  modo: "encaje" | "choice";
  peticion: Record<string, unknown>;
};

export type JevConsulta = {
  id: string;
  candidato_id: string | null;
  created_at: string;
  modo: "encaje" | "choice";
  ofertas_evaluadas: number;
  peticion: Record<string, unknown>;
  respuesta: Record<string, unknown>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* cuerpo vacío */
  }
  if (!response.ok) {
    const err = body as { error?: string } | null;
    if (body === null && response.status >= 500) {
      throw new Error(
        "El backend no respondió (HTTP 500 del proxy). Arranca Flask antes que Vite: cd backend && python app.py",
      );
    }
    throw new Error(err?.error ?? `Error HTTP ${response.status}`);
  }
  return body as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  listCandidatos: () => request<{ candidatos: CandidatoResumen[] }>("/api/candidatos"),
  getCandidato: (id: string) => request<{ candidato: Candidato }>(`/api/candidatos/${id}`),
  deleteCandidato: (id: string) =>
    request<{ status: string; id: string }>(`/api/candidatos/${id}`, { method: "DELETE" }),
  uploadCandidato: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ candidato: Candidato; duplicado?: boolean }>("/api/candidatos", {
      method: "POST",
      body: form,
    });
  },

  listOfertas: () => request<{ ofertas: Oferta[] }>("/api/ofertas"),
  getOferta: (id: string) => request<{ oferta: Oferta }>(`/api/ofertas/${id}`),
  createOferta: (payload: { titulo?: string; descripcion: string; id?: string }) =>
    request<{ oferta: Oferta }>("/api/ofertas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateOferta: (id: string, payload: { titulo?: string; descripcion: string }) =>
    request<{ oferta: Oferta }>(`/api/ofertas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteOferta: (id: string) =>
    request<{ status: string; id: string }>(`/api/ofertas/${id}`, { method: "DELETE" }),

  evaluar: (candidatoId: string) =>
    request<EvaluarResponse>("/api/evaluar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidato_id: candidatoId }),
    }),

  jevPreview: (candidatoId: string) =>
    request<JevPreview>(`/api/candidatos/${candidatoId}/jev-preview`),

  jevHistorial: (candidatoId: string) =>
    request<{ consultas: JevConsulta[] }>(`/api/candidatos/${candidatoId}/jev-historial`),
};
