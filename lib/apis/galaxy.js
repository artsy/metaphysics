import fetch from './fetch';

const { GALAXY_API_BASE, GALAXY_TOKEN } = process.env;

export default (path) => {
  const headers = {
    Accept: 'application/vnd.galaxy-public+json',
    'Content-Type': 'application/hal+json',
    'Http-Authorization': GALAXY_TOKEN,
  };
  return fetch(`${GALAXY_API_BASE}/${path}`, { headers });
};
