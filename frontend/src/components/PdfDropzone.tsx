import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type Props = {
  onFiles: (files: File[]) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
};

export default function PdfDropzone({ onFiles, disabled, compact }: Props) {
  const [localError, setLocalError] = useState("");

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      setLocalError("");
      try {
        await onFiles(accepted);
      } catch (e) {
        setLocalError(String(e));
      }
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop: (files) => void onDrop(files),
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled,
    maxSize: 10 * 1024 * 1024,
  });

  const rejectionMsg = fileRejections[0]?.errors[0]?.message;

  return (
    <div className={`dropzone-wrap${compact ? " dropzone-wrap--compact" : ""}`}>
      <div
        {...getRootProps()}
        className={[
          "dropzone",
          isDragActive ? "dropzone--active" : "",
          isDragReject ? "dropzone--reject" : "",
          disabled ? "dropzone--disabled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input {...getInputProps()} />
        <div className="dropzone-icon" aria-hidden>
          PDF
        </div>
        <p className="dropzone-title">
          {isDragActive ? "Suelta los CV aquí" : "Arrastra CVs en PDF o haz clic para elegir"}
        </p>
        <p className="dropzone-hint">Varios archivos · máx. 10 MB c/u · solo PDF</p>
      </div>
      {(localError || rejectionMsg) && <p className="error">{localError || rejectionMsg}</p>}
    </div>
  );
}
