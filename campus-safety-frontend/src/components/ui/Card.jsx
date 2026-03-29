import React, { forwardRef } from "react";

/**
 * Card
 * - title: optional string header
 * - headerRight: optional node (actions, filters, links)
 * - loading: boolean -> shows a simple skeleton instead of children
 * - as: element type (div/section/article)
 * - padding / shadow / rounded: tailwind class strings to customize
 */
const Card = forwardRef(({
  children,
  className = "",
  title,
  headerRight = null,
  loading = false,
  as: Component = "div",
  padding = "p-4",
  shadow = "shadow-md",
  rounded = "rounded-2xl",
  full = true,
  ...props
}, ref) => {

  const base = `bg-white ${rounded} ${shadow} ${padding} ${full ? "w-full" : ""}`;

  return (
    <Component
      ref={ref}
      className={`${base} ${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300`}
      role={title ? "region" : undefined}
      aria-label={title ?? undefined}
      {...props}
    >
      {title && (
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
          {headerRight && <div className="ml-3">{headerRight}</div>}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      ) : (
        children
      )}
    </Component>
  );
});

export default Card;