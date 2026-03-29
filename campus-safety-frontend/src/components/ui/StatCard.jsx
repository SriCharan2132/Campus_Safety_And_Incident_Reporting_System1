import React from "react";
import { ShieldCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";

/**
 * StatCard
 * - title: label
 * - value: primary numeric/string
 * - sub: small subtitle
 * - icon: React component (Lucide icon or custom) passed as Icon prop
 * - color: tailwind background color for icon pill (default indigo)
 * - delta: optional short label (e.g. "+12")
 * - deltaPercent: optional numeric percent (e.g. 12 or -4)
 * - onClick: optional click handler, enables button behavior for keyboard
 */
export default function StatCard({
  title,
  value,
  sub,
  icon: Icon = ShieldCheck,
  color = "bg-indigo-500",
  delta,
  deltaPercent,
  onClick,
  className = ""
}) {

  const isClickable = typeof onClick === "function";

  function handleKey(e) {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  }

  const deltaPositive = deltaPercent !== undefined && Number(deltaPercent) > 0;
  const deltaNegative = deltaPercent !== undefined && Number(deltaPercent) < 0;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKey}
      className={`bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${className}`}
      aria-label={title ? `${title} - ${value}` : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-2xl sm:text-3xl font-semibold text-gray-900">{value ?? 0}</div>
          {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>

        <div className={`p-3 rounded-xl text-white flex items-center justify-center ${color}`}>
          {Icon ? <Icon size={18} /> : <ShieldCheck size={18} />}
        </div>
      </div>

      {(delta !== undefined || deltaPercent !== undefined) && (
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
          {delta !== undefined && <div className="text-xs text-gray-500">{delta}</div>}

          {deltaPercent !== undefined && (
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                deltaPositive ? "bg-green-50 text-green-700" :
                deltaNegative ? "bg-red-50 text-red-700" :
                "bg-gray-50 text-gray-700"
              }`}
              aria-hidden
            >
              {deltaPositive && <ArrowUpRight size={12} />}
              {deltaNegative && <ArrowDownRight size={12} />}
              <span>{Math.abs(Number(deltaPercent))}%</span>
            </div>
          )}

          {/* visual spacer / accessibility hint */}
          <div className="ml-auto text-xs text-gray-400">last 7d</div>
        </div>
      )}
    </div>
  );
}