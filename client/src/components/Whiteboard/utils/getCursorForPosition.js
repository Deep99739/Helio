import { cursorPositions } from "./../constants";

export const getCursorForPosition = (position) => {
    switch(position) {
        case cursorPositions.TOP_LEFT:
        case cursorPositions.BOTTOM_RIGHT:
        case cursorPositions.START:
        case cursorPositions.END:
            return 'nwse-resize'
        case cursorPositions.TOP_RIGHT:
        case cursorPositions.BOTTOM_LEFT:
            return 'nesw-resize'
        default:
            return 'move'
    }
}