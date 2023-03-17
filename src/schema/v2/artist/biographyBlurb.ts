import { GraphQLBoolean, GraphQLFieldResolver } from "graphql"
import { first } from "lodash"
import { ResolverContext } from "types/graphql"
import { formatMarkdownValue, markdown } from "../fields/markdown"

export const biographyBlurbResolver: GraphQLFieldResolver<
  { blurb?: string | null; id: string },
  ResolverContext
> = async (
  { blurb, id },
  { format, partnerBio },
  { partnerArtistsForArtistLoader }
) => {
  if (!blurb) return null

  if (!partnerBio && blurb && blurb.length) {
    return { text: formatMarkdownValue(blurb, format) }
  }

  try {
    const partnerArtists = await partnerArtistsForArtistLoader(id, {
      size: 1,
      featured: true,
    })

    if (partnerArtists && partnerArtists.length) {
      const { biography, partner } = first(partnerArtists) as any

      return {
        text: formatMarkdownValue(biography, format),
        credit: `Submitted by ${partner.name}`,
        partner_id: partner.id,
        partner: partner,
      }
    }

    return { text: formatMarkdownValue(blurb, format) }
  } catch (error) {
    console.error(error)
    return { text: formatMarkdownValue(blurb, format) }
  }
}

export const biographyBlurbArgs = {
  partnerBio: {
    type: GraphQLBoolean,
    description: "If true, will return featured bio over Artsy one.",
    defaultValue: false,
  },
  ...markdown().args,
}
