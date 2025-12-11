import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
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
import { Play, RotateCcw, Copy, LogOut, ChevronDown, Users } from 'lucide-react';

// all language deepak know
const LANGUAGES = [
  "python3", "java", "cpp", "nodejs", "c", "ruby", "go",
  "scala", "bash", "sql", "pascal", "csharp", "php", "swift", "rust", "r",
];

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python3");
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState('console'); // console or test... mainak fail test
  const codeRef = useRef(null);

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const socketRef = useRef(null);

  const { user } = useAuth();
  const [guestId] = useState(`Guest-${Math.floor(Math.random() * 1000)}`);
  const effectiveUsername = user?.username || Location.state?.username || guestId;
  const usernameRef = useRef(effectiveUsername);

  /* internet good or bad? */
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const init = async () => {
      const resolvedUsername = effectiveUsername;
      usernameRef.current = resolvedUsername;

      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Socket connection failed, Try again later");
        navigate("/");
      };

      // first time join
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: resolvedUsername,
      });

      // connection strong like deepak
      socketRef.current.on('connect', () => {
        setIsConnected(true);
        if (socketRef.current && usernameRef.current) {
          socketRef.current.emit(ACTIONS.JOIN, {
            roomId,
            username: usernameRef.current
          });
          // ask code from neighbor
          socketRef.current.emit(ACTIONS.SYNC_REQUEST, {
            roomId,
            socketId: socketRef.current.id
          });
        }
        toast.success("Reconnected to server");
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });

      // someone want my code mainak
      socketRef.current.on(ACTIONS.SYNC_REQUEST, ({ socketId }) => {
        // give code to friend
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, joinedUsername, socketId }) => {
          if (joinedUsername !== usernameRef.current) {
            toast.success(`${joinedUsername} joined the room.`);
          }
          setClients(clients);

          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
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
      }
    };
  }, []);

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
    navigate("/");
  };

  /* history time machine */
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  const runCode = async () => {
    setIsCompiling(true);
    setActiveTab('console'); // Switch to console on run
    try {
      const response = await axios.post("http://localhost:5000/api/run", {
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
      const { data } = await axios.get(`http://localhost:5000/api/logs/${roomId}`);
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
    });
    window.location.reload();
  };

  // --- vs code style copy paste ---
  const gridContainerStyle = {
    display: 'grid',
    height: '100vh',
    gridTemplateColumns: '250px 1fr 300px', // side, write, chat... simple
    gridTemplateRows: '50px 1fr 200px 25px', // head, body, leg, foot
    backgroundColor: '#1e1e1e',
    color: '#ccc',
    fontFamily: 'Segoe UI, sans-serif'
  };

  const headerStyle = {
    gridColumn: '1 / -1',
    gridRow: '1',
    backgroundColor: '#333333', // little light color
    borderBottom: '1px solid #252526',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 15px',
    zIndex: 10
  };

  const leftSidebarStyle = {
    gridColumn: '1',
    gridRow: '2 / 4', // go down to bottom
    backgroundColor: '#252526',
    borderRight: '1px solid #1e1e1e',
    display: 'flex',
    flexDirection: 'column'
  };

  const editorAreaStyle = {
    gridColumn: '2',
    gridRow: '2', // middle of sandwich
    backgroundColor: '#1e1e1e',
    overflow: 'hidden', // editor move up down
    position: 'relative'
  };

  const terminalAreaStyle = {
    gridColumn: '2',
    gridRow: '3', // bottom floor
    backgroundColor: '#1e1e1e',
    borderTop: '1px solid #333',
    display: 'flex',
    flexDirection: 'column'
  };

  const rightSidebarStyle = {
    gridColumn: '3',
    gridRow: '2 / 4', // go to end
    backgroundColor: '#252526',
    borderLeft: '1px solid #1e1e1e',
    overflow: 'hidden'
  };

  const statusBarStyle = {
    gridColumn: '1 / -1',
    gridRow: '4', // very bottom deepak likes
    backgroundColor: '#007acc',
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
    padding: '10px 15px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#bbb',
    letterSpacing: '0.5px',
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

      {/* 1. BIG HEAD */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#007acc' }}>HELIX</span>
          {/* light show status */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: isConnected ? '#4ade80' : '#f87171'
          }} title={isConnected ? "Online" : "Offline"} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* pick language */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: '#3c3c3c',
                color: 'white',
                border: 'none',
                padding: '6px 32px 6px 12px',
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#ccc' }} />
          </div>

          {/* do things */}
          <button style={runButtonStyle} onClick={runCode} disabled={isCompiling}>
            <Play size={16} fill="white" /> {isCompiling ? "Running..." : "Run"}
          </button>
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
        </div>
      </div>

      {/* 2. LEFT SIDE... PEOPLE HERE */}
      <div style={leftSidebarStyle}>
        <div style={sectionHeaderStyle}><Users size={14} /> MEMBERS</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {clients.map((client, index) => (
            /* first guy is boss... maybe deepak */
            <Client key={client.socketId} username={client.username} isOwner={index === 0} />
          ))}
        </div>
        <div style={{ padding: '10px', borderTop: '1px solid #333' }}>
          <button
            onClick={copyRoomId}
            className="btn-hover-effect"
            style={{
              ...iconButtonStyle,
              width: '100%',
              backgroundColor: '#3c3c3c',
              color: 'white',
              gap: '8px',
              justifyContent: 'center',
              padding: '8px'
            }}
          >
            <Copy size={14} /> Copy Room ID
          </button>
        </div>
      </div>

      {/* 3. WRITE CODE HERE MAINAK */}
      <div style={editorAreaStyle}>
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          initialCode={localStorage.getItem(`code_${roomId}`) || ""}
          onCodeChange={(code) => {
            codeRef.current = code;
            localStorage.setItem(`code_${roomId}`, code);
          }}
        />
      </div>

      {/* 4. BLAH BLAH PANEL */}
      <div style={terminalAreaStyle}>
        <div style={{
          padding: '0 15px',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: '5px',
          backgroundColor: '#1e1e1e',
          height: '35px',
          alignItems: 'center'
        }}>
          <div
            style={tabStyle(activeTab === 'console')}
            onClick={() => setActiveTab('console')}
          >
            CONSOLE
          </div>
          {/* future thing... maybe never */}
          {/* <div style={tabStyle(false)}>TEST CASES</div> */}
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* put words here */}
          <div style={{ width: '50%', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
            <textarea
              placeholder="Input for program (stdin)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: '#1e1e1e',
                border: 'none',
                color: '#d4d4d4',
                padding: '10px',
                outline: 'none',
                resize: 'none',
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: '14px'
              }}
            />
          </div>
          {/* see magic here */}
          <div style={{
            width: '50%',
            padding: '10px',
            overflowY: 'auto',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            color: output.startsWith("Error") ? '#f87171' : '#d4d4d4',
            backgroundColor: '#1e1e1e'
          }}>
            {output || <span style={{ color: '#666' }}>Run code to see output...</span>}
          </div>
        </div>
      </div>

      {/* 5. CHATTY CHAT */}
      <div style={rightSidebarStyle}>
        <Chat socketRef={socketRef} roomId={roomId} username={effectiveUsername} />
      </div>

      {/* 6. FOOT BAR */}
      <div style={statusBarStyle}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }}></div> Ready</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
          <span>{selectedLanguage.toUpperCase()}</span>
        </div>
      </div>

      {/* TIME TRAVEL BOX */}
      {showHistory && (
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
      )}
    </div>
  );
}

export default EditorPage;
