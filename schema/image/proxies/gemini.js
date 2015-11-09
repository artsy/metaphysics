import qs from 'qs';

const { GEMINI_ENDPOINT } = process.env;

export default (src, mode, width, height) => `${GEMINI_ENDPOINT}/?${qs.stringify({
  resize_to: mode,
  height: height,
  width: width,
  quality: 95,
  src: src
})}`;
