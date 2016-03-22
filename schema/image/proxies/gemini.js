import qs from 'qs';
import { isEmpty } from 'lodash';
import { isExisty } from '../../../lib/helpers';

const { GEMINI_ENDPOINT } = process.env;

function resizeTo(mode, width, height) {
  if (mode === 'crop') {
    return 'fill';
  } else if (isExisty(width) && isEmpty(height)) {
    return 'width';
  } else if (isExisty(height) && isEmpty(width)) {
    return 'height';
  }
  return 'fit';
}

export default (src, mode, width, height) => {
  const options = {
    resize_to: resizeTo(mode, width, height),
    width,
    height,
    quality: 95,
    src,
  };

  return `${GEMINI_ENDPOINT}/?${qs.stringify(options)}`;
};
