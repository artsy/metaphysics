import cached from "schema/v2/fields/cached"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const HomePageHeroUnitType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomePageHeroUnit",
  fields: {
    ...SlugAndInternalIDFields,
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
      resolve: ({ mobile_title, name, platform, app_title }) => {
        switch (platform) {
          case "desktop":
            return name
          case "mobile":
            return app_title
          case "martsy":
            return mobile_title
        }
      },
    },
    titleImageURL: {
      args: {
        retina: {
          type: GraphQLBoolean,
        },
      },
      type: GraphQLString,
      resolve: ({ title_image_url, title_image_retina_url }, { retina }) => {
        return retina ? title_image_retina_url : title_image_url
      },
    },
    subtitle: {
      type: GraphQLString,
      resolve: ({
        app_description,
        mobile_description,
        description,
        platform,
      }) => {
        switch (platform) {
          case "desktop":
            return description
          case "martsy":
            return mobile_description
          case "mobile":
            return app_description
        }
      },
    },
    linkText: {
      type: GraphQLString,
      resolve: ({ link_text }) => link_text,
    },
    creditLine: {
      type: GraphQLString,
      resolve: ({ credit_line }) => credit_line,
    },
    backgroundImageURL: {
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
        {
          platform,
          background_image_url,
          background_image_mobile_url,
          background_image_app_phone_url,
          background_image_app_tablet_url,
        },
        { version }
      ) => {
        if (platform === "mobile") {
          return version === "wide"
            ? background_image_app_tablet_url
            : background_image_app_phone_url
        }
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

const HomePageHeroUnits: GraphQLFieldConfig<void, ResolverContext> = {
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
  resolve: (_, { platform }, { siteHeroUnitsLoader }) => {
    const params = { enabled: true, [platform]: true }
    return siteHeroUnitsLoader(params).then((units) => {
      return units.map((unit) => Object.assign({ platform }, unit))
    })
  },
}

export default HomePageHeroUnits
