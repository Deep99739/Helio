import React from 'react';
import Avatar, { genConfig } from 'react-nice-avatar';
import { X } from 'lucide-react';

const ImagePickerModal = ({ isOpen, onClose, onSave, type = 'avatar' }) => {
    // Predefined Configurations
    const avatarPresets = React.useMemo(() => Array.from({ length: 12 }).map(() => genConfig()), []);
    const coverPresets = [
        'linear-gradient(to right, #007acc, #6366f1)',
        'linear-gradient(to right, #10b981, #3b82f6)',
        'linear-gradient(to right, #f43f5e, #f59e0b)',
        'linear-gradient(to right, #8b5cf6, #ec4899)',
        'linear-gradient(to right, #1e293b, #0f172a)', // Dark
        'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
    ];

    const handleSelect = (item) => {
        // Return format: { type: 'preset' | 'generated', value: ... }
        if (type === 'avatar') {
            onSave({ type: 'generated', value: JSON.stringify(item) });
        } else {
            onSave({ type: 'preset', value: item });
        }
        onClose();
    };

    if (!isOpen) return null;

    // Styles
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(5px)'
    };

    const modalStyle = {
        backgroundColor: '#1e1e1e',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '500px',
        padding: '24px',
        border: '1px solid #333',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: type === 'avatar' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '4px' // prevent cut-off focus rings
    };

    const itemStyle = {
        cursor: 'pointer',
        border: '3px solid transparent',
        borderRadius: type === 'avatar' ? '50%' : '8px',
        overflow: 'hidden',
        transition: 'all 0.2s',
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, color: 'white' }}>Choose {type === 'avatar' ? 'Avatar' : 'Cover Photo'}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={gridStyle}>
                    {type === 'avatar' ? (
                        avatarPresets.map((config, idx) => (
                            <div
                                key={idx}
                                style={itemStyle}
                                className="hover:scale-105 hover:opacity-100 opacity-90"
                                onClick={() => handleSelect(config)}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent'; }}
                            >
                                <Avatar style={{ width: '100%', height: '100%' }} {...config} />
                            </div>
                        ))
                    ) : (
                        coverPresets.map((bg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    ...itemStyle,
                                    height: '80px',
                                    background: bg
                                }}
                                onClick={() => handleSelect(bg)}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent'; }}
                            />
                        ))
                    )}
                </div>

                <div style={{ marginTop: '15px', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    Click an option to select
                </div>
            </div>
        </div>
    );
};

export default ImagePickerModal;
