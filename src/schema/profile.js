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

const ProfileType = new GraphQLObjectType({
  name: "Profile",
  fields: () => {return {
    ...GravityIDFields,
    cached,
    bio: {
      type: GraphQLString,
    },
    counts: {
      resolve: profile => {return profile},
      type: new GraphQLObjectType({
        name: "ProfileCounts",
        fields: {
          follows: numeral(({ follows_count }) => {return follows_count}),
        },
      }),
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => {return `/${id}`},
    },
    icon: {
      type: Image.type,
      resolve: ({ icon }) => {return Image.resolve(icon)},
    },
    image: {
      type: Image.type,
      resolve: ({ cover_image }) => {return Image.resolve(cover_image)},
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
        return followedProfileLoader(id).then(({ is_followed }) => {return is_followed})
      },
    },
    is_published: {
      type: GraphQLBoolean,
      resolve: ({ published }) => {return published},
    },
    name: {
      type: GraphQLString,
      resolve: ({ owner }) => {return owner.name},
    },
    is_publically_visible: {
      type: GraphQLBoolean,
      resolve: profile => {return profile && profile.published && !profile.private},
    },
  }},
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
    {return profileLoader(id)},
}

export default Profile
