import gravity from '../../lib/loaders/gravity';
import { sortBy, first } from 'lodash';

export const featuredFair = () => {
  return gravity('fairs', { size: 5, active: true }).then((fairs) => {
    if (fairs.length) {
      return first(sortBy(fairs, ({ banner_size }) =>
        ['x-large', 'large', 'medium', 'small', 'x-small'].indexOf(banner_size)
      ));
    }
  });
};

export const featuredAuction = () => {
  return gravity('sales', { live: true, size: 1 }).then((sales) => {
    if (sales.length) {
      return first(sales);
    }
  });
};

export const featuredGene = (accessToken) => {
  return gravity.with(accessToken)('me/follow/genes', { size: 1 }).then((follows) => {
    if (follows.length) {
      return first(follows).gene;
    }
  });
};
