import gravity from '../../lib/loaders/gravity';
import date from '../fields/date'
import Artwork from '../artwork/index';
import { pageable, getPagingParameters } from 'relay-cursor-paging';
import {
  connectionDefinitions,
  connectionFromArraySlice,
} from 'graphql-relay';
import {
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLEnumType
} from 'graphql';

export const ArtworkInquiryRequestType = new GraphQLObjectType({
  name: 'ArtworkInquiryRequest',
  fields: () => ({
    id: {
      type: GraphQLID,
    },
    inquirer: {
      type: new GraphQLObjectType({
        name: 'ArtworkInquiryRequestInquirer',
        fields: () => ({
          id: { type: GraphQLID },
          name: { type: GraphQLString, }
        }),
      })
    },
    artwork: {
      type: Artwork.type,
      resolve: ({ inquireable }) => inquireable,
    },
    statuses: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'ArtworkInquiryRequestStatus',
          fields: () => ({
            id: { type: GraphQLID },
            title: { type: GraphQLString },
            note: { type: GraphQLString },
            created_at: date
          }),
        })
      ),
    },
    status: {
      type: GraphQLInt,
    },
    user_reported_outcome: {
      type: new GraphQLEnumType({
        name: 'UserReportedOutcome',
        values: {
          PURCHASED: { value: 'purchased' },
          STILL_CONSIDERING: { value: 'still_considering' },
          HIGH_PRICE: { value: 'high_price' },
          LOST_INTEREST: { value: 'lost_interest' },
          WORK_UNAVAILABLE: { value: 'work_unavailable' },
          OTHER: { value: 'other' },
        },
      }),
    },
    created_at: date,
  }),
});

export default {
  type: connectionDefinitions({ nodeType: ArtworkInquiryRequestType }).connectionType,
  args: pageable({}),
  description: 'A list of the current user’s inquiry requests',
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    const { limit: size, offset } = getPagingParameters(options);
    const gravityArgs = { size, offset, inquireable_type: 'artwork', total_count: true }
    return gravity.with(accessToken, { headers: true })('me/inquiry_requests', gravityArgs )
      .then (({ body, headers }) => {
        return connectionFromArraySlice(body, options, {
          arrayLength: headers['x-total-count'],
          sliceStart: offset,
        })
      });
  }
};
