const Room = require('../models/Room');

/**
 * Service to handle Room Business Logic
 * "Single Responsibility Principle" - This class only cares about Room Data.
 */
class RoomService {
    constructor() {
        // Future: Inject DB Repository here for loose coupling
    }

    async getRoom(roomId) {
        try {
            return await Room.findOne({ roomId });
        } catch (error) {
            logger.error('Error getting room %s: %s', roomId, error.message);
            throw error;
        }
    }

    async createOrUpdateFile(roomId, file) {
        // "Upsert" logic
        const room = await Room.findOne({ roomId });
        if (!room) {
            // Create room on fly if needed
            const newRoom = new Room({
                roomId,
                files: [file],
                name: 'Untitled Room' // Default name to satisfy required field
            });
            await newRoom.save();
            return;
        }

        const existingFileIndex = room.files.findIndex(f => f.id === file.id);
        if (existingFileIndex !== -1) {
            room.files[existingFileIndex] = file;
        } else {
            room.files.push(file);
        }

        // Legacy data fix: Ensure name exists
        if (!room.name) {
            room.name = 'Untitled Room';
        }

        await room.save();
    }

    async updateFileContent(roomId, fileId, content) {
        return await Room.updateOne(
            { roomId, "files.id": fileId },
            { $set: { "files.$.content": content } }
        );
    }

    async renameFile(roomId, fileId, newName) {
        return await Room.updateOne(
            { roomId, "files.id": fileId },
            { $set: { "files.$.name": newName } }
        );
    }

    async deleteFile(roomId, fileId) {
        return await Room.updateOne(
            { roomId },
            { $pull: { files: { id: fileId } } }
        );
    }

    async updateWhiteboard(roomId, elements) {
        return await Room.updateOne(
            { roomId },
            { $set: { whiteboardElements: elements } },
            { upsert: true } // Create if doesn't exist
        );
    }
}

module.exports = new RoomService();
