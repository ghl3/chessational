export type Color = "w" | "b";

export const getOppositeColor = (color: Color): Color => {
  return color === "w" ? "b" : "w";
};
