import fetch from './fetch';
const { DELTA_API_BASE } = process.env;

export default (path) => fetch(`${DELTA_API_BASE}/${path}`);
