import { IDFields } from "./object_identification"

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ExternalPartnerType = new GraphQLObjectType<any, ResolverContext>({
  name: "ExternalPartner",
  fields: () => {
    return {
      ...IDFields,
      city: {
        type: GraphQLString,
        resolve: ({ city }) => city,
      },
      name: {
        type: GraphQLString,
        resolve: ({ name }) => name.trim(),
      },
    }
  },
})

const ExternalPartner: GraphQLFieldConfig<void, ResolverContext> = {
  type: ExternalPartnerType,
  description: "An External Partner not on the platform",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Partner",
    },
  },
  resolve: (_root, { id }, { galaxyGalleryLoader }) => {
    return galaxyGalleryLoader(id)
  },
}

export default ExternalPartner
