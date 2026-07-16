"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <button
        onClick={onClose}
        className="btn-secondary"
        disabled={loading}
        style={{ padding: "8px 16px", fontSize: "13px" }}
      >
        {cancelText}
      </button>
      <button
        onClick={handleConfirm}
        className="btn-primary"
        style={{ background: "var(--red-500)", border: "none", padding: "8px 16px", fontSize: "13px" }}
        disabled={loading}
      >
        {loading ? "Deleting..." : confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      maxWidth={440}
    >
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(232, 25, 44, 0.1)",
            color: "var(--red-500)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={20} />
        </div>
        <div style={{ fontSize: "14px", color: "var(--silver-200)", lineHeight: "1.5" }}>
          {message}
        </div>
      </div>
    </Modal>
  );
}
