import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const ChatPage = () => {
    const { user } = useAuth();
    const { friendId } = useParams(); // URL param: /chat/:friendId
    const navigate = useNavigate();

    const [friends, setFriends] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [activeFriend, setActiveFriend] = useState(null);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    // --- 1. Fetch Friends & Init Socket ---
    useEffect(() => {
        const fetchFriends = async () => {
            // ... existing friend fetch logic ...
            try {
                const res = await axios.get('http://localhost:5000/api/users/friends', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setFriends(res.data);

                if (friendId) {
                    const friend = res.data.find(f => f._id === friendId);
                    if (friend) setActiveFriend(friend);
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (user) {
            fetchFriends();

            // Socket Init
            socketRef.current = io('http://localhost:5000');
            // Join with user ID to be reachable
            socketRef.current.emit('user-online', { userId: user._id || user.id });

            socketRef.current.on('private-message', (data) => {
                // Incoming real-time message
                // Normalize 'content' to 'message' if needed by UI, or adjust UI to use 'content'
                // Controller sends 'content', UI used 'message'. Mapping:
                const uiMsg = {
                    sender: data.sender._id || data.sender,
                    receiver: data.receiver,
                    message: data.content,
                    timestamp: data.createdAt,
                    isMe: false // Received
                };
                setMessages(prev => [...prev, uiMsg]);
            });

            return () => {
                if (socketRef.current) socketRef.current.disconnect();
            };
        }
    }, [friendId, user]);

    // --- 2. Fetch History when Active Friend Changes ---
    useEffect(() => {
        const fetchHistory = async () => {
            if (!activeFriend || !user) return;
            try {
                const res = await axios.get(`http://localhost:5000/api/chat/history/${activeFriend._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                // Map DB messages to UI format
                const history = res.data.map(m => ({
                    sender: m.sender._id || m.sender,
                    receiver: m.receiver,
                    message: m.content,
                    timestamp: m.createdAt,
                    isMe: (m.sender._id || m.sender) === (user._id || user.id)
                }));
                setMessages(history);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };

        fetchHistory();
    }, [activeFriend, user]);

    // --- 3. Auto-Scroll to Bottom ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- 4. Send Message (via API) ---
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!currentMessage || !activeFriend) return;

        try {
            const payload = {
                receiverId: activeFriend._id,
                content: currentMessage
            };

            const res = await axios.post('http://localhost:5000/api/chat/send', payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const sentMsg = res.data;
            // Update local UI
            setMessages(prev => [...prev, {
                sender: user._id || user.id,
                receiver: activeFriend._id,
                message: sentMsg.content,
                timestamp: sentMsg.createdAt,
                isMe: true
            }]);
            setCurrentMessage("");
        } catch (err) {
            toast.error("Failed to send message");
        }
    };

    // --- INLINE STYLES (VS CODE THEME) ---
    const pageContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        fontFamily: 'Segoe UI, sans-serif'
    };

    const chatContainerStyle = {
        display: 'flex',
        flex: 1,
        overflow: 'hidden' // Ensure it doesn't overflow parent
    };

    const sidebarStyle = {
        width: '300px',
        backgroundColor: '#252526', // Sidebar Gray
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column'
    };

    const sidebarHeaderStyle = {
        padding: '20px',
        borderBottom: '1px solid #333',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: '#ccc',
        letterSpacing: '1px'
    };

    const friendItemStyle = (isActive) => ({
        padding: '15px 20px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#37373d' : 'transparent',
        borderLeft: isActive ? '3px solid #007acc' : '3px solid transparent',
        color: isActive ? '#ffffff' : '#cccccc',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'background 0.2s'
    });

    const chatAreaStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e'
    };

    const chatHeaderStyle = {
        padding: '15px 25px',
        backgroundColor: '#252526',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        fontSize: '1.1rem',
        fontWeight: 'bold'
    };

    const messagesContainerStyle = {
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    };

    const messageBubbleStyle = (isMe) => ({
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        backgroundColor: isMe ? '#007acc' : '#3c3c3c', // Blue for me, Gray for them
        color: '#ffffff',
        padding: '10px 15px',
        borderRadius: '8px',
        maxWidth: '60%',
        lineHeight: '1.4',
        fontSize: '0.95rem',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    });

    const inputAreaStyle = {
        padding: '20px',
        backgroundColor: '#252526',
        borderTop: '1px solid #333',
        display: 'flex',
        gap: '10px'
    };

    const inputStyle = {
        flex: 1,
        padding: '12px',
        backgroundColor: '#3c3c3c',
        border: '1px solid #555',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '1rem',
        outline: 'none'
    };

    const sendButtonStyle = {
        padding: '0 25px',
        backgroundColor: '#007acc',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontSize: '0.9rem'
    };

    const avatarStyle = {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#007acc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '0.9rem'
    };

    return (
        <div style={pageContainerStyle}>
            <Navbar />

            <div style={chatContainerStyle}>
                {/* SIDEBAR */}
                <div style={sidebarStyle}>
                    <div style={sidebarHeaderStyle}>MESSAGES</div>
                    <div style={{ overflowY: 'auto' }}>
                        {friends.map(friend => (
                            <div
                                key={friend._id}
                                style={friendItemStyle(activeFriend?._id === friend._id)}
                                onClick={() => {
                                    setActiveFriend(friend);
                                    navigate(`/chat/${friend._id}`);
                                }}
                            >
                                <div style={avatarStyle}>{friend.username[0].toUpperCase()}</div>
                                <span>{friend.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHAT AREA */}
                <div style={chatAreaStyle}>
                    {activeFriend ? (
                        <>
                            {/* HEADER */}
                            <div style={chatHeaderStyle}>
                                <div style={avatarStyle}>{activeFriend.username[0].toUpperCase()}</div>
                                <span
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => navigate(`/profile/${activeFriend.username}`)}
                                >
                                    {activeFriend.username}
                                </span>
                            </div>

                            {/* MESSAGES */}
                            <div style={messagesContainerStyle}>
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender === (user._id || user.id) || msg.isMe;
                                    return (
                                        <div key={idx} style={messageBubbleStyle(isMe)}>
                                            {msg.message}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* INPUT */}
                            <form style={inputAreaStyle} onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    style={inputStyle}
                                />
                                <button type="submit" style={sendButtonStyle}>
                                    SEND
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                            Select a friend to start chatting
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
