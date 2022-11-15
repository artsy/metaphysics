import initials from "./fields/initials"
import Image from "./image"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { markdown } from "./fields/markdown"
import { ArtistType } from "./artist"
import { PartnerType } from "schema/v2/partner/partner"
import { GeneType } from "./gene"
import { URL } from "url"

export const FeaturedLinkType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeaturedLink",
  fields: {
    ...InternalIDFields,
    entity: {
      description: "Parses the `href` to get the underlying entity",
      type: new GraphQLUnionType({
        name: "FeaturedLinkEntity",
        types: [ArtistType, PartnerType, GeneType],
        resolveType: ({ __typename }) => {
          switch (__typename) {
            case "Artist":
              return ArtistType
            case "Partner":
              return PartnerType
            case "Gene":
              return GeneType
            default:
              return null
          }
        },
      }),
      resolve: async (
        { href },
        _args,
        { artistLoader, partnerLoader, geneLoader }
      ) => {
        if (!href) return null

        const uri = new URL(href)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, kind, slug] = uri.pathname.split("/")

        switch (kind) {
          case "artist": {
            const res = await artistLoader(slug)
            return { __typename: "Artist", ...res }
          }
          case "partner": {
            const res = await partnerLoader(slug)
            return { __typename: "Partner", ...res }
          }
          case "gene": {
            const res = await geneLoader(slug)
            return { __typename: "Gene", ...res }
          }
          default:
            return null
        }
      },
    },
    description: markdown(),
    href: { type: GraphQLString },
    image: Image,
    initials: initials("title"),
    subtitle: markdown(),
    title: { type: GraphQLString },
  },
})

const FeaturedLink: GraphQLFieldConfig<void, ResolverContext> = {
  type: FeaturedLinkType,
}

export default FeaturedLink
