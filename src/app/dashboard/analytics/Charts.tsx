// Server-rendered chart primitives. Categorical slot 1 (blue) = pickup /
// magnitude default; slot 2 (orange) = delivery. Hex values are the
// validated pair from the dataviz palette (light/dark both pass CVD +
// contrast gates), so they're inlined via Tailwind arbitrary values rather
// than re-derived.
const BLUE = "bg-[#2a78d6] dark:bg-[#3987e5]";
const ORANGE = "bg-[#eb6834] dark:bg-[#d95926]";

export function SplitBar({
  segments,
}: {
  segments: { label: string; value: number; color: "blue" | "orange" }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                seg.color === "blue" ? BLUE : ORANGE
              }`}
            />
            <span className="text-zinc-600 dark:text-zinc-300">
              {seg.label}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {seg.value}
            </span>
            <span className="text-zinc-400">
              ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              style={{ width: `${pct}%` }}
              className={`h-full ${seg.color === "blue" ? BLUE : ORANGE} ${
                i > 0 ? "ml-[2px]" : ""
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function RankedBarList({
  rows,
}: {
  rows: { label: string; value: number; sublabel?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-400">No bookings in this period.</p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              {row.label}
              {row.sublabel && (
                <span className="ml-1.5 text-xs font-normal text-zinc-400">
                  {row.sublabel}
                </span>
              )}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {row.value}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              style={{ width: `${(row.value / max) * 100}%` }}
              className={`h-3 rounded-full ${BLUE}`}
              title={`${row.label}: ${row.value}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimeOfDayChart({
  bars,
}: {
  bars: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  if (bars.every((b) => b.value === 0)) {
    return (
      <p className="text-sm text-zinc-400">No bookings in this period.</p>
    );
  }

  return (
    <div className="flex h-40 items-end gap-2">
      {bars.map((b) => (
        <div
          key={b.label}
          className="flex flex-1 flex-col items-center gap-1.5"
          title={`${b.label}: ${b.value}`}
        >
          {b.value > 0 && (
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {b.value}
            </span>
          )}
          <div className="flex h-28 w-full items-end">
            <div
              style={{ height: `${(b.value / max) * 100}%` }}
              className={`w-full rounded-t ${BLUE} ${
                b.value === 0 ? "opacity-0" : ""
              }`}
            />
          </div>
          <span className="text-[11px] text-zinc-400">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        View as table
      </summary>
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            {headers.map((h) => (
              <th
                key={h}
                className="py-1.5 pr-4 font-medium text-zinc-500 dark:text-zinc-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 pr-4 text-zinc-700 dark:text-zinc-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
