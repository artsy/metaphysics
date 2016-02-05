import {
  map,
  assign,
} from 'lodash';
import {
  enhance,
  isExisty,
  classify,
} from '../../lib/helpers';
import markdown from '../fields/markdown';
import {
  GraphQLString,
  GraphQLList,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLInterfaceType,
} from 'graphql';

const ArtworkTabInterface = new GraphQLInterfaceType({
  name: 'ArtworkTabInterface',
  fields: {
    id: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
  },
});

const tab = ({ id, name, fields, predicate }) => {
  return {
    data: {
      id,
      name,
    },
    predicate,
    type: new GraphQLObjectType({
      name: `${classify(name)}ArtworkTab`,
      interfaces: [ArtworkTabInterface],
      isTypeOf: (x) => x.id === id,
      fields: assign(fields, {
        id: {
          type: GraphQLString,
        },
        name: {
          type: GraphQLString,
        },
      }),
    }),
  };
};

const tabs = [
  tab({
    id: 'description',
    name: 'Description',
    predicate: (artwork) => {
      return (
        isExisty(artwork.blurb) ||
        isExisty(artwork.additional_information) ||
        isExisty(artwork.signature) ||
        isExisty(artwork.series)
      );
    },
    fields: {
      description: markdown('blurb'),
      additional_information: markdown(),
      signature: markdown(),
      series: {
        type: GraphQLString,
      },
    },
  }),

  tab({
    id: 'exhibition_history',
    name: 'Exhibition History',
    predicate: ({ exhibition_history }) =>
      isExisty(exhibition_history),
    fields: {
      exhibition_history: markdown(),
    },
  }),

  tab({
    id: 'bibliography',
    name: 'Bibliography',
    predicate: ({ literature }) =>
      isExisty(literature),
    fields: {
      bibliography: markdown('literature'),
    },
  }),

  tab({
    id: 'provenance',
    name: 'Provenance',
    predicate: ({ provenance }) =>
      isExisty(provenance),
    fields: {
      provenance: markdown(),
    },
  }),
];

export const ArtworkTabType = new GraphQLUnionType({
  name: 'ArtworkTab',
  types: map(tabs, 'type'),
});

export default {
  type: new GraphQLList(ArtworkTabType),
  resolve: (artwork) => {
    const valid = tabs.filter(({ predicate }) => predicate(artwork));
    const data = map(valid, 'data');
    return enhance(data, artwork);
  },
};
