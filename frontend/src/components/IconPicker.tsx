import { useRef } from "react";
import { Upload } from "lucide-react";
import { ICON_PRESET_KEYS, ICON_PRESETS } from "../icons/presets";

export interface IconPickerValue {
  preset: string | null;
  file: File | null;
}

interface IconPickerProps {
  value: IconPickerValue;
  onChange: (value: IconPickerValue) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = value.file ? URL.createObjectURL(value.file) : null;

  const selectPreset = (key: string) => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange({ preset: key, file: null });
  };

  const selectFile = (file: File | null) => {
    onChange({ preset: null, file });
  };

  return (
    <div className="field">
      <span>Icône</span>
      <div className="icon-picker-grid">
        {ICON_PRESET_KEYS.map((key) => {
          const Icon = ICON_PRESETS[key];
          const selected = value.preset === key;
          return (
            <button
              key={key}
              type="button"
              className={`icon-picker-option${selected ? " selected" : ""}`}
              onClick={() => selectPreset(key)}
              aria-label={key}
              title={key}
            >
              <Icon size={20} style={{ width: 20, height: 20, flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
      <label className="icon-picker-upload">
        <Upload size={14} />
        {value.file ? value.file.name : "Ou uploader une image (jpeg/png/webp, 2 Mo max)"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />
      </label>
      {previewUrl && <img src={previewUrl} alt="Aperçu" className="icon-circle" style={{ width: 48, height: 48 }} />}
    </div>
  );
}
