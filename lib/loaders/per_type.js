import gravity from '../apis/gravity';
import positron from '../apis/positron';
import { toKey } from '../helpers';
import httpLoader from './http';

// TODO As we’re currently re-using the http loader as it was, it won’t support batching yet.
//      We should rework that once we’ve changed all resolve functions to only use per-type loaders.
const gravityLoader = () => httpLoader(gravity);
const positronLoader = () => httpLoader(positron);

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

const articlesLoader = () => {
  const loader = positronLoader();
  return (_id, params) => {
    const key = toKey('articles', params);
    return loader.load(key);
  };
};

const partnerShowImagesLoader = () => {
  const loader = gravityLoader();
  return (id, params) => {
    const key = toKey(`partner_show/${id}/images`, params);
    return loader.load(key);
  };
};

const relatedShowsLoader = () => {
  const loader = gravityLoader();
  return (_id, params) => {
    const key = toKey('related/shows', params);
    return loader.load(key);
  };
};

const relatedSalesLoader = () => {
  const loader = gravityLoader();
  return (_id, params) => {
    const key = toKey('related/sales', params);
    return loader.load(key);
  };
};

const relatedMainArtistsLoader = () => {
  const loader = gravityLoader();
  return (_id, params) => {
    const key = toKey('related/layer/main/artists', params);
    return loader.load(key);
  };
};

const relatedContemporaryArtistsLoader = () => {
  const loader = gravityLoader();
  return (_id, params) => {
    const key = toKey('related/layer/contemporary/artists', params);
    return loader.load(key);
  };
};

const partnerArtistsLoader = () => {
  const loader = gravityLoader();
  return (id, params) => {
    const key = toKey(`artist/${id}/partner_artists`, params);
    return loader.load(key);
  };
};

export default () => {
  return {
    artistLoader: artistLoader(),
    articlesLoader: articlesLoader(),
    artistArtworksLoader: artistArtworksLoader(),
    relatedSalesLoader: relatedSalesLoader(),
    relatedShowsLoader: relatedShowsLoader(),
    relatedMainArtistsLoader: relatedMainArtistsLoader(),
    relatedContemporaryArtistsLoader: relatedContemporaryArtistsLoader(),
    partnerArtistsLoader: partnerArtistsLoader(),
    partnerShowImagesLoader: partnerShowImagesLoader(),
  };
};
