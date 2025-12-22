import { cursorPositions } from "./../constants";

export const getResizedCoordinates = (clientX, clientY, position, coordinates) => {
    const {x1, y1, x2, y2} = coordinates;
    switch(position){
        case cursorPositions.START:
        case cursorPositions.TOP_LEFT:
            return {x1: clientX, y1: clientY, x2, y2}
        case cursorPositions.TOP_RIGHT:
            return {x1, y1: clientY, x2: clientX, y2}
        case cursorPositions.BOTTOM_LEFT:
            return {x1: clientX, y1, x2, y2: clientY}
        case cursorPositions.END:
        case cursorPositions.BOTTOM_RIGHT:
            return {x1, y1, x2: clientX, y2: clientY}
        default:
            return null;
    }
}