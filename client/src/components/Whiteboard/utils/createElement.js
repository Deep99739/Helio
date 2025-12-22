import { toolTypes } from "./../constants";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

const generateRectangle = ({ x1, y1, x2, y2, stroke, strokeWidth }) => {
  return generator.rectangle(x1, y1, x2 - x1, y2 - y1, { stroke, strokeWidth, roughness: 0 });
};

const generateCircle = ({ x1, y1, x2, y2, stroke, strokeWidth }) => {
  return generator.circle(x1, y1, Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)), { stroke, strokeWidth, roughness: 0 });
}

const generateLine = ({ x1, y1, x2, y2, stroke, strokeWidth }) => {
  return generator.line(x1, y1, x2, y2, { stroke, strokeWidth, roughness: 0 });
}

export const createElement = ({ x1, y1, x2, y2, toolType, id, text, stroke, strokeWidth }) => {
  let roughElement;

  switch (toolType) {
    case toolTypes.RECTANGLE:
      roughElement = generateRectangle({ x1, y1, x2, y2, stroke, strokeWidth });
      return {
        id: id,
        roughElement,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        stroke,
        strokeWidth,
      };
    case toolTypes.LINE:
      roughElement = generateLine({ x1, y1, x2, y2, stroke, strokeWidth });
      return {
        id: id,
        roughElement,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        stroke,
        strokeWidth,
      };
    case toolTypes.PENCIL:
      return {
        id,
        type: toolType,
        points: [{ x: x1, y: y1 }],
        stroke,
        strokeWidth,
      }
    case toolTypes.TEXT:
      return {
        id,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        text: text || "",
        stroke,
        strokeWidth,
      }
    case toolTypes.CIRCLE:
      roughElement = generateCircle({ x1, y1, x2, y2, stroke, strokeWidth });
      return {
        id: id,
        roughElement,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        stroke,
        strokeWidth,
      };
    case toolTypes.NOTE:
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
        fill: '#fff740',
        fillStyle: 'solid',
        stroke: '#c7c136',
        strokeWidth: 1,
        roughness: 0
      });
      return {
        id,
        roughElement,
        type: toolType,
        x1, y1, x2, y2,
        text: text || "",
        stroke: '#000000', // Text color
      };
    default:
      throw new Error("Something went wrong when creating element");
  }
};
