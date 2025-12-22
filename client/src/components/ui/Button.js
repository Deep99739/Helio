import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, ...props }) => {

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'var(--accent-blue)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 0 15px rgba(88, 166, 255, 0.3)',
                };
            case 'secondary':
                return {
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: 'none',
                };
            case 'danger':
                return {
                    background: 'rgba(248, 113, 113, 0.1)',
                    color: 'var(--accent-red)',
                    border: '1px solid var(--accent-red)',
                };
            default:
                return {};
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm': return { padding: '6px 12px', fontSize: '0.85rem' };
            case 'md': return { padding: '10px 20px', fontSize: '1rem' };
            case 'lg': return { padding: '14px 28px', fontSize: '1.1rem' };
            default: return {};
        }
    };

    const styles = {
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-ui)',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...getVariantStyles(),
        ...getSizeStyles(),
    };

    return (
        <button
            className={`ui-btn ${className}`}
            onClick={onClick}
            style={styles}
            {...props}
        >
            <style jsx>{`
            .ui-btn:hover {
                transform: translateY(-1px);
                filter: brightness(1.1);
            }
            .ui-btn:active {
                transform: translateY(0);
            }
        `}</style>
            {children}
        </button>
    );
};

export default Button;
