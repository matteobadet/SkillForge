import { ICON_PRESET_KEYS, ICON_PRESETS } from "../icons/presets";
import FileInput from "./FileInput";

export interface IconPickerValue {
  preset: string | null;
  file: File | null;
}

interface IconPickerProps {
  value: IconPickerValue;
  onChange: (value: IconPickerValue) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const previewUrl = value.file ? URL.createObjectURL(value.file) : null;

  const selectPreset = (key: string) => {
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
      <FileInput
        key={value.file ? "has-file" : "no-file"}
        accept="image/jpeg,image/png,image/webp"
        placeholder="Ou uploader une image (jpeg/png/webp, 2 Mo max)"
        file={value.file}
        onChange={selectFile}
      />
      {previewUrl && <img src={previewUrl} alt="Aperçu" className="icon-circle" style={{ width: 48, height: 48 }} />}
    </div>
  );
}
