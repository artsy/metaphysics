import gravity from '../../lib/loaders/gravity';
import Artwork from '../artwork/index';
import { pageable, getPagingParameters } from 'relay-cursor-paging';
import {
  connectionDefinitions,
  connectionFromArraySlice,
} from 'graphql-relay';
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql';

export const ArtworkInquiryType = new GraphQLObjectType({
  name: 'ArtworkInquiry',
  fields: () => ({
    id: {
      type: GraphQLID,
    },
    artwork: {
      type: new GraphQLNonNull(Artwork.type),
      resolve: ({ inquireable }) => inquireable,
    },
  }),
});

export default {
  type: connectionDefinitions({ nodeType: ArtworkInquiryType }).connectionType,
  args: pageable({}),
  description: 'A list of the current user’s inquiry requests',
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    const { limit: size, offset } = getPagingParameters(options);
    const gravityArgs = { size, offset, inquireable_type: 'artwork', total_count: true };
    return gravity.with(accessToken, { headers: true })('me/inquiry_requests', gravityArgs)
      .then(({ body, headers }) => {
        return connectionFromArraySlice(body, options, {
          arrayLength: headers['x-total-count'],
          sliceStart: offset,
        });
      });
  },
};
