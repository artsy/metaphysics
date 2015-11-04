import request from './request';
const { POSITRON_API_BASE } = process.env;

export default (path) => {
  return request(`${POSITRON_API_BASE}/${path}`);
};
