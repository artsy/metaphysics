import {
  pick,
  values,
  first,
  assign,
  compact,
  flow,
  includes,
  last,
  isArray,
  isString,
  has,
} from 'lodash';

export const grab = flow(pick, values, first);

export const setVersion = (image, version) => {
  if (has(image, ['image_urls', version])) return image.image_urls[version];
  if (!includes(image.image_url, ':version')) return image.image_url;

  let size = version;
  if (!includes(image.image_versions, version)) {
    size = last(image.image_versions);
  }
  return image.image_url.replace(':version', size);
};

const normalizeImageUrl = (image) => {
  const image_url = grab(image, ['url', 'image_url']);
  if (!image_url) return null;
  return assign({ image_url }, image);
};

const normalizeImageVersions = (image) => {
  if (image && !includes(image.image_url, ':version')) return image;

  const image_versions = grab(image, ['versions', 'image_versions']);
  if (!image_versions) return null;
  return assign({ image_versions }, image);
};

const normalizeBareUrls = (image) => {
  if (isString(image)) {
    return { image_url: image };
  }
  return image;
};

const normalize = flow(
  normalizeBareUrls,
  normalizeImageUrl,
  normalizeImageVersions
);

export default (response) => {
  if (isArray(response)) return compact(response.map(normalize));
  return normalize(response);
};
