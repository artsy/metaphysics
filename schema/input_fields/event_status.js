import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'EventStatus',
    values: {
      current: {
        value: 'current',
      },
      running: {
        value: 'running',
      },
      closed: {
        value: 'closed',
      },
      upcoming: {
        value: 'upcoming',
      },
    },
  }),
};
