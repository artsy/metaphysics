import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLFloat,
} from 'graphql';

const Near = new GraphQLInputObjectType({
  name: 'Near',
  fields: {
    lat: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    lng: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    max_distance: {
      type: GraphQLFloat,
    },
  },
});

export default Near;
