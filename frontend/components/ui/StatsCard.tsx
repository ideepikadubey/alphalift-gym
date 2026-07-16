import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  loading?: boolean;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "var(--red-500)",
  iconBg = "rgba(232,25,44,0.1)",
  trend,
  trendLabel,
  loading = false,
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton" style={{ height: 20, width: "60%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 36, width: "40%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 14, width: "70%" }} />
      </div>
    );
  }

  const trendColor =
    trend === undefined || trend === 0
      ? "var(--silver-500)"
      : trend > 0
      ? "var(--green-400)"
      : "#ff4d5a";

  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
      ? TrendingUp
      : TrendingDown;

  return (
    <div className="stat-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--silver-500)",
              marginBottom: "8px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 800,
              color: "var(--silver-100)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            background: iconBg,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {trend !== undefined && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              color: trendColor,
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <TrendIcon size={13} />
            {Math.abs(trend)}%
          </span>
        )}
        {(subtitle || trendLabel) && (
          <span style={{ fontSize: "12px", color: "var(--silver-600)" }}>
            {trendLabel || subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
