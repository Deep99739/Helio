import React from 'react';

const Layout = ({ children }) => {
    const layoutStyle = {
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0f0f11', // Deep dark background
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
    };

    const gradientStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f0f11 50%)',
        zIndex: 0,
        pointerEvents: 'none' // Ensure clicks pass through to content
    };

    const gridStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        zIndex: 0,
        pointerEvents: 'none'
    };

    const contentStyle = {
        position: 'relative',
        zIndex: 1 // Content goes above background
    };

    return (
        <div style={layoutStyle}>
            <div style={gradientStyle}></div>
            <div style={gridStyle}></div>
            <div style={contentStyle}>
                {children}
            </div>
        </div>
    );
};

export default Layout;
