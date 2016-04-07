import { assign } from 'lodash';
import { formatMoney } from 'accounting';
import {
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
} from 'graphql';

export const amount = resolve => ({
  type: GraphQLString,
  args: {
    symbol: {
      type: GraphQLString,
    },
    thousand: {
      type: GraphQLString,
      defaultValue: ',',
    },
    decimal: {
      type: GraphQLString,
      defaultValue: '.',
    },
    format: {
      type: GraphQLString,
      description: 'Allows control of symbol position (%v = value, %s = symbol)',
      defaultValue: '%s%v',
    },
    precision: {
      type: GraphQLInt,
      defaultValue: 0,
    },
  },
  resolve: (obj, options, { fieldName }) => {
    const value = resolve ? resolve(obj) : obj[fieldName];
    if (!value) return null;
    const symbol = options.symbol || obj.symbol;
    return formatMoney(value / 100, assign({}, options, {
      symbol,
    }));
  },
});

const money = ({ name, resolve }) => ({
  resolve: x => x,
  type: new GraphQLObjectType({
    name,
    fields: {
      cents: {
        type: GraphQLInt,
        resolve: (obj, options, { fieldName }) => {
          const value = resolve ? resolve(obj) : obj[fieldName];
          if (!value) return null;
          return value;
        },
      },
      amount: amount(resolve),
    },
  }),
});

export default money;
