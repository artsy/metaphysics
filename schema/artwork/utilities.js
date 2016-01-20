import { mapValues } from 'lodash';

export const isDimensional = (value) => parseFloat(value) > 0;

export const isThreeDimensional = ({ dimensions }) => {
  if (!dimensions.cm) return false;
  const { depth, diameter } = dimensions.cm;
  return isDimensional(depth) && isDimensional(diameter);
};

export const isTwoDimensional = ({ dimensions }) => {
  if (!dimensions.cm) return false;
  const { width, height } = dimensions.cm;
  return (
    isDimensional(width) &&
    isDimensional(height) &&
    !isThreeDimensional({ dimensions })
  );
};

export const isTooBig = ({ dimensions }) => {
  const LIMIT_IN_CM = 1500;
  const { width, height } = mapValues(dimensions.cm, parseFloat);
  return width > LIMIT_IN_CM || height > LIMIT_IN_CM;
};
