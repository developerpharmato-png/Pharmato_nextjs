"use client";
import React, { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css"; // ✅ FIX

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: string | number;
}

export default function QuillEditor({
  value,
  onChange,
  minHeight = "320px",
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const Quill = (await import("quill")).default;

        if (!mounted) return;
        if (editorRef.current && !quillRef.current) {
          quillRef.current = new Quill(editorRef.current, {
            theme: "snow",
            modules: {
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"],
              ],
            },
          });

          quillRef.current.on("text-change", () => {
            const html = quillRef.current.root.innerHTML;
            onChange(html);
          });

          // set initial content (guard clipboard availability)
          try {
            const clipboardModule = quillRef.current.getModule
              ? quillRef.current.getModule("clipboard")
              : quillRef.current.clipboard;
            if (
              clipboardModule &&
              typeof clipboardModule.dangerouslyPasteHTML === "function"
            ) {
              clipboardModule.dangerouslyPasteHTML(value || "");
            } else if (quillRef.current && quillRef.current.root) {
              // fallback: set root innerHTML
              quillRef.current.root.innerHTML = value || "";
            }
          } catch (e) {
            try {
              quillRef.current.root.innerHTML = value || "";
            } catch (err) {}
          }
          // apply minHeight to editor surface
          try {
            quillRef.current.root.style.minHeight =
              typeof minHeight === "number"
                ? `${minHeight}px`
                : String(minHeight);
          } catch (e) {}
        }
      } catch (e) {
        console.error("Failed to load Quill", e);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (quillRef.current) {
          quillRef.current.off("text-change");
          quillRef.current = null;
        }
      } catch (e) {}
    };
  }, []);

  // keep updating editor when value prop changes externally
  useEffect(() => {
    let cancelled = false;

    const applyContent = () => {
      if (cancelled) return;
      if (quillRef.current && quillRef.current.root) {
        try {
          const currentHTML = quillRef.current.root.innerHTML || "";
          if (value === currentHTML) return;

          const clipboardModule = quillRef.current.getModule
            ? quillRef.current.getModule("clipboard")
            : quillRef.current.clipboard;
          if (
            clipboardModule &&
            typeof clipboardModule.dangerouslyPasteHTML === "function"
          ) {
            clipboardModule.dangerouslyPasteHTML(value || "");
          } else {
            quillRef.current.root.innerHTML = value || "";
          }

          // try to preserve selection
          const sel =
            quillRef.current.getSelection && quillRef.current.getSelection();
          if (
            sel &&
            quillRef.current &&
            typeof quillRef.current.setSelection === "function"
          ) {
            try {
              quillRef.current.setSelection(sel.index, sel.length);
            } catch (e) {}
          }
        } catch (e) {
          try {
            quillRef.current.root.innerHTML = value || "";
          } catch (err) {}
        }
      } else {
        // Quill not ready yet - retry shortly
        setTimeout(applyContent, 50);
      }
    };

    applyContent();

    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div>
      <div
        ref={editorRef}
        style={{
          minHeight:
            typeof minHeight === "number" ? `${minHeight}px` : minHeight,
        }}
      />
    </div>
  );
}
