import fetch from './fetch';
const { POSITRON_API_BASE } = process.env;

export default (path) => {
  return fetch(`${POSITRON_API_BASE}/${path}`);
};
