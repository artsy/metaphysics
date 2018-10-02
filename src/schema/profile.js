import cached from "./fields/cached"
import initials from "./fields/initials"
import numeral from "./fields/numeral"
import Image from "./image"
import { GravityIDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"

export const ProfileType = new GraphQLObjectType({
  name: "Profile",
  fields: () => ({
    ...GravityIDFields,
    cached,
    bio: {
      type: GraphQLString,
    },
    counts: {
      resolve: profile => profile,
      type: new GraphQLObjectType({
        name: "ProfileCounts",
        fields: {
          follows: numeral(({ follows_count }) => follows_count),
        },
      }),
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `/${id}`,
    },
    icon: {
      type: Image.type,
      resolve: ({ icon }) => Image.resolve(icon),
    },
    image: {
      type: Image.type,
      resolve: ({ cover_image }) => Image.resolve(cover_image),
    },
    initials: initials("owner.name"),
    is_followed: {
      type: GraphQLBoolean,
      resolve: (
        { id },
        {},
        request,
        { rootValue: { followedProfileLoader } }
      ) => {
        if (!followedProfileLoader) return false
        return followedProfileLoader(id).then(({ is_followed }) => is_followed)
      },
    },
    is_published: {
      type: GraphQLBoolean,
      resolve: ({ published }) => published,
    },
    name: {
      type: GraphQLString,
      resolve: ({ owner }) => owner.name,
    },
    is_publically_visible: {
      type: GraphQLBoolean,
      resolve: profile => profile && profile.published && !profile.private,
    },
  }),
})

const Profile = {
  type: ProfileType,
  description: "A Profile",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Profile",
    },
  },
  resolve: (root, { id }, request, { rootValue: { profileLoader } }) =>
    profileLoader(id),
}

export default Profile
