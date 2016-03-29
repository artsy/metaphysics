export const isDimensional = (value) => parseFloat(value) > 0;

export const isThreeDimensional = ({ depth, diameter }) => {
  return isDimensional(depth) || isDimensional(diameter);
};

export const isTwoDimensional = ({ width, height, depth, diameter }) => {
  return (
    isDimensional(width) &&
    isDimensional(height) &&
    !isThreeDimensional({ depth, diameter })
  );
};

export const isTooBig = ({ width, height, metric }) => {
  const LIMIT = { in: 600, cm: 1524 }; // 50 feet
  return (
    parseFloat(width) > LIMIT[metric] ||
    parseFloat(height) > LIMIT[metric]
  );
};
