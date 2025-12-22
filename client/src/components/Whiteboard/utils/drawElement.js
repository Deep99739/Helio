import { toolTypes } from "./../constants";
import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke } from ".";

const drawPencilElement = (context, element) => {
  const myStroke = getStroke(element.points, {
    size: element.strokeWidth || 3,
  })

  const pathData = getSvgPathFromStroke(myStroke)
  const myPath = new Path2D(pathData)

  context.fillStyle = element.stroke || "#000000";
  context.fill(myPath);
}

const drawTextElement = (context, element) => {
  context.textBaseline = "top";
  context.font = '24px sans-serif';
  context.fillStyle = element.stroke || "#000000";
  context.fillText(element.text, element.x1, element.y1);
}

const drawNoteElement = (roughCanvas, context, element) => {
  // Draw background
  roughCanvas.draw(element.roughElement);

  // Draw Text
  context.textBaseline = "top";
  context.font = '16px sans-serif'; // Smaller for notes
  context.fillStyle = "#000000";

  // Simple wrapping or just draw?
  // Let's do basic padding
  const padding = 10;
  // Split lines manually for now if needed, but standard text area writes plain text.
  // We'll just draw it. If it overflows, it overflows.
  // Users press enter for new lines.

  const lines = element.text.split('\n');
  let yOffset = element.y1 + padding;

  lines.forEach(line => {
    context.fillText(line, element.x1 + padding, yOffset);
    yOffset += 20; // Line height
  });
}

export const drawElement = ({ roughCanvas, context, element }) => {
  switch (element.type) {
    case toolTypes.RECTANGLE:
    case toolTypes.LINE:
    case toolTypes.CIRCLE:
      return roughCanvas.draw(element.roughElement);
    case toolTypes.NOTE:
      drawNoteElement(roughCanvas, context, element);
      break;
    case toolTypes.PENCIL:
      drawPencilElement(context, element);
      break
    case toolTypes.TEXT:
      drawTextElement(context, element);
      break
    default:
      console.warn("Unknown element type:", element.type);
    // throw new Error("Something went wrong when drawing element");
  }
};
