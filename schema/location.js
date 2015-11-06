import cached from './fields/cached';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFloat
} from 'graphql';

let LocationType = new GraphQLObjectType({
  name: 'Location',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    city: {
      type: GraphQLString
    },
    country: {
      type: GraphQLString
    },
    coordinates: {
      type: new GraphQLObjectType({
        name: 'coordinates',
        fields: {
          lat: { type: GraphQLFloat },
          lng: { type: GraphQLFloat }
        }
      })
    }
  })
});

let Location = {
  type: LocationType,
  description: 'A Location'
};

export default Location;
