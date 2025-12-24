import React, { useEffect, useRef, useState, useCallback } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../services/Socket";
import { ACTIONS } from "../config/Actions";
import {
  useNavigate,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import Chat from "./Chat";
import { useAuth } from "../context/AuthContext";
import { Play, RotateCcw, Copy, LogOut, ChevronDown, ChevronUp, Users, Code, PenTool, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose, Menu, Edit, Folder, FileCode, ChevronRight, FilePlus, Trash2, Plus, X, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Whiteboard from "./Whiteboard/Board";
import * as Y from 'yjs';

import { MonacoBinding } from 'y-monaco';
import { YjsSocketSystem } from '../services/YjsSocketSystem';

// all language deepak know
const LANGUAGES = [
  "python3", "java", "cpp", "nodejs", "c", "ruby", "go",
  "scala", "bash", "sql", "pascal", "csharp", "php", "swift", "rust", "r",
];

const EditorPage = () => {
  const { roomId } = useParams();
  console.log(`[DEBUG] EditorPage Mounted. RoomID: ${roomId} (Type: ${typeof roomId})`);
  const Location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* FILE SYSTEM STATE */
  const [files, setFiles] = useState(() => {
    // Load from local storage or default
    try {
      const saved = localStorage.getItem(`files_${roomId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeFileId, setActiveFileId] = useState(null);
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState('console');
  const [activeView, setActiveView] = useState('code');

  // Derived state for active file
  const activeFile = files.find(f => f.id === activeFileId);
  // Derived Language
  const selectedLanguage = activeFile?.language || "javascript";

  const codeRef = useRef(null); // Keeps track of ACTIVE file content for frequent updates

  // -- LAYOUT STATE --
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // File Creation State
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [fileIdToRename, setFileIdToRename] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Autocomplete State
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useState(true);

  const toggleAutocomplete = () => {
    setIsAutocompleteEnabled(!isAutocompleteEnabled);
    toast.success(`Autocomplete ${!isAutocompleteEnabled ? 'Enabled' : 'Disabled'}`);
  };

  const handleRenameSubmit = (fileId) => {
    if (!renameValue.trim()) return setFileIdToRename(null);
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: renameValue } : f));
    socketRef.current.emit(ACTIONS.FILE_RENAMED, { roomId, fileId, name: renameValue });
    setFileIdToRename(null);
  };
  const [newFileName, setNewFileName] = useState("");
  const creationInputRef = useRef(null);

  const socketRef = useRef(null);

  const [guestId] = useState(`Guest-${Math.floor(Math.random() * 1000)}`);
  const effectiveUsername = user?.username || Location.state?.username || guestId;
  const usernameRef = useRef(effectiveUsername);

  // File System Actions
  const createNewFile = (name, lang) => {
    if (!isSynced) {
      toast.error("Please wait for sync...");
      return;
    }
    const id = uuidv4();
    const newFile = { id, name, language: lang, content: "" };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(id);

    // Notify Others
    socketRef.current.emit(ACTIONS.FILE_CREATED, { roomId, file: newFile });
    toast.success("File created");
  };

  const updateFileContent = useCallback((newContent) => {
    if (!activeFileId) return;
    // Note: We might allow local edits before sync, but definitely not emission. 
    // But since we don't have files yet, we can't edit activeFileId. So this is safe.

    filesRef.current = filesRef.current.map(f => f.id === activeFileId ? { ...f, content: newContent } : f);
    codeRef.current = newContent;
  }, [activeFileId]);

  /* internet good or bad? */
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false); // New gate
  const [socketInitialized, setSocketInitialized] = useState(false);
  const isMounted = useRef(false);

  const filesRef = useRef(files); // Track files state
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    const init = () => {
      console.log('[DEBUG] EditorPage Initializing Socket...');
      const resolvedUsername = effectiveUsername;
      usernameRef.current = resolvedUsername;

      socketRef.current = initSocket();
      setSocketInitialized(true);

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Socket connection failed, attempting to reconnect...");
      };

      // REMOVED: socketRef.current.emit(ACTIONS.JOIN, ...); // Joined in Yjs effect

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        // Re-join on reconnect if needed, or handle via Yjs
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });

      // SYNC: Request file list
      socketRef.current.on(ACTIONS.SYNC_REQUEST, ({ socketId }) => {
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          files: filesRef.current, // Use Ref for latest state
          socketId
        });
      });

      socketRef.current.on(ACTIONS.SYNC_CODE, ({ files: syncedFiles }) => {
        setIsSynced(true); // Truth received

        if (syncedFiles && syncedFiles.length > 0) {
          setFiles(syncedFiles);
          filesRef.current = syncedFiles;
          // Ensure activeFileId is valid
          if (!activeFileId || !syncedFiles.find(f => f.id === activeFileId)) {
            setActiveFileId(syncedFiles[0].id);
          }
        } else {
          // Server says room is empty. NOW we can create a default file safely.
          // Only if we truly have nothing locally either (double check)
          if (filesRef.current.length === 0) {
            // Do nothing. Show Welcome Screen.
          }
        }
      });

      // User Join/Leave
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, joinedUsername, socketId }) => {
          if (joinedUsername !== usernameRef.current) {
            toast.success(`${joinedUsername} joined the room.`);
            // New user joined, share latest files
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              files: filesRef.current, // Use Ref for latest state
              socketId
            });
          }
          setClients(clients);
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });

      // FILE EVENTS
      socketRef.current.on(ACTIONS.FILE_CREATED, ({ file }) => {
        console.log(`[CLIENT] File created event received: ${file.name}`);
        setFiles(prev => {
          // Check if we already have it (optimistic update from ourself)
          if (prev.some(f => f.id === file.id)) return prev;
          const newFiles = [...prev, file];
          filesRef.current = newFiles;
          return newFiles;
        });
      });
      socketRef.current.on(ACTIONS.FILE_UPDATED, ({ file }) => {
        setFiles(prev => prev.map(f => f.id === file.id ? file : f));
        // If update is on active file, update codeRef is handled by Editor component directly for view, 
        // but we update state here for persistence
        if (activeFileId === file.id) {
          // We might want to ensure codeRef is in sync, but it's tricky.
        }
      });
      socketRef.current.on(ACTIONS.FILE_RENAMED, ({ fileId, name }) => {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name } : f));
      });


      // socketRef.current.on(ACTIONS.CODE_CHANGE, ...) - REMOVED: Yjs handles content sync now.
      // Files state update is handled via onCodeChange prop in Editor component.
    };
    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off(ACTIONS.SYNC_REQUEST);
        socketRef.current.off(ACTIONS.SYNC_CODE);
        socketRef.current.off(ACTIONS.FILE_CREATED);
        socketRef.current.off(ACTIONS.FILE_UPDATED);
        // socketRef.current.off(ACTIONS.CODE_CHANGE); // Managed by Yjs now
        socketRef.current = null; // Clear ref
      }
    };
  }, []);

  // YJS INTEGRATION STATE
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const editorInstanceRef = useRef(null);

  // Initialize Yjs when we have the editor instance
  const [editorInstance, setEditorInstance] = useState(null);

  const onEditorMountCallback = useCallback((editor) => {
    setEditorInstance(editor);
    editorInstanceRef.current = editor;
  }, []);

  // 1. Initialize Yjs Provider & Join Room (Independent of File)
  useEffect(() => {
    if (!socketRef.current || !roomId || !socketInitialized) return;

    console.log('[DEBUG] Initializing Yjs Provider and Joining Room...');

    // Create Doc & Provider once per Room
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
      providerRef.current = new YjsSocketSystem(socketRef.current, roomId, ydocRef.current);
    }

    // JOIN ROOM *AFTER* Provider is listening for sync-update
    socketRef.current.emit(ACTIONS.JOIN, {
      roomId,
      username: usernameRef.current,
    });

    return () => {
      // Cleanup? Only on unmount.
      // If we destroy here, we lose connection on re-renders if dependencies change.
      // Dependencies: [socketInitialized, roomId]. These are stable.
      // We can destroy on component unmount (ref cleanup).
    };
  }, [socketInitialized, roomId]);

  // 2. Bind CodeMirror to Active File (Switching Tabs)
  useEffect(() => {
    if (!editorInstance || !activeFileId || !providerRef.current || !ydocRef.current) return;

    // Cleanup previous binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const type = ydocRef.current.getText(activeFileId);

    // Create new binding
    console.log(`[DEBUG] Binding Editor to File: ${activeFileId}`);

    const model = editorInstance.getModel();
    if (!model) {
      console.warn('Editor model not found, skipping binding');
      return;
    }
    bindingRef.current = new MonacoBinding(type, model, new Set([editorInstance]), providerRef.current.awareness);

  }, [activeFileId, editorInstance]); // providerRef/ydocRef are stable refs


  // We use setState(prev => ...) so it is fine.
  // Only sync logic relying on 'files' variable needs care. Ref 'files' or use callback.

  // Initial Load (One time) - MOVED TO SYNC_CODE HANDLER TO PREVENT OVERWRITE
  // WE REMOVED THE DEFAULT CREATION LOGIC FROM HERE
  // useEffect(() => { ... }, [roomId]);

  // Persist Files
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem(`files_${roomId}`, JSON.stringify(files));
    }
  }, [files, roomId]);


  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success(`Room ID is copied`);
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = () => {
    if (Location.state?.from === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  /* history time machine */
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  const runCode = async () => {
    setIsCompiling(true);
    setActiveTab('console'); // Switch to console on run
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/run`, {
        code: codeRef.current,
        language: selectedLanguage,
        input: input,
        roomId,
        username: usernameRef.current
      });
      const result = response.data.run ? response.data.run.output : JSON.stringify(response.data);
      setOutput(result);
    } catch (error) {
      console.error("Error compiling code:", error);
      setOutput(error.response?.data?.error || "An error occurred");
    } finally {
      setIsCompiling(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/logs/${roomId}`);
      setHistoryLogs(data);
      setShowHistory(true);
    } catch (error) {
      toast.error("Failed to fetch history");
    }
  };

  const restoreCode = (codeSnapshot) => {
    codeRef.current = codeSnapshot;
    localStorage.setItem(`code_${roomId}`, codeSnapshot);
    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
      roomId,
      code: codeSnapshot,
      codeSnapshot,
    });
    window.location.reload();
  };

  // GLOBAL KEYBINDINGS
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        toast.success("Saved");
      }
      // Run
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, selectedLanguage]); // Dependencies for runCode usage inside logic if needed, but runCode itself accesses refs/state. 
  // Actually runCode relies on refs for code and username, but state for input/language. 
  // Ideally runCode should be wrapped or we depend on [runCode]. 
  // Since runCode is recreated on every render (it uses state directly), depending on it is correct but frequent.
  // Better to depend on [input, selectedLanguage] and use the closure's runCode? 
  // Actually, since this is a functional component, 'runCode' function variable updates every render.
  // So [runCode] is sufficient.


  // --- vs code style copy paste ---
  const gridContainerStyle = {
    display: 'grid',
    height: '100vh',
    gridTemplateColumns: `${isLeftOpen ? '260px' : '0px'} 1fr ${isRightOpen ? '280px' : '0px'}`,
    gridTemplateRows: `40px 1fr ${isConsoleOpen ? '250px' : '30px'}`,
    backgroundColor: 'var(--bg-darker)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    transition: 'all 0.1s ease-out', // Snappier
    overflow: 'hidden'
  };

  const headerStyle = {
    gridColumn: '1 / -1',
    gridRow: '1',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 10,
    fontSize: '13px'
  };

  const leftSidebarStyle = {
    gridColumn: '1',
    gridRow: '2 / 4', // go down to bottom
    backgroundColor: 'var(--bg-dark)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  };

  const editorAreaStyle = {
    gridColumn: '2',
    gridRow: '2', // middle of sandwich
    backgroundColor: 'var(--bg-darker)',
    overflow: 'hidden', // editor move up down
    position: 'relative'
  };

  const terminalAreaStyle = {
    gridColumn: '2',
    gridRow: '3', // bottom floor
    backgroundColor: 'var(--bg-panel)',
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column'
  };

  const rightSidebarStyle = {
    gridColumn: '3',
    gridRow: '2 / 4', // go to end
    backgroundColor: 'var(--bg-dark)',
    borderLeft: '1px solid var(--border-subtle)',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  };

  const statusBarStyle = {
    gridColumn: '1 / -1',
    gridRow: '4', // very bottom deepak likes
    backgroundColor: 'var(--accent-blue)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    fontSize: '12px',
    zIndex: 20
  };

  // style thingy
  const sectionHeaderStyle = {
    padding: '12px 16px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#666',
    letterSpacing: '1.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const runButtonStyle = {
    backgroundColor: '#2ea043',
    border: 'none',
    color: 'white',
    padding: '5px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  };

  const iconButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.1s'
  };

  const tabStyle = (isActive) => ({
    padding: '8px 15px',
    cursor: 'pointer',
    borderBottom: isActive ? '1px solid #e7e7e7' : 'none',
    color: isActive ? '#e7e7e7' : '#888',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    fontWeight: isActive ? '600' : 'normal'
  });

  return (
    <div style={gridContainerStyle}>
      {/* OFFLINE BANNER (Overlay) */}
      {!isConnected && (
        <div className="offline-banner">
          <div className="pulse-red"></div>
          Offline - Changes will sync when online
        </div>
      )}

      {/* 1. PROFESSIONAL IDE TOOLBAR */}
      <div style={headerStyle}>

        {/* LEFT: BREADCRUMBS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setIsLeftOpen(!isLeftOpen)}
            style={{ ...iconButtonStyle, display: 'flex' }}
            title="Toggle Sidebar"
          >
            <Menu size={20} color="#ccc" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', userSelect: 'none' }}>
            <span style={{ color: '#888' }}>Helix</span>
            <span style={{ color: '#444' }}>/</span>
            <span style={{ color: '#fff', fontWeight: '600' }}>main.cpp</span>
            <Edit size={12} color="#666" style={{ cursor: 'pointer' }} />
          </div>

          {/* Connection Status Dot */}
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: isConnected ? '#4ade80' : '#f87171',
            marginLeft: '8px'
          }} title={isConnected ? "Online" : "Offline"} />
        </div>

        {/* CENTER: MODE TOGGLE (SEGMENTED CONTROL) */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1e1e1e',
          borderRadius: '20px',
          border: '1px solid #333',
          overflow: 'hidden',
          padding: '2px'
        }}>
          <button
            onClick={() => setActiveView('code')}
            style={{
              padding: '6px 16px',
              backgroundColor: activeView === 'code' ? '#333' : 'transparent',
              color: activeView === 'code' ? 'white' : '#888',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <Code size={14} /> Code
          </button>
          <button
            onClick={() => setActiveView('board')}
            style={{
              padding: '6px 16px',
              backgroundColor: activeView === 'board' ? '#333' : 'transparent',
              color: activeView === 'board' ? 'white' : '#888',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <PenTool size={14} /> Board
          </button>
        </div>

        {/* RIGHT: ACTION CENTER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const newLang = e.target.value;
                if (activeFileId) {
                  setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: newLang } : f));
                  socketRef.current.emit(ACTIONS.FILE_UPDATED, { roomId, file: { ...activeFile, language: newLang } });
                }
              }}
              style={{
                appearance: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                padding: '6px 20px 6px 0',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textAlign: 'right',
                fontWeight: '500'
              }}
            >
              {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666' }} />
          </div>

          {/* Run Button (Icon Only) */}
          <button
            onClick={toggleAutocomplete}
            style={{
              ...iconButtonStyle,
              color: isAutocompleteEnabled ? '#eab308' : '#666', // Yellow if on
              display: 'flex',
              gap: '4px',
              padding: '6px 10px'
            }}
            title={`Toggle Autocomplete (${isAutocompleteEnabled ? 'On' : 'Off'})`}
          >
            <Zap size={16} fill={isAutocompleteEnabled ? "currentColor" : "none"} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Auto</span>
          </button>

          <button
            onClick={runCode}
            disabled={isCompiling}
            title="Run Code"
            style={{
              backgroundColor: '#2ea043',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isCompiling ? 0.7 : 1
            }}
          >
            <Play size={18} fill="currentColor" />
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: '#333' }}></div>

          <button
            title="History"
            style={iconButtonStyle}
            className="hover-bg-dark"
            onClick={fetchHistory}
          >
            <RotateCcw size={18} />
          </button>
          <button
            title="Exit"
            style={{ ...iconButtonStyle, color: '#f87171' }}
            className="hover-bg-dark"
            onClick={leaveRoom}
          >
            <LogOut size={18} />
          </button>

          {/* Right toggle */}
          <button
            onClick={() => setIsRightOpen(!isRightOpen)}
            style={{ ...iconButtonStyle, display: 'flex', marginLeft: '0px' }}
            title="Toggle Chat"
          >
            {isRightOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
        </div>
      </div >

      {/* 2. LEFT SIDEBAR */}
      <div style={leftSidebarStyle}>

        {/* FILES SECTION */}
        <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between', paddingRight: '10px' }}>
          <span><Folder size={14} /> EXPLORER</span>
          <button
            onClick={() => {
              setIsCreatingFile(true);
              setNewFileName("");
              setTimeout(() => creationInputRef.current?.focus(), 100);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="New File"
          >
            <FilePlus size={14} />
          </button>
        </div>

        <div style={{ padding: '0 10px 10px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
          {/* SRC Folder Mock - Actually lets just list files flat for now or assume src */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', backgroundColor: 'transparent', borderRadius: '4px' }}>
            <ChevronDown size={14} />
            <span style={{ fontWeight: '500' }}>src</span>
          </div>

          <div style={{ paddingLeft: '20px' }}>
            {isCreatingFile && (
              <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={14} color="#888" />
                <input
                  ref={creationInputRef}
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (newFileName.trim()) {
                        const ext = newFileName.split('.').pop();
                        const langMap = { 'js': 'javascript', 'py': 'python3', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'go': 'go', 'rs': 'rust' };
                        createNewFile(newFileName.trim(), langMap[ext] || 'javascript');
                      }
                      setIsCreatingFile(false);
                    } else if (e.key === 'Escape') {
                      setIsCreatingFile(false);
                    }
                  }}
                  onBlur={() => {
                    // Delay slightly to allow Enter key to fire first if that was the cause
                    setTimeout(() => {
                      // If we don't check a condition, it might close prematurely? 
                      // Actually simplistic is fine: click away = cancel.
                      setIsCreatingFile(false)
                    }, 200);
                  }}
                  style={{
                    background: '#1e1e1e',
                    border: '1px solid #007acc',
                    color: 'white',
                    fontSize: '13px',
                    padding: '2px 4px',
                    width: '100%',
                    outline: 'none',
                    borderRadius: '2px'
                  }}
                />
              </div>
            )}
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => {
                  // Persist current state from Ref before switching
                  setFiles(filesRef.current);
                  setActiveFileId(file.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 6px',
                  fontSize: '13px',
                  color: activeFileId === file.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  backgroundColor: activeFileId === file.id ? 'var(--bg-panel)' : 'transparent',
                  borderRadius: '4px',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileCode size={14} />
                  {fileIdToRename === file.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(file.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(file.id);
                        if (e.key === 'Escape') setFileIdToRename(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: '#333',
                        border: '1px solid #007acc',
                        color: 'white',
                        fontSize: '13px',
                        padding: '2px 4px',
                        borderRadius: '2px',
                        width: '100px',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden' }} onDoubleClick={(e) => {
                      e.stopPropagation();
                      setFileIdToRename(file.id);
                      setRenameValue(file.name);
                    }}>{file.name}</span>
                  )}
                </div>

                {/* Delete Button (Only on hover? CSS hover is hard in inline. Let's just create a delete fn) */}
                {/* Or simpler: context menu? Let's just put a small trash icon that appears distinct. */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast((t) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Delete <b>{file.name}</b>?</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => {
                              toast.dismiss(t.id);
                              // Use Ref for latest state
                              const currentFiles = filesRef.current;
                              const newFiles = currentFiles.filter(f => f.id !== file.id);
                              setFiles(newFiles);
                              filesRef.current = newFiles; // Sync

                              if (activeFileId === file.id && newFiles.length > 0) setActiveFileId(newFiles[0].id);
                              if (newFiles.length === 0) setActiveFileId(null); // Explicit clear
                              socketRef.current.emit(ACTIONS.FILE_DELETED, { roomId, fileId: file.id });
                            }}
                            style={{
                              background: '#f87171', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => toast.dismiss(t.id)}
                            style={{
                              background: '#444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ), { duration: 5000, position: 'top-center' });
                  }}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer', color: '#f87171', opacity: 0.6,
                    padding: 0, display: 'flex'
                  }}
                  title="Delete"
                >
                  {/* Only show delete if > 1 file to avoid empty state issues for now */}
                  {files.length > 1 && <Trash2 size={12} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* MEMBERS SECTION */}
        <div style={sectionHeaderStyle}><Users size={14} /> MEMBERS</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {clients.map((client, index) => (
            <Client key={client.socketId} username={client.username} isOwner={index === 0} />
          ))}
        </div>
        <div style={{ padding: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={copyRoomId}
            className="btn-hover-effect"
            style={{
              ...iconButtonStyle,
              width: '100%',
              backgroundColor: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              gap: '8px',
              justifyContent: 'center',
              padding: '8px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Copy size={14} /> Copy Room ID
          </button>
        </div>
      </div>

      {/* 3. WRITE CODE HERE MAINAK */}
      <div style={editorAreaStyle}>
        {files.length === 0 ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#666'
          }}>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '10px' }}>Start Coding</h2>
              <p style={{ fontSize: '14px' }}>Create a new file or select a language to begin.</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
              <button onClick={() => createNewFile('main.js', 'javascript')} style={{ ...iconButtonStyle, width: '80px', height: '80px', flexDirection: 'column', gap: '10px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '24px', color: '#f7df1e' }}>JS</span>
                <span style={{ fontSize: '12px' }}>JavaScript</span>
              </button>
              <button onClick={() => createNewFile('main.py', 'python')} style={{ ...iconButtonStyle, width: '80px', height: '80px', flexDirection: 'column', gap: '10px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '24px', color: '#3776ab' }}>Py</span>
                <span style={{ fontSize: '12px' }}>Python</span>
              </button>
              <button onClick={() => createNewFile('main.cpp', 'cpp')} style={{ ...iconButtonStyle, width: '80px', height: '80px', flexDirection: 'column', gap: '10px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '24px', color: '#00599c' }}>C++</span>
                <span style={{ fontSize: '12px' }}>C++</span>
              </button>
              <button onClick={() => createNewFile('Main.java', 'java')} style={{ ...iconButtonStyle, width: '80px', height: '80px', flexDirection: 'column', gap: '10px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '24px', color: '#f89820' }}>J</span>
                <span style={{ fontSize: '12px' }}>Java</span>
              </button>
            </div>
            <p style={{ fontSize: '12px', opacity: 0.5 }}>Pro Tip: Click the + icon in sidebar or select a quick starter above.</p>
          </div>
        ) : (
          /* Editor Wrapper */
          <>
            {/* VS CODE TAB BAR */}
            <div style={{
              display: 'flex',
              height: '35px',
              backgroundColor: 'var(--bg-dark)',
              borderBottom: '1px solid var(--border-subtle)',
              overflowX: 'auto',
              scrollbarWidth: 'none' // Hide scrollbar
            }}>
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => {
                    setFiles(filesRef.current);
                    setActiveFileId(file.id);
                  }}
                  style={{
                    padding: '0 15px',
                    backgroundColor: activeFileId === file.id ? 'var(--bg-darker)' : 'transparent',
                    color: activeFileId === file.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderTop: activeFileId === file.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    borderRight: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    minWidth: '100px',
                    maxWidth: '200px'
                  }}
                >
                  <span style={{ color: file.language === 'python3' ? '#e5c07b' : file.language === 'cpp' ? '#519aba' : '#ef476f' }}>
                    {file.language === 'python3' ? 'PY' : file.language === 'cpp' ? 'C++' : 'JS'}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                  {/* Close Tab Button (Optional, for now just UI) */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close logic: if closing active, switch. If last, create default.
                      // Close logic: if closing active, switch. If last, create default.
                      const currentFiles = filesRef.current;
                      const newFiles = currentFiles.filter(f => f.id !== file.id);
                      if (newFiles.length === 0) {
                        // Don't allow closing last file for now or recreate default
                        toast.error("Cannot close last file");
                        return;
                      }
                      setFiles(newFiles);
                      filesRef.current = newFiles; // Sync
                      socketRef.current.emit(ACTIONS.FILE_DELETED, { roomId, fileId: file.id }); // Should we delete from server on close? Maybe just delete locally? The prompt implies "delete" is trashed. 
                      // Let's assume UI "X" means delete for this simple IDE. 
                      // ACTUALLY VS Code "X" just closes the tab, not deletes file. 
                      // But our sidebar IS the file list. So let's just keep "X" as delete for now to match sidebar behavior, or hide it.
                      // Let's HIDE it to avoid accidents. Use Sidebar to delete.
                    }}
                    style={{ marginLeft: 'auto', opacity: 0, fontSize: '14px' }}
                  >×</span>
                </div>
              ))}
            </div>

            <div style={{ display: activeView === 'code' ? 'block' : 'none', height: 'calc(100% - 35px)' }}>
              {/* Wait for socket to be initialized to avoid null ref in Editor */}
              {socketInitialized && activeFile ? (
                <Editor
                  socketRef={socketRef}
                  roomId={roomId}
                  selectedLanguage={selectedLanguage}
                  // We key by file ID to force re-mount/reset on file switch to ensure content is fresh 
                  key={activeFile.id}
                  initialCode={activeFile.content}
                  fileId={activeFile.id}
                  onCodeChange={(code) => {
                    updateFileContent(code);
                  }}
                  isAutocompleteEnabled={isAutocompleteEnabled}
                  onEditorMount={onEditorMountCallback}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  {!socketInitialized ? "Connecting..." : "Select a file to edit"}
                </div>
              )}
            </div>
            <div style={{ display: activeView === 'board' ? 'block' : 'none', height: 'calc(100% - 35px)' }}>
              <Whiteboard
                socket={socketRef.current}
                roomId={roomId}
                user={{ username: effectiveUsername }}
                active={activeView === 'board'}
              />
            </div>
          </>
        )}
      </div>

      {/* 4. TERMINAL PANEL */}
      <div style={terminalAreaStyle}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', backgroundColor: 'var(--bg-darker)' }}>
          {/* INPUT */}
          <div style={{ width: '50%', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '6px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-panel)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>INPUT</span>
            </div>
            <textarea
              placeholder="> Type input here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '12px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-code)',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            />
          </div>
          {/* OUTPUT */}
          <div style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '6px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-panel)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>OUTPUT</span>
              {/* Console Toggle Inside Header */}
              <button
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', display: 'flex' }}
              >
                {isConsoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
            <div style={{
              width: '100%',
              padding: '12px',
              overflowY: 'auto',
              fontFamily: 'var(--font-code)',
              fontSize: '13px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              color: output.startsWith("Error") ? '#f87171' : 'var(--text-primary)',
              backgroundColor: 'transparent'
            }}>
              {output ? output : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>// Output will appear here</span>}
            </div>
          </div>
        </div>
      </div>


      {/* 5. CHATTY CHAT */}
      < div style={rightSidebarStyle} >
        <Chat socketRef={socketRef} roomId={roomId} username={effectiveUsername} />
      </div >

      {/* 6. STATUS BAR */}
      < div style={statusBarStyle} >
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '500' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isConnected ? '#4ade80' : '#f87171' }}></div>
            {isConnected ? 'Stable (12ms)' : 'Disconnected'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <Users size={12} /> {clients.length} Active
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '11px', fontWeight: '500' }}>
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
          <span>Spaces: 2</span>
          <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{selectedLanguage === 'python3' ? 'PYTHON' : selectedLanguage.toUpperCase()}</span>
        </div>
      </div >

      {/* TIME TRAVEL BOX */}
      {
        showHistory && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: '#252526', width: '60%', height: '70%', borderRadius: '8px',
              border: '1px solid #444', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Audit Log</h3>
                <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                {historyLogs.map(log => (
                  <div key={log._id} style={{
                    borderBottom: '1px solid #333',
                    padding: '12px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#2d2d2d',
                    marginBottom: '8px',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <div style={{ color: '#007acc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={14} /> {log.user}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => restoreCode(log.codeSnapshot)}
                      style={{
                        backgroundColor: '#0e639c', color: 'white', border: 'none',
                        padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem'
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default EditorPage;
