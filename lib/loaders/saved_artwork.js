import DataLoader from 'dataloader';
import gravity from './gravity';
import {
  map,
  find,
  extend,
  first,
} from 'lodash';

const savedArtworkLoader = new DataLoader(keys => {
  const keyObjs = map(keys, JSON.parse);
  const { accessToken, userID } = first(keyObjs);
  const ids = map(keyObjs, 'id');
  return gravity.with(accessToken)('collection/saved-artwork/artworks', {
    user_id: userID,
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

export default savedArtworkLoader;


