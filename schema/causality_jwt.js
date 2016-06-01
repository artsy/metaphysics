import jwt from 'jwt-simple';
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
} from 'graphql';
import gravity from '../lib/loaders/gravity';
import { find } from 'lodash';

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
          OPERATOR: { value: 'OPERATOR' },
          PARTICIPANT: { value: 'PARTICIPANT' },
        },
      }),
      description: '',
    },
  },
  resolve: (root, options, { rootValue: { accessToken } }) => {
    // Observer role for logged out user
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

    // Bidder role for logged in & registered user
    } else if (options.role === 'PARTICIPANT' && accessToken) {
      return Promise.all([
        gravity.with(accessToken)('me'),
        gravity.with(accessToken)('me/bidders'),
        gravity(`sale/${options.sale_id}`),
      ]).then(([me, bidders, sale]) => {
        const registered = find(bidders, (b) => b.sale._id === sale._id);
        if (!registered) throw new Error('Not registered to bid in auction');
        return jwt.encode({
          aud: 'auctions',
          role: 'bidder',
          userId: me._id,
          saleId: sale._id,
          bidderId: me.paddle_number,
          iat: new Date().getTime(),
        }, HMAC_SECRET);
      });

    // Operator role for logged in admin
    } else if (options.role === 'OPERATOR' && accessToken) {
      return Promise.all([
        gravity.with(accessToken)('me'),
        gravity(`sale/${options.sale_id}`),
      ]).then(([me, sale]) => {
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
