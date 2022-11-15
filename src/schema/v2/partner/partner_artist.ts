import { PartnerType } from "schema/v2/partner/partner"
import Artist from "schema/v2/artist/index"
import numeral from "schema/v2/fields/numeral"
import { IDFields } from "schema/v2/object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  Thunk,
  GraphQLFieldConfigMap,
  GraphQLFieldConfig,
  GraphQLEnumType,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { BodyAndHeaders } from "lib/loaders"
import { formatMarkdownValue, markdown } from "schema/v2/fields/markdown"
import { artworkConnection } from "schema/v2/artwork"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

// TODO: This should move to the gravity loader
interface PartnerArtistDetails {
  sortable_id: string
  use_default_biography: boolean
  published_artworks_count: number
  published_for_sale_artworks_count: number
  display_on_partner_profile: boolean
  represented_by: boolean
  biography: string
  artist: {
    id: string
    blurb: string
  }
  partner: {
    id: string
    name: string
  }
}

const counts: GraphQLFieldConfig<PartnerArtistDetails, ResolverContext> = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "PartnerArtistCounts",
    fields: {
      artworks: numeral(
        ({ published_artworks_count }) => published_artworks_count
      ),
      managedArtworks: numeral(({ artworks_count }) => artworks_count),
      forSaleArtworks: numeral(
        ({ published_for_sale_artworks_count }) =>
          published_for_sale_artworks_count
      ),
    },
  }),
  resolve: (partner_artist) => partner_artist,
}

const PartnerArtistBlurbType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerArtistBlurb",
  fields: {
    credit: {
      type: GraphQLString,
      resolve: ({ credit }) => credit,
    },
    text: {
      type: GraphQLString,
      resolve: ({ text }) => text,
    },
  },
})

const biographyBlurb: GraphQLFieldConfig<
  PartnerArtistDetails,
  ResolverContext
> = {
  args: {
    ...markdown().args,
  },
  type: PartnerArtistBlurbType,
  resolve: (
    { use_default_biography, biography, artist: { blurb }, partner: { name } },
    { format }
  ) => {
    if (use_default_biography) {
      return {
        text: formatMarkdownValue(blurb, format),
      }
    } else if (biography.length) {
      return {
        text: formatMarkdownValue(biography, format),
        credit: `Submitted by ${name}`,
      }
    }

    return null
  },
}

const ArtworksSort = {
  type: new GraphQLEnumType({
    name: "PartnerArtistArtworksSort",
    values: {
      POSITION_ASC: {
        value: "position",
      },
      POSITION_DESC: {
        value: "-position",
      },
    },
  }),
}

export const fields: Thunk<GraphQLFieldConfigMap<
  PartnerArtistDetails,
  ResolverContext
>> = () => ({
  ...IDFields,
  artist: {
    type: Artist.type,
  },
  biography: {
    type: GraphQLString,
  },
  biographyBlurb,
  counts,
  artworksConnection: {
    type: artworkConnection.connectionType,
    args: pageable({
      sort: ArtworksSort,
    }),
    resolve: (
      { partner: { id: partnerID }, artist: { id: artistID } },
      args,
      { partnerArtistPartnerArtistArtworksLoader }
    ) => {
      const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

      const gravityArgs = {
        total_count: true,
        sort: args.sort,
        page,
        size,
      }

      return partnerArtistPartnerArtistArtworksLoader(
        { partnerID, artistID },
        gravityArgs
      ).then(({ body, headers }) => {
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return {
          totalCount,
          ...connectionFromArraySlice(body, args, {
            arrayLength: totalCount,
            sliceStart: offset,
            resolveNode: (node) => node.artwork,
          }),
        }
      })
    },
  },
  isDisplayOnPartnerProfile: {
    type: GraphQLBoolean,
    resolve: ({ display_on_partner_profile }) => display_on_partner_profile,
  },
  representedBy: {
    type: GraphQLBoolean,
    resolve: ({ represented_by }) => represented_by,
  },
  isUseDefaultBiography: {
    type: GraphQLBoolean,
    resolve: ({ use_default_biography }) => use_default_biography,
  },
  partner: {
    type: PartnerType,
  },
  sortableID: {
    type: GraphQLString,
    resolve: ({ sortable_id }) => sortable_id,
  },
})

export const PartnerArtistType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerArtist",
  fields,
})

const PartnerArtist: GraphQLFieldConfig<void, ResolverContext> = {
  type: PartnerArtistType,
  description: "A PartnerArtist",
  args: {
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Artist",
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Partner",
    },
  },
  resolve: (
    _root,
    { partnerID: partner_id, artistID: artist_id },
    { partnerArtistLoader }
  ) => partnerArtistLoader({ artist_id, partner_id }),
}

export default PartnerArtist

export const partnersForArtist = (
  artist_id,
  options,
  loader: StaticPathLoader<BodyAndHeaders>
) => {
  // Convert `after` cursors to page params
  const { limit: size, offset } = getPagingParameters(options)
  // Construct an object of all the params gravity will listen to
  const {
    represented_by,
    partner_category,
    display_on_partner_profile,
  } = options
  const gravityArgs = {
    total_count: true,
    size,
    offset,
    artist_id,
    display_on_partner_profile,
    represented_by,
    partner_category,
  }

  return loader(gravityArgs).then(({ body, headers }) => {
    return connectionFromArraySlice(body, options, {
      arrayLength: parseInt(headers["x-total-count"] || "0", 10),
      sliceStart: offset,
      resolveNode: (node) => node.partner, // Can also be a promise: `partnerLoader(node.partner.id)`
    })
  })
}
