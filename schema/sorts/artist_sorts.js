import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'ArtistSorts',
    values: {
      sortable_id_asc: {
        value: 'sortable_id',
      },
      sortable_id_desc: {
        value: '-sortable_id',
      },
      trending_desc: {
        value: '-trending',
      },
    },
  }),
};
