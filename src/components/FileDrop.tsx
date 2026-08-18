import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";
import { formatFileSize } from "../lib/format";

type FileDropProps = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
};

export function FileDrop({ label, file, onChange, accept = ".pdf,.jpg,.jpeg,.png,.webp" }: FileDropProps) {
  const [over, setOver] = useState(false);

  const takeFile = useCallback(
    (next: File | null) => {
      onChange(next);
    },
    [onChange],
  );

  function handleFiles(list: FileList | null) {
    const next = list?.[0] ?? null;
    takeFile(next);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setOver(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    event.target.value = "";
  }

  const stateClass = over ? " is-over" : file ? " is-done" : "";

  return (
    <div className="file-drop-field">
      <p className="file-drop__label">{label}</p>
      <label
        className={`file-drop${stateClass}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setOver(false);
        }}
        onDrop={handleDrop}
      >
        <input type="file" accept={accept} onChange={handleChange} hidden />
        {file ? (
          <span className="file-drop__picked">
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)}</span>
          </span>
        ) : (
          <span className="file-drop__placeholder">
            <strong>Перетащите файл сюда</strong>
            <span>или нажмите для выбора</span>
            <em>Файл не выбран</em>
          </span>
        )}
      </label>
      {file ? (
        <button type="button" className="file-drop__clear" onClick={() => takeFile(null)}>
          Удалить файл
        </button>
      ) : null}
    </div>
  );
}
