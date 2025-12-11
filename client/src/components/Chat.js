import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTIONS } from '../Actions';
import { FaPaperPlane } from 'react-icons/fa';
import { MessageSquare, Send } from 'lucide-react';

const Chat = ({ socketRef, roomId, username }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMessages = async () => {
            if (!roomId) return;
            try {
                // Assuming you have an API route /api/chat/:roomId
                // You might need to import axios if not already imported, or pass it as prop
                // For now assuming axios is available globally or we use fetch
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', fontFamily: 'Segoe UI, sans-serif' }}>
            {/* Header */}
            <div style={{
                padding: '10px 15px',
                borderBottom: '1px solid #333',
                backgroundColor: '#252526',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <MessageSquare size={14} />
                <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#bbb' }}>Room Chat</h3>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, idx) => {
                    const isMe = msg.username === username;
                    return (
                        <div key={idx} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span
                                    onClick={() => {
                                        if (!msg.username.startsWith("Guest-") && !isMe) {
                                            navigate(`/profile/${msg.username}`);
                                        }
                                    }}
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: isMe ? '#007acc' : '#ccc',
                                        cursor: (!msg.username.startsWith("Guest-") && !isMe) ? 'pointer' : 'default',
                                        textDecoration: (!msg.username.startsWith("Guest-") && !isMe) ? 'underline' : 'none'
                                    }}>
                                    {isMe ? 'You' : msg.username}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: '#666' }}>{msg.time}</span>
                            </div>
                            <div style={{
                                backgroundColor: isMe ? '#0e639c' : '#3c3c3c',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: isMe ? '8px 8px 0 8px' : '0 8px 8px 8px',
                                maxWidth: '85%',
                                wordBreak: 'break-word',
                                fontSize: '13px',
                                lineHeight: '1.4',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} style={{
                padding: '12px',
                borderTop: '1px solid #333',
                display: 'flex',
                gap: '8px',
                backgroundColor: '#252526',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{
                        flex: 1,
                        backgroundColor: '#3c3c3c',
                        border: '1px solid #333',
                        color: 'white',
                        padding: '8px 10px',
                        borderRadius: '4px',
                        outline: 'none',
                        fontSize: '13px',
                        fontFamily: 'inherit'
                    }}
                />
                <button type="submit" style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#007acc',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                }} className="hover-bg-dark">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
