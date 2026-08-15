export type ResourceType = "Skill" | "MCP" | "Agent";

const FOLDER_BY_TYPE: Record<ResourceType, string> = {
  Skill: "skills",
  MCP: "mcp",
  Agent: "agents",
};

export function folderForType(type: ResourceType): string {
  return FOLDER_BY_TYPE[type];
}

export function isResourceType(value: string): value is ResourceType {
  return value === "Skill" || value === "MCP" || value === "Agent";
}

const COMBINING_DIACRITICS_START = 0x0300;
const COMBINING_DIACRITICS_END = 0x036f;

function stripDiacritics(input: string): string {
  let result = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < COMBINING_DIACRITICS_START || code > COMBINING_DIACRITICS_END) {
      result += ch;
    }
  }
  return result;
}

export function slugify(name: string): string {
  const slug = stripDiacritics(name.toLowerCase().normalize("NFD"))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "ressource";
}
