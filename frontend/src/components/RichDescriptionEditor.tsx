import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import type { Editor } from "@tiptap/react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editorKey?: string;
};

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const btn = (active: boolean) => (active ? "toolbar-btn toolbar-btn--on" : "toolbar-btn");

  return (
    <div className="toolbar" role="toolbar" aria-label="Formato de descripción">
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </button>
      <span className="toolbar-sep" />
      <button
        type="button"
        className={btn(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        Título
      </button>
      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        Lista
      </button>
      <button
        type="button"
        className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </button>
      <span className="toolbar-sep" />
      <button
        type="button"
        className={btn(editor.isActive("link"))}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("URL del enlace", prev ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        Enlace
      </button>
    </div>
  );
}

export default function RichDescriptionEditor({ value, onChange, placeholder, editorKey }: Props) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: { levels: [2, 3] } }),
        Placeholder.configure({
          placeholder: placeholder ?? "Requisitos, responsabilidades, stack…",
        }),
        Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      ],
      content: value || "<p></p>",
      onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
      editorProps: {
        attributes: {
          class: "rich-editor-body",
        },
      },
    },
    [editorKey],
  );

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="rich-editor">
      <label className="label">Descripción</label>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
