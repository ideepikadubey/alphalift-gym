import React from "react";

type BadgeVariant =
  | "active"
  | "expired"
  | "pending"
  | "cancelled"
  | "frozen"
  | "success"
  | "refunded"
  | "partial"
  | "male"
  | "female"
  | "other"
  | "paid"
  | "default";

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  active:    { background: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" },
  success:   { background: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" },
  paid:      { background: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" },
  expired:   { background: "rgba(232,25,44,0.12)",  color: "#ff4d5a", border: "1px solid rgba(232,25,44,0.25)" },
  cancelled: { background: "rgba(136,136,136,0.12)",color: "#888888", border: "1px solid rgba(136,136,136,0.2)" },
  frozen:    { background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" },
  pending:   { background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
  partial:   { background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
  refunded:  { background: "rgba(168,85,247,0.12)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.25)" },
  male:      { background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" },
  female:    { background: "rgba(251,146,194,0.12)",color: "#fb7bb8", border: "1px solid rgba(251,146,194,0.25)" },
  other:     { background: "rgba(136,136,136,0.12)",color: "#888888", border: "1px solid rgba(136,136,136,0.2)" },
  default:   { background: "rgba(136,136,136,0.12)",color: "#888888", border: "1px solid rgba(136,136,136,0.2)" },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  style?: React.CSSProperties;
}

export default function Badge({ children, variant = "default", dot = false, style }: BadgeProps) {
  const styles = variantStyles[variant] || variantStyles.default;
  return (
    <span
      className="badge"
      style={{ ...styles, ...style }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
            display: "inline-block",
          }}
        />
      )}
      {children}
    </span>
  );
}

export function getBadgeVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: "active",
    expired: "expired",
    cancelled: "cancelled",
    frozen: "frozen",
    pending: "pending",
    success: "success",
    refunded: "refunded",
    partial: "partial",
    paid: "paid",
    male: "male",
    female: "female",
    other: "other",
  };
  return map[status?.toLowerCase()] || "default";
}
