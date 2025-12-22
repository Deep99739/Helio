import { toolTypes } from "./../constants";
import { setElements as setElementsInRedux } from "../whiteboardSlice";
import { createElement } from "./createElement";

export const updatePencilElementWhenMoving = ({ index, newPoints }, elements, emitCallback, setElementsCallback) => {
    let elementsCopy = [...elements];
    elementsCopy[index] = {
        ...elementsCopy[index],
        points: newPoints
    }

    const updatedPencilElement = elementsCopy[index];
    setElementsCallback(elementsCopy);
    if (emitCallback) emitCallback(updatedPencilElement);
}

export const updateElement = ({ id, x1, y1, x2, y2, type, index, text }, elements, emitCallback, setElementsCallback) => {
    const elementsCopy = [...elements];
    switch (type) {
        case toolTypes.LINE:
        case toolTypes.RECTANGLE:
        case toolTypes.CIRCLE:
            const updatedElement = createElement({
                id,
                x1,
                y1,
                x2,
                y2,
                toolType: type,
                stroke: elementsCopy[index].stroke,
                strokeWidth: elementsCopy[index].strokeWidth
            });
            elementsCopy[index] = updatedElement;
            setElementsCallback(elementsCopy);

            if (emitCallback) emitCallback(updatedElement);
            break;
        case toolTypes.PENCIL:
            elementsCopy[index] = {
                ...elementsCopy[index],
                points: [
                    ...elementsCopy[index].points,
                    {
                        x: x2,
                        y: y2
                    }
                ]
            }
            const updatedPencilElement = elementsCopy[index]
            setElementsCallback(elementsCopy)
            if (emitCallback) emitCallback(updatedPencilElement);
            break
        case toolTypes.TEXT:
            const textWidth = document.getElementById("canvas").getContext("2d").measureText(text).width;
            const textHeight = 24;
            elementsCopy[index] = {
                ...createElement({
                    id,
                    x1,
                    y1,
                    x2: x1 + textWidth,
                    y2: y1 + textHeight,
                    toolType: type,
                    text: text === undefined ? elementsCopy[index].text : text,
                    stroke: elementsCopy[index].stroke,
                    strokeWidth: elementsCopy[index].strokeWidth
                })
            }
            const updatedTextElement = elementsCopy[index];
            setElementsCallback(elementsCopy)
            if (emitCallback) emitCallback(updatedTextElement);
            break
        case toolTypes.NOTE:
            elementsCopy[index] = {
                ...createElement({
                    id,
                    x1, y1, x2, y2,
                    toolType: type,
                    text: text === undefined ? elementsCopy[index].text : text,
                    stroke: elementsCopy[index].stroke,
                    strokeWidth: elementsCopy[index].strokeWidth
                })
            }
            const updatedNoteElement = elementsCopy[index];
            setElementsCallback(elementsCopy)
            if (emitCallback) emitCallback(updatedNoteElement);
            break
        default:
            throw new Error('not implemented')
    }
}