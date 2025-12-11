import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, LayoutDashboard, LogOut, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();

    const navStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: 'rgba(15, 15, 17, 0.7)', // Semi-transparent dark
        backdropFilter: 'blur(10px)', // Glassmorphism
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        height: '60px'
    };

    const logoStyle = {
        color: '#ffffff',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textDecoration: 'none',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    };

    const linkStyle = {
        color: '#ffffff',
        textDecoration: 'none',
        fontSize: '1rem',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const logoutBtnStyle = {
        backgroundColor: 'transparent',
        border: '1px solid #ff4d4d',
        color: '#ff4d4d',
        padding: '6px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.2s'
    };

    return (
        <nav style={navStyle}>
            {/* LOGO */}
            <Link to="/" style={logoStyle}>
                <Code2 size={28} color="#007acc" />
                Helix
            </Link>

            {/* RIGHT SIDE */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {user ? (
                    <>
                        <Link to="/dashboard" style={linkStyle}>
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>
                        <Link to={`/profile/${user.username}`} style={{ ...linkStyle, color: '#007acc', fontWeight: 'bold' }}>
                            <User size={18} />
                            {user.username}
                        </Link>
                        <button onClick={logout} style={logoutBtnStyle}>
                            <LogOut size={16} />
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" style={linkStyle}>Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
