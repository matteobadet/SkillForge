import type { LucideIcon } from "lucide-react";
import { ICON_PRESETS } from "../icons/presets";

interface EntityIconProps {
  iconUrl: string | null;
  iconPreset: string | null;
  fallback: LucideIcon;
  size?: "sm" | "md" | "lg";
}

const DIMENSIONS: Record<NonNullable<EntityIconProps["size"]>, number> = {
  sm: 32,
  md: 48,
  lg: 64,
};

const ICON_RATIO = 0.5;

export default function EntityIcon({ iconUrl, iconPreset, fallback: Fallback, size = "md" }: EntityIconProps) {
  const dimension = DIMENSIONS[size];
  const style = { width: dimension, height: dimension };

  if (iconUrl) {
    return <img src={iconUrl} alt="" className="icon-circle" style={style} />;
  }

  const PresetIcon = (iconPreset && ICON_PRESETS[iconPreset]) || Fallback;
  return (
    <div className="icon-circle" style={style}>
      <PresetIcon size={dimension * ICON_RATIO} />
    </div>
  );
}
