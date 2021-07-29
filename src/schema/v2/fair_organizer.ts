import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { SlugAndInternalIDFields } from "./object_identification"
import Profile from "./profile"
import { ResolverContext } from "types/graphql"

export const FairOrganizerType = new GraphQLObjectType<any, ResolverContext>({
  name: "FairOrganizer",
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      about: {
        type: GraphQLString,
      },
      name: {
        type: GraphQLString,
      },
      profileID: {
        type: GraphQLID,
        resolve: ({ profile_id }) => profile_id,
      },
      profile: {
        type: Profile.type,
        resolve: ({ profile_id }, _options, { profileLoader }) => {
          return profileLoader(profile_id).catch(() => null)
        },
      },
      website: {
        type: GraphQLString,
      },
    }
  },
})

const FairOrganizer: GraphQLFieldConfig<void, ResolverContext> = {
  type: FairOrganizerType,
  description: "A fair organizer, e.g. The Armory Show",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Fair organizer",
    },
  },
  resolve: (_root, { id }, { fairOrganizerLoader }) => {
    return fairOrganizerLoader(id)
  },
}

export default FairOrganizer
