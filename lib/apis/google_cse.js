import fetch from './fetch';
const { GOOGLE_CSE_API_BASE } = process.env;

export default (path) => fetch(`${GOOGLE_CSE_API_BASE}/${path}`);
