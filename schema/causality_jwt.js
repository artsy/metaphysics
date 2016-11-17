import jwt from 'jwt-simple';
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
} from 'graphql';
import gravity from '../lib/loaders/gravity';

const { HMAC_SECRET } = process.env;

export default {
  type: GraphQLString,
  description: 'Creates, and authorizes, a JWT custom for Causality',
  args: {
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The id of the auction to participate in',
    },
    role: {
      type: new GraphQLEnumType({
        name: 'Role',
        values: {
          PARTICIPANT: { value: 'PARTICIPANT' },
          OPERATOR: { value: 'OPERATOR' },
        },
      }),
      description: '',
    },
  },
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    // Observer role for logged out users
    if (!accessToken) {
      return gravity(`sale/${options.sale_id}`).then((sale) =>
        jwt.encode({
          aud: 'auctions',
          role: 'observer',
          userId: null,
          saleId: sale._id,
          bidderId: null,
          iat: new Date().getTime(),
        }, HMAC_SECRET)
      );

    // For logged in and...
    } else if (options.role === 'PARTICIPANT' && accessToken) {
      return Promise.all([
        gravity(`sale/${options.sale_id}`),
        gravity.with(accessToken)('me'),
        gravity.with(accessToken)('me/bidders', { sale_id: options.sale_id }),
      ]).then(([sale, me, bidders]) => {
        if (bidders.length && bidders[0].qualified_for_bidding) {
          return jwt.encode({
            aud: 'auctions',
            role: 'bidder',
            userId: me._id,
            saleId: sale._id,
            bidderId: bidders[0].id,
            iat: new Date().getTime(),
          }, HMAC_SECRET);
        }
        return jwt.encode({
          aud: 'auctions',
          role: 'observer',
          userId: me._id,
          saleId: sale._id,
          bidderId: null,
          iat: new Date().getTime(),
        }, HMAC_SECRET);
      });

    // Operator role if logged in as an admin
    } else if (options.role === 'OPERATOR' && accessToken) {
      return Promise.all([
        gravity(`sale/${options.sale_id}`),
        gravity.with(accessToken)('me'),
      ]).then(([sale, me]) => {
        if (me.type !== 'Admin') throw new Error('Unauthorized to be operator');
        return jwt.encode({
          aud: 'auctions',
          role: 'operator',
          userId: me._id,
          saleId: sale._id,
          bidderId: me.paddle_number,
          iat: new Date().getTime(),
        }, HMAC_SECRET);
      });
    }
  },
};
