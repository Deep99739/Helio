import { io } from 'socket.io-client';

export const initSocket = () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
        auth: {
            token: localStorage.getItem('token'),
        },
    };
    return io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', options);
}