"use client";
import React, { useState } from "react";
import Link from "next/link";
import data from "./data.json";

interface Item {
  id: string;
  type: "Fruit" | "Vegetable";
  name: string;
}

export default function Page() {
  // Build initial list with stable IDs and initial order map
  const initial: Item[] = (data as Array<{ type: string; name: string }>).map(
    (d, i) => ({
      id: `${d.name}-${i}`,
      type: (d.type === "Fruit" ? "Fruit" : "Vegetable") as "Fruit" | "Vegetable",
      name: d.name,
    })
  );
  const initialOrder: Record<string, number> = {};
  initial.forEach((it, idx) => (initialOrder[it.id] = idx));

  const [items, setItems] = useState<Item[]>(initial);
  const [fruits, setFruits] = useState<Item[]>([]);
  const [vegetables, setVegetables] = useState<Item[]>([]);

  // Track timers for auto-return
  const timersRef = React.useRef<Map<string, number>>(new Map());
  // Track original order mapping
  const orderRef = React.useRef<Record<string, number>>(initialOrder);

  const sortByInitial = (arr: Item[]) =>
    [...arr].sort(
      (a, b) => (orderRef.current[a.id] ?? 0) - (orderRef.current[b.id] ?? 0)
    );

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  };

  React.useEffect(() => {
    return () => {
      // cleanup on unmount
      clearAllTimers();
    };
  }, []);

  const moveItem = (item: Item, index: number) => {
    // Remove item from main list
    setItems((prev) => prev.filter((_, i) => i !== index));

    // Add to appropriate column
    if (item.type === "Fruit") {
      setFruits((prev) => [...prev, item]);
    } else {
      setVegetables((prev) => [...prev, item]);
    }

    // After 5 seconds, move back to Items column
    const timeoutId = window.setTimeout(() => {
      if (item.type === "Fruit") {
        setFruits((prev) => prev.filter((x) => x.id !== item.id));
      } else {
        setVegetables((prev) => prev.filter((x) => x.id !== item.id));
      }
      setItems((prev) => {
        // Avoid duplicates and keep original order
        if (prev.some((x) => x.id === item.id)) return prev;
        return sortByInitial([...prev, item]);
      });
      timersRef.current.delete(item.id);
    }, 5000);
    timersRef.current.set(item.id, timeoutId);
  };

  const returnNow = (item: Item) => {
    // Clear any pending timeout for this item
    const t = timersRef.current.get(item.id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(item.id);
    }
    // Remove from right column and add back to left maintaining order
    if (item.type === "Fruit") {
      setFruits((prev) => prev.filter((x) => x.id !== item.id));
    } else {
      setVegetables((prev) => prev.filter((x) => x.id !== item.id));
    }
    setItems((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return sortByInitial([...prev, item]);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Fruit & Vegetable Sorter</h1>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-md bg-gray-800 text-white">Fruits & Vegetables</span>
          <Link href="/users" className="px-3 py-1 rounded-md border bg-white hover:bg-gray-50">
            Users
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Column 1: Items List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
            Items ({items.length})
          </h2>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                onClick={() => moveItem(item, index)}
                className="p-3 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 hover:shadow-sm transition-all duration-200 flex justify-between items-center"
              >
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                  {item.type}
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">
                All items have been sorted!
              </p>
            )}
          </div>
        </div>

        {/* Column 2: Fruits */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-700 border-b pb-2">
            🍎 Fruit ({fruits.length})
          </h2>
          <div className="space-y-2">
            {fruits.map((fruit) => (
              <div
                key={fruit.id}
                onClick={() => returnNow(fruit)}
                className="p-3 bg-orange-50 border border-orange-200 rounded-md cursor-pointer hover:bg-orange-100"
              >
                <span className="font-medium text-gray-800">{fruit.name}</span>
              </div>
            ))}
            {fruits.length === 0 && (
              <p className="text-gray-400 italic text-center py-8">
                Click fruits from the left to add them here
              </p>
            )}
          </div>
        </div>

        {/* Column 3: Vegetables */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700 border-b pb-2">
            🥕 Vegetable ({vegetables.length})
          </h2>
          <div className="space-y-2">
            {vegetables.map((vegetable) => (
              <div
                key={vegetable.id}
                onClick={() => returnNow(vegetable)}
                className="p-3 bg-green-50 border border-green-200 rounded-md cursor-pointer hover:bg-green-100"
              >
                <span className="font-medium text-gray-800">{vegetable.name}</span>
              </div>
            ))}
            {vegetables.length === 0 && (
              <p className="text-gray-400 italic text-center py-8">
                Click vegetables from the left to add them here
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => {
            clearAllTimers();
            const resetInitial: Item[] = (data as Array<{
              type: string;
              name: string;
            }>).map((d, i) => ({
              id: `${d.name}-${i}`,
              type: (d.type === "Fruit" ? "Fruit" : "Vegetable") as "Fruit" | "Vegetable",
              name: d.name,
            }));
            const resetOrder: Record<string, number> = {};
            resetInitial.forEach((it, idx) => (resetOrder[it.id] = idx));
            orderRef.current = resetOrder;
            setItems(resetInitial);
            setFruits([]);
            setVegetables([]);
          }}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
        >
          Reset All Items
        </button>
      </div>
    </div>
  );
}
