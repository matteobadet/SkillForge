import { describe, expect, it } from "vitest";
import { folderForType, isResourceType, slugify } from "../src/resourceTypeFolders.js";

describe("folderForType", () => {
  it("maps each resource type to its folder name", () => {
    expect(folderForType("Skill")).toBe("skills");
    expect(folderForType("MCP")).toBe("mcp");
    expect(folderForType("Agent")).toBe("agents");
  });
});

describe("isResourceType", () => {
  it("accepts valid types and rejects others", () => {
    expect(isResourceType("Skill")).toBe(true);
    expect(isResourceType("MCP")).toBe(true);
    expect(isResourceType("Agent")).toBe(true);
    expect(isResourceType("skill")).toBe(false);
    expect(isResourceType("Bogus")).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Mon Skill CLI")).toBe("mon-skill-cli");
  });

  it("strips accents", () => {
    expect(slugify("Générateur é à ç")).toBe("generateur-e-a-c");
  });

  it("strips leading/trailing hyphens from special characters", () => {
    expect(slugify("!!!Hello!!!")).toBe("hello");
  });

  it("falls back to a default when nothing alphanumeric remains", () => {
    expect(slugify("!!!")).toBe("ressource");
  });
});
