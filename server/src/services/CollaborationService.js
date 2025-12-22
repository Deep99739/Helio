const Y = require('yjs');
// const { LeveldbPersistence } = require('y-leveldb'); // Optional: for persistence
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');

/**
 * CollaborationService
 * Manages Yjs Docs for Real-time Collaboration (CRDTs)
 */
class CollaborationService {
    constructor() {
        this.docs = new Map(); // roomId -> Y.Doc
    }

    /**
     * Get or create a Y.Doc for a room
     */
    getDoc(roomId) {
        if (!this.docs.has(roomId)) {
            const doc = new Y.Doc();
            doc.gc = true; // Garbage collection enabled
            this.docs.set(roomId, doc);
            return doc;
        }
        return this.docs.get(roomId);
    }

    /**
     * Handle generic Yjs update message from client
     * Message format: [type, ...payload]
     * We use a custom protocol over Socket.io:
     * event: 'sync-update'
     * payload: Uint8Array (binary)
     */
    handleUpdate(socket, roomId, update) {
        const doc = this.getDoc(roomId);

        // Apply update to the doc
        Y.applyUpdate(doc, new Uint8Array(update));

        // In a real websocket setup, y-websocket would handle broadcasting.
        // Here we must manually broadcast the *update* to all other clients in the room.
        // Optimization: The 'update' received is a diff. We just forward it.
        socket.to(roomId).emit('sync-update', update);
    }
}

module.exports = new CollaborationService();
