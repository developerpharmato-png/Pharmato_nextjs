"use client";
import React, { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: string | number;
  readOnly?: boolean;
}

export default function QuillEditor({
  value,
  onChange,
  minHeight = "320px",
  readOnly = false,
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const Quill = (await import("quill")).default;

        if (!mounted) return;

        // Register Fonts with Quill
        const Font: any = Quill.import("formats/font");
        Font.whitelist = [
          "poppins", "arial", "arialblack", "comicsans",
          "courier", "georgia", "impact", "lucida",
          "palatino", "tahoma", "timesnewroman",
          "trebuchet", "verdana",
        ];
        Quill.register(Font, true);

        // Custom List handler for Roman Numerals and forced inline styles for standard lists
        const List: any = Quill.import("formats/list");
        class CustomList extends List {
          static create(value: any) {
            if (value === "roman") {
              const node = super.create("ordered");
              node.setAttribute("style", "list-style-type: upper-roman;");
              node.setAttribute("data-list", "roman");
              return node;
            }
            if (value === "lower-roman") {
              const node = super.create("ordered");
              node.setAttribute("style", "list-style-type: lower-roman;");
              node.setAttribute("data-list", "lower-roman");
              return node;
            }
            if (value === "ordered") {
              const node = super.create("ordered");
              node.setAttribute("style", "list-style-type: decimal; margin-left: 1.5em;");
              return node;
            }
            if (value === "bullet") {
              const node = super.create("bullet");
              node.setAttribute("style", "list-style-type: disc; margin-left: 1.5em;");
              return node;
            }
            return super.create(value);
          }
          static formats(node: HTMLElement) {
            if (
              node.getAttribute("data-list") === "roman" ||
              node.style.listStyleType === "upper-roman"
            )
              return "roman";
            if (
              node.getAttribute("data-list") === "lower-roman" ||
              node.style.listStyleType === "lower-roman"
            )
              return "lower-roman";
            return super.formats(node);
          }
        }
        Quill.register(CustomList as any, true);

        // Register Icons for Roman Numerals
        const Icons: any = Quill.import("ui/icons");
        if (Icons.list) {
          Icons.list["roman"] =
            '<svg viewBox="0 0 18 18"><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-weight="bold" font-size="12">I</text></svg>';
          Icons.list["lower-roman"] =
            '<svg viewBox="0 0 18 18"><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-weight="bold" font-size="12">i</text></svg>';
        }

        if (editorRef.current && !quillRef.current) {
          // Clean up any existing toolbars in the parent before initializing
          const parent = editorRef.current.parentElement;
          if (parent) {
            const existingToolbars = parent.querySelectorAll('.ql-toolbar');
            existingToolbars.forEach(tb => tb.remove());
          }

          quillRef.current = new Quill(editorRef.current, {
            theme: "snow",
            readOnly: readOnly,
            modules: {
              toolbar: [
                [{ font: Font.whitelist }],
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ list: "roman" }, { list: "lower-roman" }],
                ["link", "image"],
                ["clean"],
              ],
            },
          });

          quillRef.current.on("text-change", () => {
            const html = quillRef.current.root.innerHTML;
            onChange(html);
          });

          // set initial content
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
              quillRef.current.root.innerHTML = value || "";
            }
          } catch (e) {
            try {
              quillRef.current.root.innerHTML = value || "";
            } catch (err) {}
          }

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
          const parent = editorRef.current?.parentElement;
          if (parent) {
            const toolbars = parent.querySelectorAll('.ql-toolbar');
            toolbars.forEach(tb => tb.remove());
          }
          quillRef.current.off("text-change");
          quillRef.current = null;
        }
      } catch (e) {}
    };
  }, [readOnly]);

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
      <style>{`
        /* This hides the native browser numbers/bullets INSIDE the editor so they don't double up with Quill's CSS counters */
        .ql-editor li {
          list-style-type: none !important;
          margin-left: 0 !important;
        }
      `}</style>
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

