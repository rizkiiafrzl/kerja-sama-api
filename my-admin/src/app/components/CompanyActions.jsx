"use client";

import React, { useState, useRef, useEffect } from "react";
import Portal from "./Portal";

export default function CompanyActions({ company, onEdit, onDelete, onDetail }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Close menu when clicking outside trigger or menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        !triggerRef.current ||
        !menuRef.current ||
        triggerRef.current.contains(event.target) ||
        menuRef.current.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function toggleMenu() {
    if (!triggerRef.current) {
      setOpen((prev) => !prev);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 192; // approx w-48

    setPosition({
      top: rect.bottom + 4,
      left: rect.right - menuWidth,
    });
    setOpen((prev) => !prev);
  }

  function handleEdit() {
    setOpen(false);
    if (onEdit) onEdit(company);
  }

  function handleDelete() {
    setOpen(false);
    if (onDelete) onDelete(company);
  }

  function handleDetail() {
    setOpen(false);
    if (onDetail) onDetail(company);
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        aria-label="Actions"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <Portal>
          <div
            ref={menuRef}
            className="fixed z-[9999] w-48 rounded-lg bg-white shadow-lg border border-slate-200 py-1"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <button
              onClick={handleDetail}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Detail
            </button>
            <button
              onClick={handleEdit}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </Portal>
      )}
    </>
  );
}
