import cached from "./fields/cached"
import initials from "./fields/initials"
import numeral from "./fields/numeral"
import Image, { normalizeImageData, getDefault } from "./image"
import { GravityIDFields, NodeInterface } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { Searchable } from "./searchable"
import { setVersion } from "./image/normalize"

export const ProfileType = new GraphQLObjectType<any, ResolverContext>({
  name: "Profile",
  interfaces: [NodeInterface, Searchable],
  fields: () => ({
    ...GravityIDFields,
    cached,
    bio: {
      type: GraphQLString,
    },
    counts: {
      resolve: profile => profile,
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ProfileCounts",
        fields: {
          follows: numeral(({ follows_count }) => follows_count),
        },
      }),
    },
    displayLabel: {
      type: GraphQLString,
      resolve: ({ owner }) => owner.name,
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
    imageUrl: {
      type: GraphQLString,
      resolve: ({ cover_image }) => {
        const { image_versions, image_url, image_urls } = cover_image

        return setVersion(
          getDefault({
            image_url: image_url,
            images_urls: image_urls,
            image_versions: image_versions,
          }),
          ["square"]
        )
      },
    },
    initials: initials("owner.name"),
    is_followed: {
      type: GraphQLBoolean,
      resolve: ({ id }, {}, { followedProfileLoader }) => {
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

const Profile: GraphQLFieldConfig<void, ResolverContext> = {
  type: ProfileType,
  description: "A Profile",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Profile",
    },
  },
  resolve: (_root, { id }, { profileLoader }) => profileLoader(id),
}

export default Profile
