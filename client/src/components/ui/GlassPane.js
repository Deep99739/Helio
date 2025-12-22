import React from 'react';
import '../../styles/tokens.css'; // Ensure tokens are available if not imported globally yet

const GlassPane = ({ children, className = '', hoverEffect = false, ...props }) => {
    const baseStyle = {
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    };

    return (
        <div
            className={`glass-pane ${className}`}
            style={baseStyle}
            {...props}
        >
            <style jsx>{`
        .glass-pane:hover {
          transform: ${hoverEffect ? 'translateY(-2px)' : 'none'};
          box-shadow: ${hoverEffect ? 'var(--shadow-glow)' : 'var(--shadow-lg)'};
          border-color: ${hoverEffect ? 'var(--border-active)' : 'var(--glass-border)'};
        }
      `}</style>
            {children}
        </div>
    );
};

export default GlassPane;
