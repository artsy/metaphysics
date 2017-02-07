/**
 * A "Viewer" is effectively a wildcard type to get around limitations in
 * Relay, e.g., its inability to support root nodes that contain more than one
 * argument, and lists. See https://github.com/facebook/relay/issues/112 for
 * more info, but in sum:
 *
 * @example
 *
 * This is an invalid Relay query (root has multiple arguments and is a list):
 *
 * query {
 *   sales(is_auction: true, sort: CREATED_AT_ASC) {
 *     ...
 *   }
 * }
 *
 * While this is valid as the root is a simple container:
 *
 * query {
 *   viewer {
 *     sales(is_auction: true, sort: CREATED_AT_ASC) {
 *       ...
 *     }
 *   }
 * }
 *
 * If you need to support the above conditions in your Relay program, add in
 * additional fields below.
 */

import CausalityJWT from './causality_jwt';
import Me from './me';
import Sale from './sale';
import Sales from './sales';
import { GraphQLObjectType } from 'graphql';

const ViewerType = new GraphQLObjectType({
  name: 'Viewer',
  description: 'A wildcard used to support complex root queries in Relay',
  fields: () => ({
    causality_jwt: CausalityJWT,
    me: Me,
    sale: Sale,
    sales: Sales,
  }),
});

const Viewer = {
  type: ViewerType,
  description: 'A wildcard used to support complex root queries in Relay',
  resolve: x => x,
};

export default Viewer;
