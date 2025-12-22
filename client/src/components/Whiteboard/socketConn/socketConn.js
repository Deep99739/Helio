import { io } from 'socket.io-client'
// import { store } from '../store/store';
import { addActiveUserToBoard, removeActiveUserFromBoard, setElements, updateElement } from '../whiteboardSlice';
import { removeCursorPosition, updateCursorPosition } from '../CursorOverlay/cursorSlice';

let socket;

export const connectWithSocketServer = (boardId) => {
    const userId = localStorage.getItem('userId')

    socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        query: {
            userId,
            boardId
        }
    })

    socket.on('connect', () => {
        console.log('connected to socket io server');
    })

    socket.on('BOARD_ELEMENTS', (element_data) => {
        console.log(`BOARD_ELEMENTS : ${element_data}`);
        // store.dispatch(setElements(JSON.parse(element_data)));
    })

    socket.on('USER_BOARD_JOINED', (event_data) => {
        console.log(`USER_BOARD_JOINED`);
        // store.dispatch(addActiveUserToBoard(event_data['user']));
    })

    socket.on('USER_BOARD_LEAVE', (event_data) => {
        console.log(`USER_BOARD_LEAVE`);
        console.log(event_data);
        // store.dispatch(removeActiveUserFromBoard(event_data['user']));
        // store.dispatch(removeCursorPosition(event_data['user']._id))
    })

    socket.on("ELEMENT-UPDATE", (eventData) => {
        const { boardElements } = eventData;
        // store.dispatch(updateElement(boardElements));
    })

    socket.on("WHITEBOARD-CLEAR", () => {
        console.log(`WHITEBOARD-CLEAR received`);
        // store.dispatch(setElements([]));
    })

    socket.on("CURSOR-POSITION", (cursorData) => {
        // store.dispatch(updateCursorPosition(cursorData))
    })

}

export const emitElementUpdate = (elementData) => {
    const eventData = {
        "boardId": localStorage.getItem('boardId'),
        "boardElements": elementData
    }
    socket.emit("ELEMENT-UPDATE", eventData);
}

export const emitClearWhiteboard = () => {
    const boardId = localStorage.getItem('boardId');
    socket.emit("WHITEBOARD-CLEAR", boardId);
}

export const emitCursorPosition = (cursorData) => {
    const { x, y } = cursorData;
    const eventData = {
        x,
        y,
        username: localStorage.getItem('username'),
        boardId: localStorage.getItem('boardId'),
        userId: localStorage.getItem('userId')
    }
    socket.emit("CURSOR-POSITION", eventData)
}

export const disconnectSocketConnection = () => {
    console.log(`disconnect socket connection called!!!`);
    socket.disconnect();
}
