import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness'; // Ensure y-protocols is installed
import { Observable } from 'lib0/observable';
import { ACTIONS } from '../config/Actions';

/**
 * Custom Yjs Provider for Socket.io
 * Connects Yjs Doc to our existing Socket.io connection
 */
export class YjsSocketSystem extends Observable {
    constructor(socket, roomId, doc) {
        super();
        this.socket = socket;
        this.roomId = roomId;
        this.doc = doc;
        // 0 = awareness protocol
        this.awareness = new Awareness(doc);

        this.init();
    }

    init() {
        // 1. Listen for updates from server
        this.socket.on('sync-update', (update) => {
            Y.applyUpdate(this.doc, new Uint8Array(update));
        });

        // 2. Listen for local updates and send to server
        this.doc.on('update', (update) => {
            this.socket.emit('sync-update', {
                roomId: this.roomId,
                update: update // Uint8Array
            });
        });

        // 3. Awareness (Cursors) - Simplified
        // We need to implement full awareness sync if we want cursors, but for now just initializing it satisfies bindings.
    }

    destroy() {
        this.socket.off('sync-update');
        this.doc.off('update');
        this.awareness.destroy();
    }
}
