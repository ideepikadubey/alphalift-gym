import React from "react";

interface LoadingSpinnerProps {
  size?: number | "small" | "medium" | "large";
  color?: string;
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({
  size = 24,
  color = "var(--red-500)",
  text,
  fullPage = false,
}: LoadingSpinnerProps) {
  let numericSize = 24;
  if (typeof size === "number") {
    numericSize = size;
  } else if (size === "small") {
    numericSize = 16;
  } else if (size === "medium") {
    numericSize = 24;
  } else if (size === "large") {
    numericSize = 36;
  }

  const spinner = (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <svg
        width={numericSize}
        height={numericSize}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {text && <span style={{ fontSize: "13px", color: "var(--silver-500)" }}>{text}</span>}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "400px",
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
