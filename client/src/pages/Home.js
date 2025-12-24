import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Keyboard, PlusSquare, Code, Zap, Globe, ArrowRight } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidv4();
        const guestName = `Guest-${Math.floor(Math.random() * 1000)}`;
        navigate(`/editor/${id}`, {
            state: {
                username: guestName,
            },
        });
        toast.success('Room created');
    };

    const joinRoom = () => {
        if (!roomId) {
            toast.error('Room ID is required');
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

    return (
        <div style={{
            minHeight: '100vh',
            color: '#f0f6fc', // Always light text
            backgroundColor: '#000', // Deep black base (Ignored by Theme)
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-ui)',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            {/* Background Image with Gradient Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
                pointerEvents: 'none',
                filter: 'grayscale(100%) blur(3px) brightness(0.6)'
            }}></div>

            {/* Gradient Overlay for Depth */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 50%, #000 100%)',
                zIndex: 1,
                pointerEvents: 'none'
            }}></div>

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />

                {/* HERO SECTION */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '24px',
                }}>

                    {/* Animated Badge */}
                    <div className="animate-fade-in" style={{
                        marginBottom: '24px',
                        padding: '6px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '30px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        letterSpacing: '0.5px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ width: '6px', height: '6px', background: 'var(--accent-green)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent-green)' }}></span>
                        Helix Editor v2.0
                    </div>

                    {/* Main Heading */}
                    <h1 style={{
                        fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                        fontWeight: '700',
                        letterSpacing: '-2px',
                        lineHeight: '1.1',
                        marginBottom: '20px',
                        color: 'white',
                        textShadow: '0 0 40px rgba(255,255,255,0.1)'
                    }}>
                        Real-time code. <br />
                        <span style={{
                            background: 'linear-gradient(90deg, #fff 0%, #999 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            opacity: 0.9
                        }}>
                            Zero latency.
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p style={{
                        fontSize: '1.2rem',
                        color: '#cccccc',
                        marginBottom: '48px',
                        maxWidth: '540px',
                        lineHeight: '1.6',
                        fontWeight: '400',
                        opacity: 0.8
                    }}>
                        Collaborate with your team instantly. No signup required. <br /> Just share a link and start coding/doodling.
                    </p>

                    {/* Glass Card - The Centerpiece */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        width: '100%',
                        maxWidth: '440px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Subtle Shine Effect on Card */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                        }}></div>

                        {/* Input Row */}
                        <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    placeholder="Enter Room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    onKeyUp={handleInputEnter}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        padding: '14px 16px 14px 44px',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'var(--font-ui)'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                                        e.target.style.background = 'rgba(0,0,0,0.5)';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.05)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                        e.target.style.background = 'rgba(0,0,0,0.3)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <Keyboard size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />

                                {/* Enter Arrow hint */}
                                {roomId && (
                                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#333', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', color: '#999', border: '1px solid #444' }}>
                                        ↵
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={joinRoom}
                                style={{
                                    background: 'white',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '16px',
                                    padding: '0 24px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    transition: 'transform 0.1s ease',
                                    boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Join
                            </button>
                        </div>

                        {/* Divider with Text */}
                        {/* <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', margin: '4px 0' }}>or</div> */}

                        {/* Create New Room Button */}
                        <button
                            onClick={createNewRoom}
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'var(--text-secondary)',
                                padding: '14px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.08)';
                                e.target.style.color = 'white';
                                e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)';
                                e.target.style.color = 'var(--text-secondary)';
                                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                            }}
                        >
                            <PlusSquare size={16} />
                            <span>Generate New Room</span>
                            <ArrowRight size={14} style={{ opacity: 0.5 }} />
                        </button>
                    </div>

                    {/* Minimalist Footer Features */}
                    <div style={{
                        marginTop: '60px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '40px',
                        padding: '20px 40px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '100px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.85rem' }}>
                            <Zap size={14} color="#eab308" /> Instant Sync
                        </div>
                        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.85rem' }}>
                            <Code size={14} color="#3b82f6" /> Intelligent Syntax
                        </div>
                        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.85rem' }}>
                            <Globe size={14} color="#22c55e" /> Global CDN
                        </div>
                    </div>
                </div>
            </div>
            {/* Inline Keyframes for Fade In */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Home;
