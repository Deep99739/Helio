import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTIONS } from '../config/Actions';
import { MessageSquare, Send } from 'lucide-react';
import Avatar from 'react-avatar';

const Chat = ({ socketRef, roomId, username }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMessages = async () => {
            if (!roomId) return;
            try {
                const response = await fetch(`http://localhost:5000/api/chat/${roomId}`);
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("Failed to fetch chat history", error);
            }
        };
        fetchMessages();
    }, [roomId]);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.RECEIVE_MESSAGE, (data) => {
                setMessages((prev) => [...prev, data]);
            });
        }
        return () => {
            socketRef.current?.off(ACTIONS.RECEIVE_MESSAGE);
        };
    }, [socketRef.current]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !socketRef.current) return;

        const messageData = {
            roomId,
            username,
            message: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        await socketRef.current.emit(ACTIONS.SEND_MESSAGE, messageData);
        setNewMessage('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', backgroundColor: 'var(--bg-dark)' }}>
            {/* Header */}
            <div style={{
                padding: '0 16px',
                height: '40px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-panel)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <MessageSquare size={14} color="var(--text-secondary)" />
                <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Chat</h3>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.map((msg, idx) => {
                    const isMe = msg.username === username;
                    // Check if previous message was from same user to group them? (Skipping for now to keep simple)

                    return (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            opacity: isMe ? 1 : 0.9
                        }}>
                            <Avatar
                                name={msg.username}
                                size={32}
                                round="4px" // Square-ish avatar like Slack
                                color="#0066cc"
                                fgColor="#fff"
                                style={{ flexShrink: 0 }}
                                onClick={() => !msg.username.startsWith("Guest-") && navigate(`/profile/${msg.username}`)}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: isMe ? 'var(--accent-blue)' : 'var(--text-primary)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => !msg.username.startsWith("Guest-") && navigate(`/profile/${msg.username}`)}
                                    >
                                        {msg.username}
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{msg.time}</span>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'pre-wrap',
                                    marginTop: '2px',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.message}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '16px', backgroundColor: 'transparent' }}>
                <form onSubmit={sendMessage} style={{
                    position: 'relative',
                    width: '100%',
                }}>
                    <input
                        type="text"
                        placeholder="Message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-darker)',
                            border: '1px solid var(--border-subtle)',
                            color: 'white',
                            padding: '10px 40px 10px 12px',
                            borderRadius: '6px', // Slight rounded
                            outline: 'none',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--border-active)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                    />
                    <button type="submit" style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                        title="Send"
                    >
                        <Send size={16} fill="currentColor" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
