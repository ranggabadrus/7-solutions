import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "../app/users/page";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Users by Department Page", () => {
  const mockUsers = {
    users: [
      {
        id: 1,
        firstName: "Alice",
        lastName: "Anderson",
        company: { department: "Engineering" },
      },
      {
        id: 2,
        firstName: "Bob",
        lastName: "Brown",
        company: { department: "Marketing" },
      },
      {
        id: 3,
        firstName: "Cara",
        lastName: "Clark",
        company: { department: "Engineering" },
      },
    ],
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUsers,
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    // @ts-expect-error cleanup
    delete global.fetch;
  });

  it("loads and lists users in the left column", async () => {
    render(<Page />);
    // Loading first
    expect(screen.getByText(/Loading users/i)).toBeInTheDocument();

    // Wait for users to appear
    await waitFor(() =>
      expect(screen.getByText("Alice Anderson")).toBeInTheDocument()
    );
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("Cara Clark")).toBeInTheDocument();
  });

  it("moves clicked user to their department and returns after 5s", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Page />);

    await waitFor(() =>
      expect(screen.getByText("Alice Anderson")).toBeInTheDocument()
    );

    // Move Alice (Engineering)
    const aliceRow = screen.getByText("Alice Anderson").closest("div");
    await user.click(aliceRow!);

    const engHeader = screen.getByText(/Engineering \(/i);
    const engCol = engHeader.closest("div") as HTMLElement;
    expect(within(engCol).getByText("Alice Anderson")).toBeInTheDocument();

    // after 5s she returns
    vi.advanceTimersByTime(5000);
    expect(screen.getAllByText("Alice Anderson")[0]).toBeInTheDocument();
  });

  it("allows immediate return by clicking user in department column", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Page />);

    await waitFor(() =>
      expect(screen.getByText("Bob Brown")).toBeInTheDocument()
    );

    // Move Bob (Marketing)
    const bobRow = screen.getByText("Bob Brown").closest("div");
    await user.click(bobRow!);

    const mktHeader = screen.getByText(/Marketing \(/i);
    const mktCol = mktHeader.closest("div") as HTMLElement;
    const bobRight = within(mktCol).getByText("Bob Brown").closest("div");
    await user.click(bobRight!);

    // Should be gone from right immediately and present on left
    expect(within(mktCol).queryByText("Bob Brown")).toBeNull();
    expect(screen.getAllByText("Bob Brown")[0]).toBeInTheDocument();
  });
});
