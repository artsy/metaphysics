import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'EventStatus',
    values: {
      current: {
        value: 'current',
        deprecationReason: 'use capital enums',
      },
      running: {
        value: 'running',
        deprecationReason: 'use capital enums',
      },
      closed: {
        value: 'closed',
        deprecationReason: 'use capital enums',
      },
      upcoming: {
        value: 'upcoming',
        deprecationReason: 'use capital enums',
      },
      CURRENT: {
        value: 'current',
      },
      RUNNING: {
        value: 'running',
      },
      CLOSED: {
        value: 'closed',
      },
      UPCOMING: {
        value: 'upcoming',
      },
    },
  }),
};
