import React, { useEffect, useRef } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/selection/active-line";

// Language Modes
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import "codemirror/mode/ruby/ruby";
import "codemirror/mode/go/go";
import "codemirror/mode/shell/shell";
import "codemirror/mode/sql/sql";
import "codemirror/mode/pascal/pascal";
import "codemirror/mode/php/php";
import "codemirror/mode/swift/swift";
import "codemirror/mode/rust/rust";
import "codemirror/mode/r/r";

import { ACTIONS } from "../config/Actions";

const getMode = (lang) => {
  switch (lang) {
    case "python3": return "python";
    case "java": return "text/x-java";
    case "cpp": return "text/x-c++src";
    case "c": return "text/x-csrc";
    case "csharp": return "text/x-csharp";
    case "scala": return "text/x-scala";
    case "nodejs": return "javascript";
    case "ruby": return "ruby";
    case "go": return "go";
    case "bash": return "shell";
    case "sql": return "sql";
    case "pascal": return "pascal";
    case "php": return "php";
    case "swift": return "swift";
    case "rust": return "rust";
    case "r": return "r";
    default: return "javascript";
  }
};


function Editor({ socketRef, roomId, onCodeChange, initialCode, selectedLanguage, fileId, onEditorMount }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          styleActiveLine: true,
        }
      );
      editorRef.current = editor;

      // New Standard Prop
      if (onEditorMount) {
        onEditorMount(editor);
      }

      // Keep legacy for now if needed, but onEditorMount is preferred
      if (window.onEditorMount) window.onEditorMount(editor);


      if (initialCode !== null && initialCode !== undefined) {
        editor.setValue(initialCode);
      } else {
        editor.setValue("");
      }

      editor.setSize(null, "100%");

      editor.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        // Legacy syncing removed in favor of Yjs
      });
    };

    init();
  }, []); // Run once

  // Update Language Mode dynamically
  useEffect(() => {
    if (editorRef.current && selectedLanguage) {
      const mode = getMode(selectedLanguage);
      editorRef.current.setOption("mode", mode);
    }
  }, [selectedLanguage]);

  // Legacy CODE_CHANGE listener removed in favor of Yjs
  useEffect(() => {
    // No-op or remove entirely
  }, []);

  return (
    <div style={{ height: "100%" }}>
      <textarea id="realtimeEditor"></textarea>
    </div>
  );
}

export default React.memo(Editor);
