import cached from "./fields/cached"
import initials from "./fields/initials"
import numeral from "./fields/numeral"
import Image, { normalizeImageData } from "./image"
import { SlugAndInternalIDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerType } from "schema/v2/partner/partner"
import { FairOrganizerType } from "./fair_organizer"
import { FairType } from "./fair"

export const ProfileType = new GraphQLObjectType<any, ResolverContext>({
  name: "Profile",
  fields: () => ({
    ...SlugAndInternalIDFields,
    cached,
    bio: {
      type: GraphQLString,
    },
    counts: {
      resolve: (profile) => profile,
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ProfileCounts",
        fields: {
          follows: numeral(({ follows_count }) => follows_count),
        },
      }),
    },
    displayArtistsSection: {
      type: GraphQLBoolean,
      deprecationReason: "Prefer displayArtistsSection in Partner type",
      resolve: ({ owner }) => owner.display_artists_section,
    },
    fullBio: {
      type: GraphQLString,
      resolve: ({ full_bio }) => full_bio,
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `/${id}`,
    },
    icon: {
      type: Image.type,
      resolve: ({ icon }) => normalizeImageData(icon),
    },
    image: {
      type: Image.type,
      resolve: ({ cover_image }) => normalizeImageData(cover_image),
    },
    initials: initials("owner.name"),
    isFollowed: {
      type: GraphQLBoolean,
      resolve: ({ id }, {}, { followedProfileLoader }) => {
        if (!followedProfileLoader) return false
        return followedProfileLoader(id).then(({ is_followed }) => is_followed)
      },
    },
    isPubliclyVisible: {
      type: GraphQLBoolean,
      resolve: (profile) => profile && profile.published && !profile.private,
    },
    isPublished: {
      type: GraphQLBoolean,
      resolve: ({ published }) => published,
    },
    location: {
      type: GraphQLString,
      resolve: ({ location }) => location,
    },
    name: {
      type: GraphQLString,
      resolve: ({ owner }) => owner.name,
    },
    profileArtistsLayout: {
      type: GraphQLString,
      deprecationReason: "Prefer profileArtistsLayout in Partner type",
      resolve: ({ owner }) => owner.profile_artists_layout,
    },
    owner: {
      type: new GraphQLNonNull(
        new GraphQLUnionType({
          name: "ProfileOwnerType",
          types: [PartnerType, FairOrganizerType, FairType],
          resolveType: (owner) => {
            switch (owner.__ownerType) {
              case "Fair":
                return FairType
              case "FairOrganizer":
                return FairOrganizerType
              default:
                return PartnerType
            }
          },
        })
      ),
      resolve: ({ owner, owner_type }) => ({
        __ownerType: owner_type,
        ...owner,
      }),
    },
  }),
})

const Profile: GraphQLFieldConfig<void, ResolverContext> = {
  type: ProfileType,
  description: "A Profile",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Profile",
    },
  },
  resolve: (_root, { id }, { profileLoader }) => {
    return profileLoader(id)
  },
}

export default Profile
