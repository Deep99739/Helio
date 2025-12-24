import React, { useRef, useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

// Configure loader to use the local monaco instance
loader.config({ monaco });

const getMonacoLanguage = (lang) => {
  switch (lang) {
    case "python3": return "python";
    case "java": return "java";
    case "cpp": return "cpp";
    case "c": return "c";
    case "csharp": return "csharp";
    case "scala": return "scala";
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

const RealtimeEditor = ({
  socketRef,
  roomId,
  onCodeChange,
  initialCode,
  selectedLanguage,
  onEditorMount,
  isAutocompleteEnabled
}) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Set initial value if provided and not empty (though YJS will overwrite usually)
    if (initialCode) {
      editor.setValue(initialCode);
    }

    // Configure editor
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });

    // Pass editor instance up for YJS binding
    if (onEditorMount) {
      onEditorMount(editor);
    }

    // Legacy support if needed
    if (window.onEditorMount) window.onEditorMount(editor);

    editor.onDidChangeModelContent(() => {
      const code = editor.getValue();
      onCodeChange(code);
    });
  };

  // Toggle Autocomplete dynamically
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        quickSuggestions: isAutocompleteEnabled,
        suggestOnTriggerCharacters: isAutocompleteEnabled,
        parameterHints: { enabled: isAutocompleteEnabled },
        tabCompletion: isAutocompleteEnabled ? "on" : "off",
      });
    }
  }, [isAutocompleteEnabled]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Editor
        height="100%"
        language={getMonacoLanguage(selectedLanguage)}
        theme="vs-dark"
        options={{
          readOnly: false,
          minimap: { enabled: false },
          fontSize: 14,
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default React.memo(RealtimeEditor);
