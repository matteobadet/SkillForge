namespace SkillForge.Api;

/// <summary>Known icon preset identifiers (lucide-react component names) — must stay in sync with frontend/src/icons/presets.ts.</summary>
public static class IconPresets
{
    public static readonly HashSet<string> Known = new()
    {
        "Bot", "Terminal", "Cpu", "Zap", "Code2", "Puzzle", "Rocket", "Wrench",
        "Database", "Globe", "Shield", "Sparkles", "Package", "Boxes",
        "FlaskConical", "Brain", "Gamepad2", "Palette", "Music", "Wand2",
    };
}
