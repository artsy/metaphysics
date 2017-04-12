import DataLoader from 'dataloader';
import gravity from './gravity';
import { map, find, extend } from 'lodash';

export default (userId, accessToken) => {
  return new DataLoader(ids => {
    return gravity.with(accessToken)('collection/saved-artwork/artworks', {
      user_id: userId,
      artworks: ids,
      private: true,
    }).then((results) => {
      const parsedResults = map(ids, (id) => {
        const match = find(results, { id });
        if (match) return extend(match, { is_saved: true });
        return { id, is_saved: false };
      });
      return parsedResults;
    });
  }, { batch: true, cache: false });
};
