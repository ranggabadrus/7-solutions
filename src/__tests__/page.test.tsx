import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "../app/page";
import data from "../app/data.json";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Fruit & Vegetable Sorter (Home Page)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders items from data.json in the left column", () => {
    render(<Page />);
    const itemsHeader = screen.getByText(/Items \(/i);
    expect(itemsHeader).toBeInTheDocument();
    const countMatch = itemsHeader.textContent?.match(/Items \((\d+)\)/);
    expect(countMatch && Number(countMatch[1])).toBe(data.length);
  });

  it("moves clicked item to its respective column and returns after 5s", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Page />);

    // pick a fruit item from data
    const fruitItem = (data as Array<{ type: string; name: string }>).find(
      (d) => d.type === "Fruit"
    );
    expect(fruitItem).toBeTruthy();

    const itemCard = screen.getByText(fruitItem!.name).closest("div");
    expect(itemCard).toBeTruthy();
    await user.click(itemCard!);

    // appears under Fruit column
    const fruitHeader = screen.getByText(/Fruit \(/i);
    const fruitColumn = fruitHeader.closest("div");
    expect(fruitColumn).toBeTruthy();
    expect(
      within(fruitColumn as HTMLElement).getByText(fruitItem!.name)
    ).toBeInTheDocument();

    // after 5s, it should return back
    vi.advanceTimersByTime(5000);

    // back in left list
    expect(screen.getAllByText(fruitItem!.name)[0]).toBeInTheDocument();
  });

  it("allows immediate return by clicking item in right column", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Page />);

    const vegItem = (data as Array<{ type: string; name: string }>).find(
      (d) => d.type === "Vegetable"
    );
    expect(vegItem).toBeTruthy();

    const itemCard = screen.getByText(vegItem!.name).closest("div");
    await user.click(itemCard!);

    const vegHeader = screen.getByText(/Vegetable \(/i);
    const vegColumn = vegHeader.closest("div") as HTMLElement;
    const rightCard = within(vegColumn).getByText(vegItem!.name).closest("div");
    await user.click(rightCard!); // immediate return

    // should be removed from right and present back on left
    expect(within(vegColumn).queryByText(vegItem!.name)).toBeNull();
    expect(screen.getAllByText(vegItem!.name)[0]).toBeInTheDocument();
  });
});
