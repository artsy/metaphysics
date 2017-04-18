import gravity from '../../lib/loaders/gravity';
import { GraphQLString, GraphQLBoolean } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { artworkFields } from '../artwork/index';

export default mutationWithClientMutationId({
  name: 'SaveArtwork',
  decription: 'Save (or remove) an artwork to (from) a users default collection.',
  inputFields: {
    artwork_id: {
      type: GraphQLString,
    },
    remove: {
      type: GraphQLBoolean,
    },
  },
  outputFields: artworkFields(),
  mutateAndGetPayload: ({
    artwork_id,
    remove,
  }, request, { rootValue: { accessToken, userID } }) => {
    if (!accessToken) return null;
    const saveMethod = remove ? 'DELETE' : 'POST';
    return gravity.with(accessToken, {
      method: saveMethod,
    })(`/collection/saved-artwork/artwork/${artwork_id}`, {
      user_id: userID,
    }).then(() => gravity(`artwork/${artwork_id}`));
  },
});
