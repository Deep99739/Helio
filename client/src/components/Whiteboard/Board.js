import React, { useRef, useLayoutEffect, useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Menu from "./Menu";
import rough from "roughjs/bundled/rough.esm";
import { actions, cursorPositions, toolTypes } from "./constants";
import {
    createElement,
    updateElement,
    drawElement,
    adjustmentRequired,
    adjustElementCoordinates,
    getElementAtPosition,
    getCursorForPosition,
    getResizedCoordinates,
    updatePencilElementWhenMoving,
} from "./utils";
import { v4 as uuid } from "uuid";
import { updateElement as updateElementInStore, setElements as setElementsInStore } from "./whiteboardSlice";
import { updateCursorPosition } from "./CursorOverlay/CursorOverlay/cursorSlice";

const Whiteboard = ({ socket, roomId, user, active }) => {
    const canvasRef = useRef();
    const textAreaRef = useRef();

    const toolType = useSelector((state) => state.whiteboard.tool);

    const [elements, setElements] = useState([]);
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // Prevents overwriting server data with empty local state on load
    const [isSynced, setIsSynced] = useState(false);

    const [action, setAction] = useState(null);
    const [selectedElement, setSelectedElement] = useState(null);

    // Style State
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);

    const dispatch = useDispatch();

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Infinite Canvas & Zoom State
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // --- UNDO / REDO ---
    const saveHistory = (currentElements) => {
        const snapshot = JSON.stringify(currentElements);
        setHistory(prev => [...prev, snapshot]);
        setRedoStack([]);
    };

    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const previousSnapshot = history[history.length - 1];
        const newHistory = history.slice(0, history.length - 1);
        setHistory(newHistory);
        setRedoStack(prev => [JSON.stringify(elements), ...prev]);

        const restoredElements = JSON.parse(previousSnapshot);
        setElements(restoredElements);
        dispatch(setElementsInStore(restoredElements));
        emitBoardElements(restoredElements);
    }, [elements, history, dispatch]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const nextSnapshot = redoStack[0];
        const newRedoStack = redoStack.slice(1);
        setRedoStack(newRedoStack);
        setHistory(prev => [...prev, JSON.stringify(elements)]);

        const restoredElements = JSON.parse(nextSnapshot);
        setElements(restoredElements);
        dispatch(setElementsInStore(restoredElements));
        emitBoardElements(restoredElements);
    }, [elements, redoStack, dispatch]);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === "Space") {
                setIsSpacePressed(true);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
            // Zoom Shortcuts
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                setScale(s => Math.min(s + 0.1, 5));
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                setScale(s => Math.max(s - 0.1, 0.1));
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                setScale(1);
                setOffset({ x: 0, y: 0 });
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === "Space") {
                setIsSpacePressed(false);
            }
        };

        if (!active) return; // Don't listen if not active

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleUndo, handleRedo, active]);

    useLayoutEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });

        if (canvasRef.current?.parentElement) {
            resizeObserver.observe(canvasRef.current.parentElement);
        }

        return () => resizeObserver.disconnect();
    }, []);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || containerSize.width === 0) return;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        const roughCanvas = rough.canvas(canvas);

        if (elements && elements.forEach) {
            (elements || []).forEach((element) => {
                drawElement({ roughCanvas, context: ctx, element });
            });
        }

        ctx.restore();
    }, [elements, containerSize, offset, scale]);

    useEffect(() => {
        if (!socket) return;
        const handleElementUpdate = ({ boardElements }) => {
            if (Array.isArray(boardElements)) {
                setElements(boardElements);
                dispatch(setElementsInStore(boardElements));
                setIsSynced(true); // We have received truth from server
            }
        };
        const handleWhiteboardClear = () => {
            setElements([]);
            dispatch(setElementsInStore([]));
        };
        const handleCursorPosition = (cursorData) => {
            dispatch(updateCursorPosition(cursorData));
        };
        socket.on("ELEMENT-UPDATE", handleElementUpdate);
        socket.on("WHITEBOARD-CLEAR", handleWhiteboardClear);
        socket.on("CURSOR-POSITION", handleCursorPosition);
        return () => {
            socket.off("ELEMENT-UPDATE", handleElementUpdate);
            socket.off("WHITEBOARD-CLEAR", handleWhiteboardClear);
            socket.off("CURSOR-POSITION", handleCursorPosition);
        };
    }, [socket, dispatch]);

    const emitBoardElements = (newElements) => {
        if (!isSynced) return; // Database safety lock
        if (socket && roomId) {
            socket.emit("ELEMENT-UPDATE", { boardId: roomId, boardElements: newElements });
        }
    };

    const getRelativeCoordinates = (event) => {
        const { clientX, clientY } = event;
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (clientX - rect.left - offset.x) / scale,
                y: (clientY - rect.top - offset.y) / scale,
                clientX,
                clientY
            };
        }
        return {
            x: (clientX - offset.x) / scale,
            y: (clientY - offset.y) / scale,
            clientX,
            clientY
        };
    };

    const emitCursor = (x, y) => {
        if (!isSynced) return; // Database safety lock
        if (socket && roomId && user) {
            socket.emit("CURSOR-POSITION", {
                boardId: roomId,
                x,
                y,
                userId: user.userId || user.id || 1234,
                username: user.username || "Guest"
            });
        }
    };

    const handleMouseDown = (event) => {
        const { x, y } = getRelativeCoordinates(event);

        if (isSpacePressed || event.button === 1) {
            setIsPanning(true);
            return;
        }

        if (selectedElement && action === actions.WRITING) return;

        if (!isSpacePressed && event.button !== 1 && toolType !== toolTypes.SELECTION) {
            saveHistory(elements);
        } else if (toolType === toolTypes.SELECTION) {
            const element = getElementAtPosition(x, y, elements);
            if (element) saveHistory(elements);
        }

        switch (toolType) {
            case toolTypes.RECTANGLE:
            case toolTypes.LINE:
            case toolTypes.CIRCLE:
            case toolTypes.PENCIL:
            case toolTypes.ERASER: {
                const strokeColor = toolType === toolTypes.ERASER ? '#ffffff' : color;
                const strokeWidth = toolType === toolTypes.ERASER ? lineWidth * 2 : lineWidth;
                const elementToolType = toolType === toolTypes.ERASER ? toolTypes.PENCIL : toolType;

                const id = uuid();
                const element = createElement({
                    x1: x, y1: y, x2: x, y2: y,
                    toolType: elementToolType,
                    id,
                    stroke: strokeColor,
                    strokeWidth: strokeWidth
                });

                setAction(actions.DRAWING);
                setSelectedElement(element);
                setElements(prev => [...prev, element]);
                break;
            }
            case toolTypes.TEXT: {
                const id = uuid();
                const element = createElement({
                    x1: x, y1: y, x2: x, y2: y,
                    toolType,
                    id,
                    stroke: color,
                    strokeWidth: lineWidth
                });

                setAction(actions.WRITING);
                setSelectedElement(element);
                setElements(prev => [...prev, element]);
                break;
            }
            case toolTypes.NOTE: {
                const id = uuid();
                const noteSize = 200;
                // Center the note on click? Or top-left
                const element = createElement({
                    x1: x, y1: y, x2: x + noteSize, y2: y + noteSize,
                    toolType,
                    id,
                    stroke: color,
                    strokeWidth: lineWidth
                });
                // Note: createElement for NOTE uses fixed props for visuals, but we pass color anyway.

                setAction(actions.WRITING);
                setSelectedElement(element);
                setElements(prev => [...prev, element]);
                break;
            }
            case toolTypes.SELECTION: {
                const element = getElementAtPosition(x, y, elements);
                if (element &&
                    (element.type === toolTypes.RECTANGLE
                        || element.type === toolTypes.TEXT
                        || element.type === toolTypes.LINE
                        || element.type === toolTypes.NOTE)) { // Add NOTE to selectable

                    if (element.position === cursorPositions.INSIDE) {
                        setAction(actions.MOVING);
                    } else {
                        setAction(actions.RESIZING);
                    }

                    const offsetX = x - element.x1;
                    const offsetY = y - element.y1;

                    setSelectedElement({ ...element, offsetX, offsetY });
                }

                if (element && element.type === toolTypes.PENCIL) {
                    setAction(actions.MOVING);
                    const xOffsets = element.points.map(point => x - point.x);
                    const yOffsets = element.points.map(point => y - point.y);
                    setSelectedElement({ ...element, xOffsets, yOffsets });
                }
                break;
            }
            default:
        }
    };

    // Wrapper to fix 'e' not defined error in handleMouseDown above if I missed it
    const handleMouseDownWrapped = (e) => {
        handleMouseDown(e);
    };

    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        const selectedElementIndex = elements.findIndex(
            (el) => el.id === selectedElement?.id
        );

        if (selectedElementIndex !== -1) {
            if (action === actions.DRAWING || action === actions.RESIZING) {
                if (adjustmentRequired(elements[selectedElementIndex].type)) {
                    const { x1, y1, x2, y2 } = adjustElementCoordinates(
                        elements[selectedElementIndex]
                    );

                    updateElement(
                        {
                            id: selectedElement.id,
                            index: selectedElementIndex,
                            x1, x2, y1, y2,
                            type: elements[selectedElementIndex].type,
                        },
                        elements,
                        null,
                        setElements
                    );
                }
            }
        }

        if (action === actions.DRAWING || action === actions.RESIZING || action === actions.MOVING) {
            emitBoardElements(elements);
        }

        setAction(null);
        setSelectedElement(null);
    };

    const handleMouseMove = (event) => {
        if (isPanning) {
            const { movementX, movementY } = event;
            setOffset((prev) => ({
                x: prev.x + movementX,
                y: prev.y + movementY
            }));
            return;
        }

        const { x, y } = getRelativeCoordinates(event);
        emitCursor(x, y);

        if (action === actions.DRAWING) {
            const index = elements.findIndex((el) => el.id === selectedElement.id);
            // Don't resize NOTE when drawing? 
            // NOTE is fixed size on creation.
            // Text drag-draws? No.
            // Only RECTANGLE/LINE etc drag-draw.
            if (selectedElement.type === toolTypes.NOTE) {
                // Do nothing. It's fixed size.
                // Or maybe allow resizing if we want drag-to-size? 
                // For simplified "Sticky Note", click -> appears.
                return;
            }

            if (index !== -1) {
                updateElement(
                    {
                        index,
                        id: elements[index].id,
                        x1: elements[index].x1,
                        y1: elements[index].y1,
                        x2: x,
                        y2: y,
                        type: elements[index].type,
                    },
                    elements,
                    emitBoardElements,
                    setElements
                );
            }
        }

        if (toolType === toolTypes.SELECTION) {
            const element = getElementAtPosition(x, y, elements);
            if (event.target) event.target.style.cursor = element ? getCursorForPosition(element.position) : "default";
        }

        if (selectedElement && toolType === toolTypes.SELECTION && action === actions.MOVING && selectedElement.type === toolTypes.PENCIL) {
            const newPoints = selectedElement.points.map((_, index) => ({
                x: x - selectedElement.xOffsets[index],
                y: y - selectedElement.yOffsets[index],
            }))

            const index = elements.findIndex((element) => element.id === selectedElement.id);
            if (index !== -1) {
                updatePencilElementWhenMoving({ index, newPoints }, elements, emitBoardElements, setElements)
            }
            return;
        }

        if (toolType === toolTypes.SELECTION && action === actions.MOVING && selectedElement) {
            const { id, x1, x2, y1, y2, type, offsetX, offsetY, text } = selectedElement;
            const width = x2 - x1;
            const height = y2 - y1;
            const newX1 = x - offsetX;
            const newY1 = y - offsetY;

            const index = elements.findIndex((element) => element.id === selectedElement.id);
            if (index !== -1) {
                updateElement({
                    id, x1: newX1, y1: newY1, x2: newX1 + width, y2: newY1 + height,
                    type, index, text
                }, elements, emitBoardElements, setElements)
            }
        }

        if (toolType === toolTypes.SELECTION && action === actions.RESIZING && selectedElement) {
            const { id, type, position, ...coordinates } = selectedElement;
            const { x1, y1, x2, y2 } = getResizedCoordinates(x, y, position, coordinates);

            const selectedElementIndex = elements.findIndex((element) => element.id === selectedElement.id);
            if (selectedElementIndex !== -1) {
                updateElement({
                    x1, x2, y1, y2,
                    type: selectedElement.type,
                    id: selectedElement.id,
                    index: selectedElementIndex
                }, elements, emitBoardElements, setElements);
            }
        }
    };

    const handleTextAreaBlur = (event) => {
        const { id, x1, y1, type } = selectedElement;
        const index = elements.findIndex((element) => element.id === selectedElement.id)
        if (index !== -1) {
            updateElement({ id, x1, y1, type, text: event.target.value, index }, elements, emitBoardElements, setElements)
            setAction(null)
            setSelectedElement(null)
        }
    }

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            const zoomSensitivity = 0.1;
            const delta = -Math.sign(e.deltaY) * zoomSensitivity;
            const newScale = Math.min(Math.max(scale + delta, 0.1), 5);

            const rect = canvasRef.current.getBoundingClientRect();
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;

            const worldX = (pointerX - offset.x) / scale;
            const worldY = (pointerY - offset.y) / scale;

            const newOffsetX = pointerX - worldX * newScale;
            const newOffsetY = pointerY - worldY * newScale;

            setScale(newScale);
            setOffset({ x: newOffsetX, y: newOffsetY });
        } else {
            setOffset((prev) => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Menu
                canvasRef={canvasRef}
                socket={socket}
                roomId={roomId}
                color={color}
                setColor={setColor}
                lineWidth={lineWidth}
                setLineWidth={setLineWidth}
            />

            <div style={{
                position: 'absolute',
                bottom: '15px',
                left: '15px',
                background: 'rgba(30,30,30,0.8)',
                color: '#fff',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                zIndex: 100,
                pointerEvents: 'none',
                fontFamily: 'monospace'
            }}>
                {Math.round(scale * 100)}%
            </div>

            {action === actions.WRITING && selectedElement ?
                <textarea
                    ref={textAreaRef}
                    onBlur={handleTextAreaBlur}
                    style={{
                        position: "absolute",
                        top: selectedElement.type === toolTypes.NOTE ? (selectedElement.y1 * scale) + offset.y + (10 * scale) : (selectedElement.y1 * scale) + offset.y - (2 * scale),
                        left: selectedElement.type === toolTypes.NOTE ? (selectedElement.x1 * scale) + offset.x + (10 * scale) : (selectedElement.x1 * scale) + offset.x,
                        font: selectedElement.type === toolTypes.NOTE ? `${16 * scale}px sans-serif` : `${24 * scale}px sans-serif`,
                        margin: 0,
                        padding: 0,
                        border: "1px dotted black",
                        outline: 0,
                        resize: "auto",
                        overflow: "hidden",
                        whiteSpace: 'pre',
                        background: 'transparent',
                        zIndex: 20,
                        width: selectedElement.type === toolTypes.NOTE ? (selectedElement.x2 - selectedElement.x1 - 20) * scale : undefined,
                        height: selectedElement.type === toolTypes.NOTE ? (selectedElement.y2 - selectedElement.y1 - 20) * scale : undefined,
                        minHeight: '100px',
                        minWidth: '100px'
                    }} /> :
                null}
            <canvas
                id="canvas"
                onMouseDown={handleMouseDownWrapped}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                ref={canvasRef}
                width={containerSize.width}
                height={containerSize.height}
                style={{ display: 'block' }}
            />
        </div>
    );
};

export default Whiteboard;
