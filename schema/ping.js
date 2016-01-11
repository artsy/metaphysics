import gravity from '../lib/apis/gravity'; // Uncached
import {
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

const PingType = new GraphQLObjectType({
  name: 'Ping',
  description: 'System ping',
  fields: {
    ping: {
      type: GraphQLString,
      description: 'Is the system up or down?',
    },
  },
});

const Ping = {
  type: PingType,
  resolve: () => gravity('system/ping'),
};

export default Ping;
