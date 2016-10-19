import gravity from '../../lib/loaders/gravity';
import delta from '../../lib/loaders/delta';
import {
  clone,
  first,
  forEach,
  sample,
  shuffle,
  slice,
  sortBy,
} from 'lodash';
import blacklist from '../../lib/artist_blacklist';

export const featuredFair = () => {
  return gravity('fairs', { size: 5, active: true, has_homepage_section: true }).then((fairs) => {
    if (fairs.length) {
      return first(sortBy(fairs, ({ banner_size }) =>
        ['x-large', 'large', 'medium', 'small', 'x-small'].indexOf(banner_size)
      ));
    }
  });
};

export const featuredAuction = () => {
  return gravity('sales', { live: true, size: 1, sort: 'end_at' }).then((sales) => {
    if (sales.length) {
      return first(sales);
    }
  });
};

export const followedGenes = (accessToken, size) => {
  return gravity.with(accessToken)('me/follow/genes', { size });
};

export const featuredGene = (accessToken) => {
  return followedGenes(accessToken, 1).then((follows) => {
    if (follows.length) {
      return first(follows).gene;
    }
  });
};

export const geneArtworks = (id, size) => {
  return gravity('filter/artworks', {
    gene_id: id,
    for_sale: true,
    size: 60,
  }).then(({ hits }) => {
    return slice(shuffle(hits), 0, size);
  });
};

export const relatedArtist = (accessToken, userID) => {
  return gravity.with(accessToken)(`user/${userID}/suggested/similar/artists`, {
    exclude_artists_without_forsale_artworks: true,
    exclude_followed_artists: true,
  }).then(sample);
};

export const popularArtists = () => {
  return delta('/', {
    method: 'fetch',
    n: 9,
    name: 'artist_follow_2t',
  }).then((trending) => {
    const clonedTrending = clone(trending);
    forEach(blacklist, (id) => delete clonedTrending[id]);
    return clonedTrending;
  });
};
