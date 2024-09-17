import { OwnerType } from "@artsy/cohesion"
import { GraphQLEnumType, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export type HomeViewComponentBehaviors = {
  viewAll?: {
    href?: string | null
    buttonText?: string
    ownerType?: OwnerType
  }
}
const HomeViewComponentBehaviors = new GraphQLObjectType<
  HomeViewComponentBehaviors,
  ResolverContext
>({
  name: "HomeViewComponentBehaviors",
  description: "Behaviors for this component",
  fields: {
    viewAll: {
      type: new GraphQLObjectType({
        name: "HomeViewComponentBehaviorsViewAll",
        description: "A specification for this section’s View All behavior",
        fields: {
          buttonText: {
            type: GraphQLString,
            description: "Text for the CTA of the View All button",
          },
          href: {
            type: GraphQLString,
            description:
              "`href` of the View All button. When present, will result in a navigation to the specified route. When `null`, will result in the client-side component’s default view-all behavior, e.g. a full-screen modal overlay",
          },
          ownerType: {
            type: GraphQLString,
            description:
              "[Analytics] `owner type` analytics value for the requested destination, as defined in our schema (artsy/cohesion)",
          },
        },
      }),
      description: "Represents the behavior of the View All button",
    },
  },
})

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description:
    "A component specification, to allow for customization of presentation and behavior",
  fields: {
    type: {
      type: GraphQLString,
      description:
        "The name of the client-side component which should be preferred (when the default component for a given section type is not sufficient)",
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
      description: "A description or blurb for this section",
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
      deprecationReason: "Use `behaviors.viewAll.href` instead",
    },
    behaviors: {
      type: HomeViewComponentBehaviors,
      description: "Behaviors for this component",
    },
  },
})
