import fetch from './fetch';
const { POSITRON_API_BASE } = process.env;

export default (path) => fetch(`${POSITRON_API_BASE}/${path}`);
