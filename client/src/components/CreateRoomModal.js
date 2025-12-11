import React, { useState } from 'react';

const CreateRoomModal = ({ isOpen, onClose, onCreate }) => {
    const [roomName, setRoomName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!roomName.trim()) return;
        onCreate(roomName);
        setRoomName('');
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const modalStyle = {
        backgroundColor: '#252526', // VS Code Dark
        padding: '30px',
        borderRadius: '10px',
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '1px solid #333'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: '#3c3c3c',
        border: '1px solid #555',
        color: 'white',
        borderRadius: '5px',
        marginTop: '10px',
        marginBottom: '20px',
        outline: 'none',
        fontSize: '16px'
    };

    const btnContainerStyle = {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    };

    const btnStyle = {
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px'
    };

    const createBtnStyle = {
        ...btnStyle,
        backgroundColor: '#007acc',
        color: 'white'
    };

    const cancelBtnStyle = {
        ...btnStyle,
        backgroundColor: '#444',
        color: 'white'
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ color: 'white', margin: '0 0 10px 0' }}>Create New Room</h2>
                <form onSubmit={handleSubmit}>
                    <label style={{ color: '#ccc', fontSize: '14px' }}>Room Name</label>
                    <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. Algorithm Practice"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        autoFocus
                    />
                    <div style={btnContainerStyle}>
                        <button type="button" style={cancelBtnStyle} onClick={onClose}>Cancel</button>
                        <button type="submit" style={createBtnStyle}>Create & Join</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomModal;
