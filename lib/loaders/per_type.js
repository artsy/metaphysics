import gravity from '../apis/gravity';
import { toKey } from '../helpers';
import httpLoader from './http';

// TODO As we’re currently re-using the http loader as it was, it won’t support batching yet.
//      We should rework that once we’ve changed all resolve functions to only use per-type loaders.
const gravityLoader = () => httpLoader(gravity);

const artistArtworksLoader = () => {
  const loader = gravityLoader();
  return (id, params) => {
    const key = toKey(`artist/${id}/artworks`, params);
    return loader.load(key);
  };
};

const artistLoader = () => {
  const loader = gravityLoader();
  return (id, params) => {
    const key = toKey(`artist/${id}`, params);
    return loader.load(key);
  };
};

export default () => {
  return {
    artistLoader: artistLoader(),
    artistArtworksLoader: artistArtworksLoader(),
  };
};
