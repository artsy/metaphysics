import { PartnerType } from "./partner"
import Artist from "./artist/index"
import numeral from "./fields/numeral"
import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  Thunk,
  GraphQLFieldConfigMap,
  GraphQLFieldConfig,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { BodyAndHeaders } from "lib/loaders"

// TODO: This should move to the gravity loader
interface PartnerArtistDetails {
  sortable_id: string
  is_use_default_biography: boolean
  published_artworks_count: number
  published_for_sale_artworks_count: number
  display_on_partner_profile: boolean
  represented_by: boolean
}

const counts: GraphQLFieldConfig<PartnerArtistDetails, ResolverContext> = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "PartnerArtistCounts",
    fields: {
      artworks: numeral(
        ({ published_artworks_count }) => published_artworks_count
      ),
      forSaleArtworks: numeral(
        ({ published_for_sale_artworks_count }) =>
          published_for_sale_artworks_count
      ),
    },
  }),
  resolve: (partner_artist) => partner_artist,
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
  counts,
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
    resolve: ({ is_use_default_biography }) => is_use_default_biography,
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
