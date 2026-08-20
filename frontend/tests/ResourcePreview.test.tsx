import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResourcePreview from "../src/components/ResourcePreview";
import { getResourcePreview } from "../src/api/resources";

vi.mock("../src/api/resources", () => ({
  getResourcePreview: vi.fn(),
}));

const mockedGetResourcePreview = vi.mocked(getResourcePreview);

describe("ResourcePreview", () => {
  it("renders the Markdown content when available", async () => {
    mockedGetResourcePreview.mockResolvedValue({
      available: true,
      fileName: "SKILL.md",
      content: "# Mon Skill\n\nUne description.",
      truncated: false,
    });

    render(<ResourcePreview resourceId="r1" />);

    expect(await screen.findByRole("heading", { name: "Mon Skill" })).toBeInTheDocument();
    expect(screen.getByText("Une description.")).toBeInTheDocument();
    expect(screen.queryByText(/tronqué/i)).not.toBeInTheDocument();
  });

  it("shows a truncation notice when the content was cut", async () => {
    mockedGetResourcePreview.mockResolvedValue({
      available: true,
      fileName: "README.md",
      content: "Contenu partiel",
      truncated: true,
    });

    render(<ResourcePreview resourceId="r2" />);

    expect(await screen.findByText(/aperçu tronqué/i)).toBeInTheDocument();
  });

  it("shows a clear message when no preview is available", async () => {
    mockedGetResourcePreview.mockResolvedValue({
      available: false,
      fileName: null,
      content: null,
      truncated: false,
    });

    render(<ResourcePreview resourceId="r3" />);

    expect(await screen.findByText("Aucun aperçu disponible pour cette ressource.")).toBeInTheDocument();
  });

  it("treats a request failure the same as unavailable", async () => {
    mockedGetResourcePreview.mockRejectedValue(new Error("network error"));

    render(<ResourcePreview resourceId="r4" />);

    await waitFor(() => {
      expect(screen.getByText("Aucun aperçu disponible pour cette ressource.")).toBeInTheDocument();
    });
  });

  it("collapses content that overflows the visible height, and expands it on click", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "scrollHeight");
    Object.defineProperty(Element.prototype, "scrollHeight", { configurable: true, value: 1000 });

    try {
      mockedGetResourcePreview.mockResolvedValue({
        available: true,
        fileName: "SKILL.md",
        content: "# Long content\n\nParagraph.",
        truncated: false,
      });

      render(<ResourcePreview resourceId="r5" />);

      const toggle = await screen.findByRole("button", { name: /voir la suite/i });
      expect(toggle).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(await screen.findByRole("button", { name: /réduire/i })).toBeInTheDocument();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Element.prototype, "scrollHeight", originalDescriptor);
      } else {
        delete (Element.prototype as Partial<typeof Element.prototype>).scrollHeight;
      }
    }
  });

  it("shows no toggle when content fits within the collapsed height", async () => {
    mockedGetResourcePreview.mockResolvedValue({
      available: true,
      fileName: "SKILL.md",
      content: "# Short\n\nJust a bit of text.",
      truncated: false,
    });

    render(<ResourcePreview resourceId="r6" />);

    await screen.findByRole("heading", { name: "Short" });
    expect(screen.queryByRole("button", { name: /voir la suite/i })).not.toBeInTheDocument();
  });
});
