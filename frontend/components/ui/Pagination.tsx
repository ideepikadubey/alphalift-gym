"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  showing: number;
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  showing,
}: PaginationProps) {
  // Build page numbers to show (always show first, last, and ±1 of current)
  const buildPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = buildPageNumbers();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderTop: "1px solid var(--border)",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      {/* Left: total info + rows per page */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ fontSize: "12px", color: "var(--silver-500)" }}>
          Showing <strong style={{ color: "var(--silver-300)" }}>{showing}</strong> of{" "}
          <strong style={{ color: "var(--silver-300)" }}>{total}</strong> records
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--silver-600)", whiteSpace: "nowrap" }}>
            Rows per page:
          </span>
          <select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--silver-200)",
              fontSize: "12px",
              padding: "4px 8px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {/* Prev */}
        <button
          className="btn-ghost"
          style={{ padding: "5px 8px", fontSize: "12px", opacity: page === 1 ? 0.3 : 1 }}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              style={{ fontSize: "12px", color: "var(--silver-600)", padding: "0 4px" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={{
                minWidth: "30px",
                height: "30px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: p === page ? 700 : 500,
                border: p === page ? "1px solid var(--red-500)" : "1px solid transparent",
                background: p === page ? "rgba(232,25,44,0.12)" : "transparent",
                color: p === page ? "var(--red-400)" : "var(--silver-400)",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          className="btn-ghost"
          style={{ padding: "5px 8px", fontSize: "12px", opacity: page === totalPages ? 0.3 : 1 }}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
