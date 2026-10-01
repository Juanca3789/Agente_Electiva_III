import { useCallback, useState } from "react";
import { api } from "../api/client";

export function usePdfUpload(onDone?: () => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setError("");
      setNotice("");
      setUploading(true);
      let nuevos = 0;
      let duplicados = 0;
      try {
        for (const file of files) {
          const res = await api.uploadCandidato(file);
          if (res.duplicado) duplicados += 1;
          else nuevos += 1;
        }
        if (duplicados > 0 && nuevos === 0) {
          setNotice(`${duplicados} PDF ya registrado(s); no se crearon filas nuevas.`);
        } else if (duplicados > 0) {
          setNotice(`${nuevos} nuevo(s), ${duplicados} duplicado(s) ignorado(s).`);
        }
        onDone?.();
      } catch (e) {
        setError(String(e));
        throw e;
      } finally {
        setUploading(false);
      }
    },
    [onDone],
  );

  return { uploading, error, notice, uploadFiles, setError, setNotice };
}
