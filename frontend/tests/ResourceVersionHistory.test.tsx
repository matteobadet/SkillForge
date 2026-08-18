import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResourceVersionHistory from "../src/components/ResourceVersionHistory";
import { listResourceVersions } from "../src/api/resources";

vi.mock("../src/api/resources", () => ({
  listResourceVersions: vi.fn(),
  getVersionDownloadUrl: vi.fn(),
}));

const mockedListResourceVersions = vi.mocked(listResourceVersions);

describe("ResourceVersionHistory", () => {
  it("renders multiple versions with the current one badged", async () => {
    mockedListResourceVersions.mockResolvedValue([
      { versionNumber: 2, note: "Corrige un bug", createdAt: "2026-08-18T10:00:00Z", publisherPseudo: "ami1", isCurrent: true },
      { versionNumber: 1, note: null, createdAt: "2026-08-15T10:00:00Z", publisherPseudo: "ami1", isCurrent: false },
    ]);

    render(<ResourceVersionHistory resourceId="r1" />);

    expect(await screen.findByText("Historique des versions (2)")).toBeInTheDocument();
    expect(screen.getByText(/Version 2/)).toBeInTheDocument();
    expect(screen.getByText(/Version 1/)).toBeInTheDocument();
    expect(screen.getByText("actuelle")).toBeInTheDocument();
    expect(screen.getByText("Corrige un bug")).toBeInTheDocument();
  });

  it("does not show a note for a version that has none", async () => {
    mockedListResourceVersions.mockResolvedValue([
      { versionNumber: 1, note: null, createdAt: "2026-08-15T10:00:00Z", publisherPseudo: "ami1", isCurrent: true },
    ]);

    render(<ResourceVersionHistory resourceId="r2" />);

    expect(await screen.findByText(/Version 1/)).toBeInTheDocument();
    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });

  it("renders nothing while loading or on failure, never breaking the page", async () => {
    mockedListResourceVersions.mockRejectedValue(new Error("network error"));

    const { container } = render(<ResourceVersionHistory resourceId="r3" />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
