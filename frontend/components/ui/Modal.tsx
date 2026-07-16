"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 540,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth }}>
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--silver-100)",
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: "13px", color: "var(--silver-500)", marginTop: "4px" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: "6px", flexShrink: 0 }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
