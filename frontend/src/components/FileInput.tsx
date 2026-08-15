import { useRef } from "react";
import { Upload } from "lucide-react";

interface FileInputProps {
  accept: string;
  placeholder: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export default function FileInput({ accept, placeholder, file, onChange }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="icon-picker-upload">
      <Upload size={14} />
      {file ? file.name : placeholder}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
      />
    </label>
  );
}
