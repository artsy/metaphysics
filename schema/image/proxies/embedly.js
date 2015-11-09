import qs from 'qs';

const {
  EMBEDLY_KEY,
  EMBEDLY_ENDPOINT
} = process.env;

export default (src, mode, width, height) => {
  let options = {
    resize: {
      grow: false,
      url: src,
      width: width,
      height: height,
      key: EMBEDLY_KEY,
      quality: 95
    },

    crop: {
      url: src,
      width: width,
      height: height,
      key: EMBEDLY_KEY,
      quality: 95
    },
  };

  return `${EMBEDLY_ENDPOINT}/${mode}?${qs.stringify(options[mode])}`;
};
