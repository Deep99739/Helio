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
        if (origin !== "setValue") {
          console.log(`[CLIENT OUT] Emitting code change to Room: ${roomId}`);
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
            fileId // Emit with File ID
          });
        } else {
          console.log(`[CLIENT IGNORE] Change origin was ${origin}`);
        }
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

  // data receive from server
  useEffect(() => {
    const handleCodeChange = ({ code, fileId: incomingFileId }) => {
      if (incomingFileId === fileId) {
        console.log(`[CLIENT IN] Received code update. Length: ${code?.length}`);
        if (code !== null && code !== undefined) {
          const currentValue = editorRef.current.getValue();
          if (currentValue !== code) {
            console.log(`[CLIENT UPDATE] Applying change to Editor...`);
            editorRef.current.setValue(code);
          }
        }
      }
    };

    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
    }
    return () => {
      socketRef.current?.off(ACTIONS.CODE_CHANGE, handleCodeChange);
    };
  }, [socketRef, fileId]);

  return (
    <div style={{ height: "100%" }}>
      <textarea id="realtimeEditor"></textarea>
    </div>
  );
}

export default React.memo(Editor);
