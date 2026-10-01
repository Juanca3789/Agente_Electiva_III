import { useCallback, useState } from "react";
import { api, EvaluarResponse } from "../api/client";

export function useEvaluarCandidato(onSuccess?: () => void) {
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<EvaluarResponse | null>(null);
  const [error, setError] = useState("");

  const evaluar = useCallback(
    async (candidatoId: string) => {
      setError("");
      setEvaluatingId(candidatoId);
      try {
        const res = await api.evaluar(candidatoId);
        setLastResult(res);
        onSuccess?.();
        return res;
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setEvaluatingId(null);
      }
    },
    [onSuccess],
  );

  return { evaluar, evaluatingId, lastResult, error, setError, setLastResult };
}
