import gravity from '../../lib/loaders/gravity';
import { keys, map, sortBy } from 'lodash';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';

const featuredFair = () => {
  return gravity('fairs', { size: 5, status: 'running' }).then((fairs) => {
    return sortBy(fairs, ({ banner_size }) =>
      ['x-large', 'large', 'medium', 'small', 'x-small'].indexOf(banner_size)
    )[0];
  });
}

const moduleTitle = {
  active_bids: () => "Your Active Bids",
  followed_artists: () => "Works by Artists you Follow",
  followed_galleries: () => "Works from Galleries you Follow",
  saved_works: () => "Recently Saved Works",
  recommended_works: () => "Recommended Works for You",
  live_auctions: () => "At Auction: ",
  current_fairs: () =>  {
    return featuredFair().then(({name}) => {
      return `Art Fair: ${name}`
    })
  },
  related_artists: () => "Works by Related Artists",
  genes: () => "Works from Gene you Follow",
}


export const HomePageModulesType = new GraphQLObjectType({
  name: 'HomePageModules',
  fields: () => ({
    key: {
      type: GraphQLString,
    },
    should_display: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
      resolve: ({ key, should_display }) => {
        if(should_display){
          return moduleTitle[key]();
        } else {
          return "";
        }
      },
    }
  }),
});

const HomePageModules = {
  type: new GraphQLList(HomePageModulesType),
  description: 'Modules to show on the home screen',
  resolve: (root, options, { rootValue: { accessToken } }) => {
    return gravity.with(accessToken)('me/modules').then((response) => {
      return map(keys(response), (key) => {
        return { key: key, should_display: response[key] };
      });
    })
  },
};

export default HomePageModules;
