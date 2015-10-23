import artsy from '../lib/artsy';
import {
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

let PingType = new GraphQLObjectType({
  name: 'Ping',
  description: 'System ping',
  fields: {
    ping: {
      type: GraphQLString,
      description: 'Is the system up or down?'
    }
  }
});

let Ping = {
  type: PingType,
  resolve: () => artsy('system/ping')
};

export default Ping;
