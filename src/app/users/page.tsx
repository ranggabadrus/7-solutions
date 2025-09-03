"use client";
import React from "react";
import Link from "next/link";

type ApiUser = {
  id: number;
  firstName: string;
  lastName: string;
  company?: { department?: string };
};

interface Item {
  id: string;
  name: string;
  department: string;
}

export default function Page() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [columns, setColumns] = React.useState<Record<string, Item[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // timers and order tracking
  const timersRef = React.useRef<Map<string, number>>(new Map());
  const orderRef = React.useRef<Record<string, number>>({});

  const sortByInitial = (arr: Item[]) =>
    [...arr].sort(
      (a, b) => (orderRef.current[a.id] ?? 0) - (orderRef.current[b.id] ?? 0)
    );

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  };

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("https://dummyjson.com/users");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: { users: ApiUser[] } = await res.json();
        if (cancelled) return;

        const mapped: Item[] = json.users.map((u) => ({
          id: String(u.id),
          name: `${u.firstName} ${u.lastName}`,
          department: u.company?.department || "Unknown",
        }));
        // compute departments list (sorted)
        const deptSet = new Set<string>();
        mapped.forEach((m) => deptSet.add(m.department));
        const deptList = Array.from(deptSet).sort((a, b) => a.localeCompare(b));

        // initial order map
        const order: Record<string, number> = {};
        mapped.forEach((it, idx) => (order[it.id] = idx));

        // initialize empty columns per department
        const cols: Record<string, Item[]> = {};
        deptList.forEach((d) => (cols[d] = []));

        orderRef.current = order;
        setItems(mapped);
        setDepartments(deptList);
        setColumns(cols);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      clearAllTimers();
    };
  }, []);

  const moveToDepartment = (item: Item, index: number) => {
    // remove from left list
    setItems((prev) => prev.filter((_, i) => i !== index));
    // add to its department column
    setColumns((prev) => ({
      ...prev,
      [item.department]: [...(prev[item.department] || []), item],
    }));

    // auto return after 5s
    const timeoutId = window.setTimeout(() => {
      // remove from column
      setColumns((prev) => ({
        ...prev,
        [item.department]: (prev[item.department] || []).filter(
          (x) => x.id !== item.id
        ),
      }));
      // add back to left keeping original order
      setItems((prev) => {
        if (prev.some((x) => x.id === item.id)) return prev;
        return sortByInitial([...prev, item]);
      });
      timersRef.current.delete(item.id);
    }, 5000);
    timersRef.current.set(item.id, timeoutId);
  };

  const returnNow = (item: Item) => {
    const t = timersRef.current.get(item.id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(item.id);
    }
    // remove from its column
    setColumns((prev) => ({
      ...prev,
      [item.department]: (prev[item.department] || []).filter(
        (x) => x.id !== item.id
      ),
    }));
    // add back to left preserving order
    setItems((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return sortByInitial([...prev, item]);
    });
  };

  // no grid template; we'll use a fixed left column and horizontally scrollable right side

  if (loading) return <div className="p-6">Loading users…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Users by Department
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-1 rounded-md border bg-white hover:bg-gray-50"
          >
            Fruits & Vegetables
          </Link>
          <span className="px-3 py-1 rounded-md bg-gray-800 text-white">
            Users
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Fixed Left Column */}
          <div className="w-80 shrink-0 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
              All Users ({items.length})
            </h2>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => moveToDepartment(item, index)}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">
                      {item.name}
                    </span>
                    <span className="text-center text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                      {item.department}
                    </span>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-gray-500 italic text-center py-4">
                  All users are assigned temporarily.
                </p>
              )}
            </div>
          </div>
          {/* Right Side: Horizontally Scrollable Departments */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 min-w-max pr-2">
              {departments.map((dept) => (
                <div
                  key={dept}
                  className="w-80 shrink-0 bg-white rounded-lg shadow-md p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                    {dept} ({(columns[dept] || []).length})
                  </h2>
                  <div className="space-y-2">
                    {(columns[dept] || []).map((user) => (
                      <div
                        key={user.id}
                        onClick={() => returnNow(user)}
                        className="p-3 bg-green-50 border border-green-200 rounded-md cursor-pointer hover:bg-green-100"
                      >
                        <span className="font-medium text-gray-800">
                          {user.name}
                        </span>
                      </div>
                    ))}
                    {(columns[dept] || []).length === 0 && (
                      <p className="text-gray-400 italic text-center py-8">
                        Click from the left to assign users here
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
