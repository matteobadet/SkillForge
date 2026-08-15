import {
  Bot,
  Terminal,
  Cpu,
  Zap,
  Code2,
  Puzzle,
  Rocket,
  Wrench,
  Database,
  Globe,
  Shield,
  Sparkles,
  Package,
  Boxes,
  FlaskConical,
  Brain,
  Gamepad2,
  Palette,
  Music,
  Wand2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ResourceType } from "../api/resources";

// Keep in sync with backend/SkillForge.Api/IconPresets.cs
export const ICON_PRESETS: Record<string, LucideIcon> = {
  Bot,
  Terminal,
  Cpu,
  Zap,
  Code2,
  Puzzle,
  Rocket,
  Wrench,
  Database,
  Globe,
  Shield,
  Sparkles,
  Package,
  Boxes,
  FlaskConical,
  Brain,
  Gamepad2,
  Palette,
  Music,
  Wand2,
};

export const ICON_PRESET_KEYS = Object.keys(ICON_PRESETS);

const DEFAULT_RESOURCE_ICON: Record<ResourceType, LucideIcon> = {
  Skill: Sparkles,
  MCP: Cpu,
  Agent: Bot,
};

export const DEFAULT_TEAM_ICON = Users;

export function resolveResourceIcon(iconPreset: string | null): LucideIcon | null {
  return iconPreset ? ICON_PRESETS[iconPreset] ?? null : null;
}

export function defaultResourceIcon(type: ResourceType): LucideIcon {
  return DEFAULT_RESOURCE_ICON[type];
}
