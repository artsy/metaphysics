import cached from '../fields/cached';
import gravity from '../../lib/loaders/gravity';
import { GravityIDFields } from '../object_identification';
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

const HomePageHeroUnitType = new GraphQLObjectType({
  name: 'HomePageHeroUnit',
  fields: {
    ...GravityIDFields,
    cached,
    heading: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ link }) => link,
    },
    title: {
      type: GraphQLString,
      resolve: ({ mobile_title }) => mobile_title,
    },
    background_image_url: {
      type: GraphQLString,
      description: 'The image to show, on desktop this defaults to the wide version.',
      args: {
        version: {
          type: new GraphQLEnumType({
            name: 'HomePageHeroUnitImageVersion',
            values: {
              WIDE: {
                value: 'wide',
              },
              NARROW: {
                value: 'narrow',
              },
            },
          }),
        },
      },
      resolve: ({ platform, background_image_url, background_image_mobile_url }, { version }) => {
        if (version) {
          return version === 'wide' ? background_image_url : background_image_mobile_url;
        }
        return platform === 'desktop' ? background_image_url : background_image_mobile_url;
      },
    },
  },
});

const HomePageHeroUnits = {
  type: new GraphQLList(HomePageHeroUnitType),
  description: 'A list of enabled hero units to show on the requested platform',
  args: {
    platform: {
      type: new GraphQLNonNull(new GraphQLEnumType({
        name: 'HomePageHeroUnitPlatform',
        values: {
          MOBILE: {
            value: 'mobile',
          },
          DESKTOP: {
            value: 'desktop',
          },
          MARTSY: {
            value: 'martsy',
          },
        },
      })),
    },
  },
  resolve: (_, { platform }) => {
    const params = { enabled: true };
    params[platform] = true;
    return gravity('site_hero_units', params).then(units => {
      return units.map(unit => Object.assign({ platform }, unit));
    });
  },
};

export default HomePageHeroUnits;
