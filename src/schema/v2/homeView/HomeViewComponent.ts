import { GraphQLEnumType, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export type HomeViewComponentBehaviors = {
  viewAll?: {
    href?: string
    buttonText?: string
  }
}
const HomeViewComponentBehaviors = new GraphQLObjectType<
  HomeViewComponentBehaviors,
  ResolverContext
>({
  name: "HomeViewComponentBehaviors",
  fields: {
    viewAll: {
      type: new GraphQLObjectType({
        name: "HomeViewComponentBehaviorsViewAll",
        fields: {
          href: {
            type: GraphQLString,
            description: "href of the view all button",
          },
          buttonText: {
            type: GraphQLString,
            description: "Text for the CTA of the view all button",
          },
        },
      }),
      description: "Represents the behavior of the view all button",
    },
  },
})

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    type: {
      type: GraphQLString,
      description: "How this component should be rendered",
      resolve: async (parent, _args, context, _info) => {
        const { type: _type } = parent

        if (typeof _type === "string") {
          return _type
        }

        if (typeof _type === "function") {
          const type = await _type(context)
          return type
        }
      },
    },
    title: {
      type: GraphQLString,
      description: "A display title for this section",
      resolve: async (parent, _args, context, _info) => {
        const { title: _title } = parent

        if (typeof _title === "string") {
          return _title
        }

        if (typeof _title === "function") {
          const title = await _title(context)
          return title
        }
      },
    },
    description: {
      type: GraphQLString,
      description: "A description for this section",
      resolve: async (parent, _args, context, _info) => {
        const { description: _description } = parent

        if (typeof _description === "string") {
          return _description
        }

        if (typeof _description === "function") {
          const description = await _description(context)
          return description
        }
      },
    },
    backgroundImageURL: {
      type: GraphQLString,
      args: {
        version: {
          type: new GraphQLEnumType({
            name: "HomeViewComponentBackgroundImageURLVersion",
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
      description: "A background image for this section",
      resolve: async (parent, args, context, _info) => {
        const { backgroundImageURL } = parent

        if (typeof backgroundImageURL === "string") {
          return backgroundImageURL
        }

        if (typeof backgroundImageURL === "function") {
          const color = await backgroundImageURL(context, args)
          return color
        }
      },
    },
    href: {
      type: GraphQLString,
      description: "A screen to navigate to when this component is clicked",
      resolve: async (parent, _args, context, _info) => {
        const { href: _href } = parent

        if (typeof _href === "string") {
          return _href
        }

        if (typeof _href === "function") {
          const description = await _href(context)
          return description
        }
      },
    },
    behaviors: {
      type: HomeViewComponentBehaviors,
      description: "Behaviors for the view",
    },
  },
})
