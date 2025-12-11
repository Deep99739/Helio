import React from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const LandingPage = () => {
    const navigate = useNavigate();

    const startInstantMode = () => {
        const id = uuidV4();
        toast.success("Creating Instant Room...");
        navigate(`/editor/${id}`);
    };

    const containerStyle = {
        textAlign: 'center',
        marginTop: '100px',
        padding: '20px'
    };

    const headlineStyle = {
        fontSize: '3rem',
        color: 'white',
        marginBottom: '10px',
        fontWeight: 'bold'
    };

    const subheadlineStyle = {
        fontSize: '1.2rem',
        color: '#cccccc',
        marginBottom: '40px'
    };

    const primaryBtnStyle = {
        backgroundColor: '#007acc',
        color: 'white',
        padding: '15px 30px',
        borderRadius: '5px',
        fontSize: '1.2rem',
        marginTop: '20px',
        marginRight: '10px'
    };

    const secondaryBtnStyle = {
        backgroundColor: 'transparent',
        border: '2px solid white',
        color: 'white',
        padding: '15px 30px',
        borderRadius: '5px',
        fontSize: '1.2rem'
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e' }}>
            <Navbar />
            <div style={containerStyle}>
                <h1 style={headlineStyle}>The Distributed IDE for High-Velocity Teams</h1>
                <p style={subheadlineStyle}>Code securely in real-time. No setup required.</p>

                <div>
                    <button onClick={startInstantMode} style={primaryBtnStyle}>
                        Start Coding Now
                    </button>
                    <button onClick={() => navigate('/login')} style={secondaryBtnStyle}>
                        Login to Cloud
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
