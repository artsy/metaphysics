import cached from "schema/fields/cached"
import { GravityIDFields } from "schema/object_identification"
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} from "graphql"

const HomePageHeroUnitType = new GraphQLObjectType({
  name: "HomePageHeroUnit",
  fields: {
    ...GravityIDFields,
    cached,
    mode: {
      type: new GraphQLEnumType({
        name: "HomePageHeroUnitMode",
        values: {
          LEFT_DARK: {
            value: "left white",
          },
          LEFT_LIGHT: {
            value: "left black",
          },
          CENTERED_DARK: {
            value: "center white",
          },
          CENTERED_LIGHT: {
            value: "center black",
          },
          RIGHT_DARK: {
            value: "right white",
          },
          RIGHT_LIGHT: {
            value: "right black",
          },
        },
      }),
      resolve: ({ type, menu_color_class }) => {
        return type.toLowerCase() + " " + menu_color_class.toLowerCase()
      },
    },
    heading: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ link }) => link,
    },
    title: {
      type: GraphQLString,
      resolve: ({ mobile_title, name, platform }) => {
        return platform === "desktop" ? name : mobile_title
      },
    },
    title_image_url: {
      args: {
        retina: {
          type: GraphQLBoolean,
        },
      },
      type: GraphQLString,
      resolve: ({ title_image_url, title_image_retina_url, retina }) => {
        return retina ? title_image_retina_url : title_image_url
      },
    },
    subtitle: {
      type: GraphQLString,
      resolve: ({ mobile_description, description, platform }) => {
        return platform === "desktop" ? description : mobile_description
      },
    },
    link_text: {
      type: GraphQLString,
    },
    credit_line: {
      type: GraphQLString,
    },
    background_image_url: {
      type: GraphQLString,
      description:
        "The image to show, on desktop this defaults to the wide version.",
      args: {
        version: {
          type: new GraphQLEnumType({
            name: "HomePageHeroUnitImageVersion",
            values: {
              WIDE: {
                value: "wide",
              },
              NARROW: {
                value: "narrow",
              },
            },
          }),
        },
      },
      resolve: (
        { platform, background_image_url, background_image_mobile_url },
        { version }
      ) => {
        if (version) {
          return version === "wide"
            ? background_image_url
            : background_image_mobile_url
        }
        return platform === "desktop"
          ? background_image_url
          : background_image_mobile_url
      },
    },
  },
})

const HomePageHeroUnits = {
  type: new GraphQLList(HomePageHeroUnitType),
  description: "A list of enabled hero units to show on the requested platform",
  args: {
    platform: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: "HomePageHeroUnitPlatform",
          values: {
            MOBILE: {
              value: "mobile",
            },
            DESKTOP: {
              value: "desktop",
            },
            MARTSY: {
              value: "martsy",
            },
          },
        })
      ),
    },
  },
  resolve: (_, { platform }, request, { rootValue: { heroUnitsLoader } }) => {
    const params = { enabled: true }
    params[platform] = true
    return heroUnitsLoader(params).then(units => {
      return units.map(unit => Object.assign({ platform }, unit))
    })
  },
}

export default HomePageHeroUnits
