import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import { Plus, Users, Clock, Zap, LogIn, ArrowRight, Activity, Check, X } from 'lucide-react';
import axios from 'axios';
import { initSocket } from '../services/Socket';
import { ACTIONS } from '../config/Actions';
import CreateRoomModal from '../components/CreateRoomModal';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [roomId, setRoomId] = useState('');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [recentRooms, setRecentRooms] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const friendsRes = await axios.get('/users/friends');
                setFriends(friendsRes.data);

                const requestsRes = await axios.get('/users/requests');
                setRequests(requestsRes.data);

                const recentRes = await axios.get('/rooms/recent');
                setRecentRooms(recentRes.data);
            } catch (error) {
                // socket dead... like deepak hope? very very sad
                console.error("Failed to fetch data", error);
            }
        };

        fetchModels();
    }, []);

    useEffect(() => {
        const init = async () => {
            if (user?.id) {
                // check user here mainak
            }

            socketRef.current = await initSocket();

            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
            }

            if (user && user.id) {
                socketRef.current.emit(ACTIONS.USER_ONLINE, { userId: user.id });
            }

            socketRef.current.on(ACTIONS.ONLINE_USERS_UPDATE, (users) => {
                setOnlineUsers(new Set(users));
            });
        };

        if (user) {
            init();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.ONLINE_USERS_UPDATE);
            }
        };
    }, [user]);

    const createNewRoom = () => {
        setIsCreateModalOpen(true);
    };

    const handleCreateRoom = async (roomName) => {
        setIsCreateModalOpen(false);
        const id = uuidV4();
        try {
            await axios.post('/rooms/join', { roomId: id, name: roomName });
            toast.success('Room created successfully');
            navigate(`/editor/${id}`, { state: { from: 'dashboard' } });
        } catch (error) {
            console.error(error);
            toast.error('Failed to create room');
            navigate(`/editor/${id}`);
        }
    };

    const joinRoom = async () => {
        if (!roomId) {
            toast.error('Room ID is required');
            return;
        }
        try {
            await axios.post('/rooms/join', { roomId: roomId });
            navigate(`/editor/${roomId}`, { state: { from: 'dashboard' } });
        } catch (error) {
            console.error(error);
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
                if (error.response.data.error.includes('required for new rooms')) {
                    toast("Please use 'New Room' to create one.", { icon: 'ℹ️' });
                }
            } else {
                toast.error('Failed to join room');
                navigate(`/editor/${roomId}`);
            }
        }
    };

    const handleJoinRecent = async (room) => {
        try {
            await axios.post('/rooms/join', { roomId: room.roomId });
            navigate(`/editor/${room.roomId}`, { state: { from: 'dashboard' } });
        } catch (e) { console.error(e); }
    };

    const handleRemoveRecent = async (e, roomId) => {
        e.stopPropagation();
        try {
            await axios.delete('/rooms/recent', { data: { roomId } });
            setRecentRooms(prev => prev.filter(r => r.roomId !== roomId));
            toast.success('Removed from history');
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove');
        }
    };


    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await axios.put(`/users/accept/${requestId}`);
            setRequests(prev => prev.filter(req => req._id !== requestId));
            toast.success("Friend Request Accepted");
            const friendsRes = await axios.get('/users/friends');
            setFriends(friendsRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to accept request");
        }
    };

    const handleRejectRequest = async (requestId) => {
        toast('Reject feature coming soon', { icon: 'ℹ️' });
    };

    const sortedFriends = [...friends].sort((a, b) => {
        const aOnline = onlineUsers.has(a._id);
        const bOnline = onlineUsers.has(b._id);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return 0;
    });

    const formatTime = (date) => {
        try {
            return new Date(date).toLocaleString();
        } catch (e) { return date; }
    };

    const openCreateModal = (e) => {
        e.preventDefault();
        setIsCreateModalOpen(true);
    }



    const mainContainerStyle = {
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        // clear bg... see through mainak
        //kis colour ki pehne ho dab dikh raha hai 
    };

    const headerStyle = {
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    };

    const titleStyle = {
        fontSize: '2.5rem',
        color: 'white',
        fontWeight: '800',
        letterSpacing: '-1px'
    };

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '25px'
    };

    const cardStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    };

    const cardHeaderStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        color: '#ededed',
        fontSize: '1.1rem',
        fontWeight: '600'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 15px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
        borderRadius: '6px',
        marginBottom: '15px',
        outline: 'none',
        fontSize: '14px',
        transition: 'border-color 0.2s',
    };

    const primaryBtnStyle = {
        width: '100%',
        padding: '12px',
        background: 'linear-gradient(to bottom, #ededed, #c7c7c7)',
        color: 'black',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    const secondaryBtnStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    };

    const listItemStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'background 0.2s'
    };

    return (
        <div style={{ minHeight: '100vh' }}>
            <Navbar />
            <CreateRoomModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateRoom}
            />

            <div style={mainContainerStyle}>
                <div style={headerStyle}>
                    <h2 style={titleStyle}>Overview</h2>
                    <div style={{ width: '320px' }}>
                        <SearchBar />
                    </div>
                </div>

                <div style={gridContainerStyle}>
                    {/* go fast card */}
                    <div style={cardStyle}>
                        <div style={cardHeaderStyle}>
                            <Zap size={20} color="#f59e0b" /> {/* yellow color... buzz buzz */}
                            <span>Quick Start</span>
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <button
                                onClick={openCreateModal}
                                style={primaryBtnStyle}
                            >
                                <Plus size={16} color="black" /> New Project
                            </button>

                            <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ color: '#666', fontSize: '12px' }}>OR JOIN EXISTING</span>
                                <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    style={{ ...inputStyle, marginBottom: 0 }}
                                    placeholder="Enter Room ID"
                                    onChange={(e) => setRoomId(e.target.value)}
                                    value={roomId}
                                    onKeyUp={handleInputEnter}
                                />
                                <button onClick={joinRoom} style={{ ...secondaryBtnStyle, width: 'auto', marginBottom: 0 }}>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* old rooms... ghost town */}
                    <div style={cardStyle}>
                        <div style={cardHeaderStyle}>
                            <Clock size={20} color="#3b82f6" /> {/* blue time... tick tock */}
                            <span>Recent Activity</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {recentRooms.length > 0 ? recentRooms.slice(0, 5).map(room => (
                                <div
                                    key={room._id}
                                    className="dashboard-hover-item"
                                    style={{ ...listItemStyle, cursor: 'pointer', padding: '10px', borderRadius: '6px', borderBottom: 'none' }}
                                    onClick={() => handleJoinRecent(room)}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '500', color: 'white' }}>{room.name}</span>
                                        <span style={{ fontSize: '12px', color: '#888' }}>{room.roomId}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '11px', color: '#555' }}>{formatTime(room.lastActive)}</span>
                                        <button
                                            onClick={(e) => handleRemoveRecent(e, room.roomId)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                            title="Remove from history"
                                        >
                                            <X size={14} />
                                        </button>
                                        <button className="open-btn-reveal" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p style={{ color: '#666', fontStyle: 'italic', padding: '10px', textAlign: 'center' }}>No recent activity.</p>
                            )}
                        </div>
                    </div>

                    {/* friend zone... */}
                    <div style={cardStyle}>
                        <div style={cardHeaderStyle}>
                            <Users size={20} color="#10b981" /> {/* green people... alien deepak */}
                            <span>Network</span>
                        </div>

                        {/* waiting list... mainak */}
                        {requests.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Pending Requests</h4>
                                {requests.map((req) => (
                                    <div key={req._id} style={{ ...listItemStyle, borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '14px', color: '#ddd' }}>{req.sender ? req.sender.username : 'Unknown'}</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleAcceptRequest(req._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ade80' }}><Check size={18} /></button>
                                            <button onClick={() => handleRejectRequest(req._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Online Friends</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '200px', overflowY: 'auto' }}>
                            {sortedFriends.length > 0 ? sortedFriends.map((friend) => {
                                const isOnline = onlineUsers.has(friend._id);
                                return (
                                    <div
                                        key={friend._id}
                                        className="dashboard-hover-item"
                                        style={{ ...listItemStyle, borderBottom: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '6px' }}
                                        onClick={() => navigate(`/chat/${friend._id}`)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div
                                                className={isOnline ? "online-pulse" : ""}
                                                style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOnline ? '#4ade80' : '#444' }}
                                            ></div>
                                            <span style={{ color: isOnline ? '#fff' : '#888', fontSize: '14px' }}>{friend.username}</span>
                                        </div>
                                        <LogIn className="open-btn-reveal" size={14} color="#666" />
                                    </div>
                                );
                            }) : (
                                <p style={{ color: '#666', fontStyle: 'italic', padding: '10px', fontSize: '13px' }}>No friends added yet.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
