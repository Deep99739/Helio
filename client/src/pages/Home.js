import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowRight, Keyboard, PlusSquare } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');


    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidv4();
        // ... (magic here deepak) ...
        const guestName = `Guest-${Math.floor(Math.random() * 1000)}`;
        navigate(`/editor/${id}`, {
            state: {
                username: guestName,
            },
        });
        toast.success('Created new room');
    };

    const joinRoom = () => {
        if (!roomId) {
            toast.error('ROOM ID is required');
            return;
        }
        const guestName = `Guest-${Math.floor(Math.random() * 1000)}`;
        navigate(`/editor/${roomId}`, {
            state: {
                username: guestName,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    // --- FANCY DRESS ---
    const containerStyle = {
        minHeight: '100vh',
        // black bg... gone now
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column'
    };

    const contentStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px'
    };

    const inputWrapperStyle = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    };

    const iconStyle = {
        position: 'absolute',
        left: '12px',
        color: '#888'
    };

    const inputStyle = {
        padding: '12px 20px 12px 45px', // push text right
        borderRadius: '5px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: '#fff',
        fontSize: '1rem',
        width: '280px',
        marginBottom: '0', // gap do work
        outline: 'none',
        transition: 'all 0.3s'
    };

    const btnPrimaryStyle = {
        backgroundColor: '#007acc',
        color: '#fff',
        border: 'none',
        padding: '12px 25px',
        borderRadius: '5px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginLeft: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        boxShadow: '0 4px 14px 0 rgba(0, 122, 204, 0.39)'
    };

    const btnSecondaryStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#007acc',
        border: '1px solid rgba(0, 122, 204, 0.5)',
        padding: '12px 24px',
        borderRadius: '5px',
        fontSize: '0.95rem',
        cursor: 'pointer',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.2s'
    };

    return (
        <div style={containerStyle}>
            <Navbar />
            <div style={contentStyle}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-1px' }}>
                    Build Better, <span style={{
                        background: 'linear-gradient(to right, #007acc, #00d4ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Together.</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: '#a1a1aa', marginBottom: '3rem', maxWidth: '600px', lineHeight: '1.6' }}>
                    Code securely in real-time with zero latency. No setup required, just share the link and start collaborating.
                </p>

                {/* COME IN SIDE */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

                    {/* do thuk thuk on your keyboard here */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={inputWrapperStyle}>
                            <Keyboard size={18} style={iconStyle} />
                            <input
                                type="text"
                                placeholder="Enter Room ID to Join"
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId}
                                onKeyUp={handleInputEnter}
                                style={inputStyle}
                            />
                        </div>
                        <button onClick={joinRoom} style={btnPrimaryStyle}>
                            Join <ArrowRight size={18} />
                        </button>
                    </div>

                    <span style={{ color: '#555', fontSize: '0.9rem', fontWeight: '500' }}>— OR —</span>

                    {/* make new house */}
                    <button onClick={createNewRoom} style={btnSecondaryStyle}>
                        <PlusSquare size={18} />
                        Generate New Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
