import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminStoragePage from "../src/pages/AdminStoragePage";
import { getStorageUsage } from "../src/api/admin";

vi.mock("../src/api/admin", () => ({
  getStorageUsage: vi.fn(),
}));

const mockedGetStorageUsage = vi.mocked(getStorageUsage);

describe("AdminStoragePage", () => {
  it("renders the formatted total and the per-bucket breakdown", async () => {
    mockedGetStorageUsage.mockResolvedValue({
      totalBytes: 1_073_741_824,
      computedAt: "2026-08-18T14:32:00Z",
      buckets: [
        { bucket: "resources", label: "Archives de ressources", objectCount: 42, totalBytes: 1_000_000_000 },
        { bucket: "icons", label: "Icônes", objectCount: 0, totalBytes: 0 },
      ],
    });

    render(<AdminStoragePage />);

    expect(await screen.findByText("1.00 Go")).toBeInTheDocument();
    expect(screen.getByText("Archives de ressources")).toBeInTheDocument();
    expect(screen.getByText("42 fichiers")).toBeInTheDocument();
    expect(screen.getByText("Icônes")).toBeInTheDocument();
    expect(screen.getByText("0 fichiers")).toBeInTheDocument();
  });

  it("shows a clear error message when the measurement fails", async () => {
    mockedGetStorageUsage.mockRejectedValue(new Error("service unavailable"));

    render(<AdminStoragePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de mesurer l'espace de stockage pour le moment.");
  });
});
