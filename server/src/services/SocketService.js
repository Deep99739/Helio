const Y = require('yjs'); // Required for encoding state
const ACTIONS = require('../constants/Actions');
const RoomService = require('./RoomService');
const CollaborationService = require('./CollaborationService');
const logger = require('../utils/logger');


class SocketService {
    constructor() {
        this.io = null;
        this.userSocketMap = {};
        this.globalOnlineUsers = new Map();
    }

    init(io) {
        this.io = io;
        this.io.on('connection', (socket) => this.handleConnection(socket));
    }

    handleConnection(socket) {
        // logger.info('Socket connected: %s', socket.id);

        socket.on(ACTIONS.USER_ONLINE, ({ userId }) => this.handleUserOnline(socket, userId));
        socket.on(ACTIONS.JOIN, (data) => this.handleJoin(socket, data));
        socket.on(ACTIONS.CODE_CHANGE, (data) => this.handleCodeChange(socket, data));
        socket.on(ACTIONS.SYNC_CODE, (data) => this.handleSyncCode(socket, data));
        socket.on(ACTIONS.SYNC_REQUEST, (data) => this.handleSyncRequest(socket, data));

        // Yjs Sync
        socket.on('sync-update', (data) => this.handleSyncUpdate(socket, data));


        // File Events
        socket.on(ACTIONS.FILE_CREATED, (data) => this.handleFileCreated(socket, data));
        socket.on(ACTIONS.FILE_RENAMED, (data) => this.handleFileRenamed(socket, data));
        socket.on(ACTIONS.FILE_DELETED, (data) => this.handleFileDeleted(socket, data));
        socket.on(ACTIONS.FILE_UPDATED, (data) => this.handleFileUpdated(socket, data));

        // Interaction Events
        socket.on(ACTIONS.SEND_MESSAGE, (data) => this.handleSendMessage(socket, data));
        socket.on("ELEMENT-UPDATE", (data) => this.handleWhiteboardUpdate(socket, data));
        socket.on("CURSOR-POSITION", (data) => this.handleCursorPosition(socket, data));

        // WebRTC Signaling
        socket.on(ACTIONS.RTC_OFFER, (data) => this.relayRTC(socket, ACTIONS.RTC_OFFER, data));
        socket.on(ACTIONS.RTC_ANSWER, (data) => this.relayRTC(socket, ACTIONS.RTC_ANSWER, data));
        socket.on(ACTIONS.RTC_ICE_CANDIDATE, (data) => this.relayRTC(socket, ACTIONS.RTC_ICE_CANDIDATE, data));
        socket.on(ACTIONS.MUTE_STATUS_CHANGE, (data) => this.handleMuteStatusChange(socket, data));

        socket.on('disconnecting', () => this.handleDisconnecting(socket));
    }

    handleUserOnline(socket, userId) {
        this.globalOnlineUsers.set(userId, socket.id);
        const onlineUserIds = Array.from(this.globalOnlineUsers.keys());
        this.io.emit(ACTIONS.ONLINE_USERS_UPDATE, onlineUserIds);
    }

    async handleJoin(socket, { roomId, username }) {
        this.userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = this.getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            this.io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                joinedUsername: username,
                socketId: socket.id,
            });
        });

        // Send Initial Yjs State
        const doc = CollaborationService.getDoc(roomId);
        const stateUpdate = Y.encodeStateAsUpdate(doc);
        this.io.to(socket.id).emit('sync-update', stateUpdate);

        // Load state from DB
        try {
            const room = await RoomService.getRoom(roomId);

            // ALWAYS Emit state to unlock client 'isSynced', even if empty
            const files = room?.files || [];
            const boardElements = room?.whiteboardElements || [];

            this.io.to(socket.id).emit(ACTIONS.SYNC_CODE, { files });
            this.io.to(socket.id).emit("ELEMENT-UPDATE", { boardElements });

        } catch (err) {
            console.error("Error loading room state:", err);
            // Fallback: emit empty state if DB fails to prevent client lock
            this.io.to(socket.id).emit(ACTIONS.SYNC_CODE, { files: [] });
            this.io.to(socket.id).emit("ELEMENT-UPDATE", { boardElements: [] });
        }
    }

    handleCodeChange(socket, { roomId, code, fileId }) {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code, fileId });
        RoomService.updateFileContent(roomId, fileId, code).catch(err => console.error(err));
    }

    handleSyncCode(socket, { socketId, files }) {
        this.io.to(socketId).emit(ACTIONS.SYNC_CODE, { files });
    }

    handleSyncRequest(socket, { roomId, socketId }) {
        socket.to(roomId).emit(ACTIONS.SYNC_REQUEST, { socketId });
    }

    handleSyncUpdate(socket, { roomId, update }) {
        CollaborationService.handleUpdate(socket, roomId, update);
    }

    // --- File Operations ---
    handleFileCreated(socket, { roomId, file }) {
        socket.to(roomId).emit(ACTIONS.FILE_CREATED, { file });
        RoomService.createOrUpdateFile(roomId, file).catch(err => console.error(err));
    }

    handleFileUpdated(socket, { roomId, file }) {
        socket.to(roomId).emit(ACTIONS.FILE_UPDATED, { file });
        // Full file update (content + name potentially)
        // For now using createOrUpdateFile which handles upsert, but we should be careful about overwrite.
        // Actually RoomService.createOrUpdateFile handles existing index replacement.
        RoomService.createOrUpdateFile(roomId, file).catch(err => console.error(err));
    }

    handleFileRenamed(socket, { roomId, fileId, name }) {
        socket.to(roomId).emit(ACTIONS.FILE_RENAMED, { fileId, name });
        RoomService.renameFile(roomId, fileId, name).catch(err => console.error(err));
    }

    handleFileDeleted(socket, { roomId, fileId }) {
        socket.to(roomId).emit(ACTIONS.FILE_DELETED, { fileId });
        RoomService.deleteFile(roomId, fileId).catch(err => console.error(err));
    }

    // --- Interaction ---
    async handleSendMessage(socket, { roomId, message, username, time }) {
        // We could move Message DB logic to RoomService too, or MessageService
        // For simplicity keeping here or moving to service inline
        try {
            const RoomMessage = require('../models/RoomMessage');
            const newMessage = new RoomMessage({ roomId, username, message, time });
            await newMessage.save();
            this.io.to(roomId).emit(ACTIONS.RECEIVE_MESSAGE, { username, message, time });
        } catch (err) {
            console.error(err);
        }
    }

    handleWhiteboardUpdate(socket, { boardId, boardElements }) {
        socket.to(boardId).emit("ELEMENT-UPDATE", { boardElements });
        RoomService.updateWhiteboard(boardId, boardElements).catch(err => console.error(err));
    }

    handleCursorPosition(socket, cursorData) {
        socket.to(cursorData.boardId).emit("CURSOR-POSITION", cursorData);
    }

    // --- WebRTC Signaling ---
    relayRTC(socket, action, data) {
        const { targetSocketId } = data;
        if (targetSocketId) {
            this.io.to(targetSocketId).emit(action, {
                ...data,
                senderSocketId: socket.id
            });
        }
    }

    handleMuteStatusChange(socket, { roomId, isMicMuted, isVideoMuted }) {
        socket.to(roomId).emit(ACTIONS.MUTE_STATUS_CHANGE, {
            socketId: socket.id,
            isMicMuted,
            isVideoMuted
        });
    }

    handleDisconnecting(socket) {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: this.userSocketMap[socket.id],
            });
        });

        // Online status update
        let disconUserId = null;
        for (let [uid, sid] of this.globalOnlineUsers.entries()) {
            if (sid === socket.id) {
                disconUserId = uid;
                break;
            }
        }
        if (disconUserId) {
            this.globalOnlineUsers.delete(disconUserId);
            const onlineUserIds = Array.from(this.globalOnlineUsers.keys());
            this.io.emit(ACTIONS.ONLINE_USERS_UPDATE, onlineUserIds);
        }

        delete this.userSocketMap[socket.id];
    }

    getAllConnectedClients(roomId) {
        return Array.from(this.io.sockets.adapter.rooms.get(roomId) || []).map(
            (socketId) => ({
                socketId,
                username: this.userSocketMap[socketId],
            })
        );
    }
}

module.exports = new SocketService();
