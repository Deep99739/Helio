import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setElements, setToolType } from "./whiteboardSlice";
import {
    MousePointer2,
    Square,
    Circle,
    Type,
    Eraser,
    Pencil,
    Minus,
    Image as ImageIcon,
    FileDown,
    Users,
    StickyNote
} from 'lucide-react';
import { toolTypes } from "./constants";
import { Dialog, DialogActions, DialogContent, DialogTitle, Typography, Button, IconButton } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useNavigate } from "react-router-dom";

const ToolButton = ({ icon: Icon, type, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: isActive ? '#007acc' : 'transparent',
                color: isActive ? '#fff' : '#888',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
            title={type}
        >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </button>
    );
};

const Menu = ({ canvasRef, socket, roomId, color, setColor, lineWidth, setLineWidth }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const selectedToolType = useSelector((state) => state.whiteboard.tool);
    const boardMembers = useSelector((state) => state.whiteboard.activeUsers);

    const [openBoardDetails, setOpenBoardDetails] = useState(false);
    const [openActiveMembers, setOpenActiveMembers] = useState(false);
    const [boardInfo, setBoardInfo] = useState(null);

    const handleToolChange = (type) => {
        dispatch(setToolType(type));
    };

    const handleClearCanvas = () => {
        dispatch(setElements([]));
        // if (socket) socket.emit("WHITEBOARD-CLEAR", roomId); // Logic handled in CustomIconButton before? No, onClear prop.
        // Previously rubber icon triggered clear OR tool select. 
        // User requested Eraser tool now. So I won't clear canvas with Eraser click.
        // Original code had `isRubber ? handleClearCanvas : handleToolChange`. 
        // But in "Eraser Fix" step, we changed rubber to just set ERASER tool. 
        // So I will just set ERASER tool.
        dispatch(setToolType(toolTypes.ERASER));
    };

    // ... Export functions ...
    const exportToImage = () => {
        const canvas = canvasRef.current;
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'canvas-image.png';
        link.click();
    };

    const exportToPDF = () => {
        const canvas = canvasRef.current;
        html2canvas(canvas).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.addImage(imgData, 'PNG', 0, 0);
            pdf.save('canvas.pdf');
        });
    };

    return (
        <>
            {/* 1. Floating Toolbar (Top Center) */}
            <div className="glass-panel" style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                padding: '8px 12px',
                display: 'flex',
                gap: '8px',
                borderRadius: '12px',
            }}>
                <ToolButton
                    icon={MousePointer2}
                    type={toolTypes.SELECTION}
                    isActive={selectedToolType === toolTypes.SELECTION}
                    onClick={() => handleToolChange(toolTypes.SELECTION)}
                />
                <ToolButton
                    icon={Square}
                    type={toolTypes.RECTANGLE}
                    isActive={selectedToolType === toolTypes.RECTANGLE}
                    onClick={() => handleToolChange(toolTypes.RECTANGLE)}
                />
                <ToolButton
                    icon={Circle}
                    type={toolTypes.CIRCLE}
                    isActive={selectedToolType === toolTypes.CIRCLE}
                    onClick={() => handleToolChange(toolTypes.CIRCLE)}
                />
                <ToolButton
                    icon={Minus}
                    type={toolTypes.LINE}
                    isActive={selectedToolType === toolTypes.LINE}
                    onClick={() => handleToolChange(toolTypes.LINE)}
                />
                <ToolButton
                    icon={Pencil}
                    type={toolTypes.PENCIL}
                    isActive={selectedToolType === toolTypes.PENCIL}
                    onClick={() => handleToolChange(toolTypes.PENCIL)}
                />
                <ToolButton
                    icon={Type}
                    type={toolTypes.TEXT}
                    isActive={selectedToolType === toolTypes.TEXT}
                    onClick={() => handleToolChange(toolTypes.TEXT)}
                />
                <ToolButton
                    icon={StickyNote}
                    type={toolTypes.NOTE}
                    isActive={selectedToolType === toolTypes.NOTE}
                    onClick={() => handleToolChange(toolTypes.NOTE)}
                />
                <ToolButton
                    icon={Eraser}
                    type={toolTypes.ERASER}
                    isActive={selectedToolType === toolTypes.ERASER}
                    onClick={() => handleToolChange(toolTypes.ERASER)}
                />
            </div>

            {/* 2. Properties Panel (Left Center) */}
            <div className="glass-panel" style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                transform: 'translateY(-50%)',
                zIndex: 100,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderRadius: '12px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <small style={{ color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Color</small>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{
                            cursor: 'pointer',
                            height: '40px',
                            width: '40px',
                            borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.2)',
                            padding: 0,
                            overflow: 'hidden',
                            background: 'none'
                        }}
                    />
                </div>

                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <small style={{ color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Size</small>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        style={{
                            width: '8px',
                            height: '100px',
                            writingMode: 'bt-lr', /* IE */
                            WebkitAppearance: 'slider-vertical', /* WebKit */
                        }}
                        title={`Size: ${lineWidth}px`}
                    />
                    <small style={{ color: '#fff' }}>{lineWidth}px</small>
                </div>
            </div>

            {/* 3. System Panel (Top Right) */}
            <div className="glass-panel" style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 100,
                padding: '8px',
                display: 'flex',
                gap: '8px',
                borderRadius: '12px',
                alignItems: 'center'
            }}>
                <ToolButton icon={ImageIcon} type="Export Image" onClick={exportToImage} />
                <ToolButton icon={FileDown} type="Export PDF" onClick={exportToPDF} />

                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14, border: '2px solid #1e1e1e' } }} onClick={() => setOpenActiveMembers(true)}>
                    {boardMembers && boardMembers.map((member, index) => (
                        <Avatar key={index} alt={member.firstName}>{member.firstName ? member.firstName.charAt(0) : '?'}</Avatar>
                    ))}
                </AvatarGroup>
            </div>

            {/* Dialogs */}
            <Dialog open={openActiveMembers} onClose={() => setOpenActiveMembers(false)}>
                <DialogTitle>Active Members</DialogTitle>
                <DialogContent>
                    {boardMembers && boardMembers.map((member, index) => (
                        <Typography key={index} variant="body2">{member.username || 'Guest'}</Typography>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenActiveMembers(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Menu;
