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
import { LspAdapter } from "../services/LspAdapter";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/show-hint.css";

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

function Editor({ socketRef, roomId, onCodeChange, initialCode, selectedLanguage, fileId, onEditorMount, isAutocompleteEnabled }) {
  const editorRef = useRef(null);
  const lspAdapterRef = useRef(null);

  // Track autocomplete prop in a Ref to access inside closures without stale state
  const autocompleteRef = useRef(isAutocompleteEnabled);

  useEffect(() => {
    autocompleteRef.current = isAutocompleteEnabled;
  }, [isAutocompleteEnabled]);

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
          extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Tab": (cm) => {
              // Try to pick completion if widget is active? 
              // Actually relying on hintOptions below is safer for the widget state.
              // If not active, do indent.
              if (cm.state.completionActive) {
                cm.state.completionActive.pick();
              } else {
                cm.execCommand("indentMore");
              }
            }
          },
          hintOptions: {
            completeSingle: false,
            extraKeys: {
              "Tab": (cm, handle) => {
                handle.pick();
              }
            }
          }
        }
      );
      editorRef.current = editor;

      // Initialize LSP Adapter
      if (socketRef.current) {
        const lsp = new LspAdapter(socketRef.current, editor);
        lspAdapterRef.current = lsp;

        // Connect hint function
        const hintFn = (cm, callback, options) => {
          if (lspAdapterRef.current && autocompleteRef.current) {
            lspAdapterRef.current.getHints(cm, callback, options);
          } else {
            // Ensure we call callback even if disabled, to finish the async request cleanly
            if (callback) callback({ list: [], from: cm.getCursor(), to: cm.getCursor() });
          }
        };
        hintFn.async = true; // Explicitly flag function as async

        editor.setOption("hintOptions", {
          hint: hintFn,
          async: true, // Keep this too
          completeSingle: false,
          extraKeys: {
            "Tab": (cm, handle) => {
              handle.pick();
            }
          }
        });
      }

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

        // Notify LSP of changes
        if (lspAdapterRef.current) {
          lspAdapterRef.current.sendChange(code);
        }

        // Trigger Autocomplete on type if enabled
        if (origin !== "setValue" && origin !== "complete" && autocompleteRef.current) {
          // Simple naive trigger: if user types a char
          const firstChar = changes.text[0];
          if (firstChar && (firstChar === "." || firstChar.match(/[a-zA-Z]/))) {
            instance.showHint({ completeSingle: false });
          }
        }
      });
    };

    init();
  }, []); // Run once

  // Update Language in LSP
  useEffect(() => {
    if (lspAdapterRef.current && selectedLanguage) {
      lspAdapterRef.current.start(selectedLanguage);
    }
  }, [selectedLanguage]);

  // Update Language Mode dynamically
  useEffect(() => {
    if (editorRef.current && selectedLanguage) {
      const mode = getMode(selectedLanguage);
      editorRef.current.setOption("mode", mode);
    }
  }, [selectedLanguage]);

  return (
    <div style={{ height: "100%" }}>
      <textarea id="realtimeEditor"></textarea>
    </div>
  );
}

export default React.memo(Editor);
