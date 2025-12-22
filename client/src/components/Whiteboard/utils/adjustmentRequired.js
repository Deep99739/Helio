import { toolTypes } from "./../constants";

export const adjustmentRequired = (type) =>
  [toolTypes.RECTANGLE, toolTypes.LINE].includes(type);
