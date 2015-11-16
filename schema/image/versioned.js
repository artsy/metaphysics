import { GraphQLString } from 'graphql';

export let VersionedImageUrl = ({ image_url }, { version }) => {
  if (!!image_url) return image_url.replace(':version', version);
};

export default {
  args: {
    version: {
      type: GraphQLString
    }
  },
  type: GraphQLString,
  resolve: VersionedImageUrl
};
