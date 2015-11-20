import moment from 'moment';
import { GraphQLString } from 'graphql';

export default {
  type: GraphQLString,
  args: {
    format: {
      type: GraphQLString
    }
  },
  resolve: (show, { format }, { fieldName }) => {
    if (!format) {
      return show[fieldName];
    } else {
      return moment.utc(show[fieldName]).format(format);
    };
  }
};
