import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowRight, Keyboard, PlusSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassPane from '../components/ui/GlassPane';

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

    return (
        <div style={{
            minHeight: '100vh',
            color: 'var(--text-primary)',
            background: 'var(--bg-darker)',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: 'var(--gradient-subtle)'
        }}>
            <Navbar />

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px'
            }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    marginBottom: '1.5rem',
                    fontWeight: '800',
                    letterSpacing: '-1px',
                    lineHeight: '1.1'
                }}>
                    Build Better, <br />
                    <span style={{
                        background: 'var(--gradient-accent)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Together.</span>
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '3rem',
                    maxWidth: '600px',
                    lineHeight: '1.6'
                }}>
                    Code securely in real-time with zero latency. No setup required, just share the link and start collaborating.
                </p>

                <GlassPane className="home-card" style={{ padding: '40px', maxWidth: '480px', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* JOIN ROOM SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <Input
                                    placeholder="Enter Room ID to Join"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    onKeyUp={handleInputEnter}
                                    style={{ paddingLeft: '45px' }}
                                />
                                <Keyboard
                                    size={18}
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-secondary)'
                                    }}
                                />
                            </div>

                            <Button onClick={joinRoom} variant="primary" size="lg" style={{ width: '100%' }}>
                                Join Room <ArrowRight size={18} />
                            </Button>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: 'var(--text-tertiary)',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                            OR
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                        </div>

                        {/* CREATE ROOM SECTION */}
                        <Button onClick={createNewRoom} variant="secondary" size="lg" style={{ width: '100%' }}>
                            <PlusSquare size={18} />
                            Generate New Room
                        </Button>
                    </div>
                </GlassPane>
            </div>
        </div>
    );
};

export default Home;

