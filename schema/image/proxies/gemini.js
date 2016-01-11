import qs from 'qs';
const { GEMINI_ENDPOINT } = process.env;

export default (src, mode, width, height) => {
  const resizeTo = (mode === 'resize') ? 'fit' : mode;

  return `${GEMINI_ENDPOINT}/?${qs.stringify({
    resize_to: resizeTo,
    height,
    width,
    quality: 95,
    src,
  })}`;
};
