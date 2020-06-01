import moment from "moment"
import {
  isExisty,
  exclude,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import { find, flatten } from "lodash"
import { HTTPError } from "lib/HTTPError"
import numeral from "./fields/numeral"
import { dateRange, exhibitionStatus } from "lib/date"
import cached from "./fields/cached"
import date from "./fields/date"
import { markdown } from "./fields/markdown"
import Artist from "./artist"
import Partner from "./partner"
import Fair from "./fair"
import Artwork, { artworkConnection } from "./artwork"
import Location from "./location"
import Image, { getDefault, normalizeImageData } from "./image"
import PartnerShowEventType from "./partner_show_event"
import { NodeInterface, SlugAndInternalIDFields } from "./object_identification"
import { pageable } from "relay-cursor-paging"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
} from "graphql"
import { allViaLoader } from "lib/all"
import { totalViaLoader } from "lib/total"
import { connectionFromArraySlice } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { deprecate, deprecateType } from "lib/deprecation"

const kind = ({ artists, fair }) => {
  if (isExisty(fair)) return "fair"
  if (artists.length > 1) return "group"
  if (artists.length === 1) return "solo"
}

const artworksArgs: GraphQLFieldConfigArgumentMap = {
  exclude: {
    type: new GraphQLList(GraphQLString),
    description:
      "List of artwork IDs to exclude from the response (irrespective of size)",
  },
  for_sale: {
    type: GraphQLBoolean,
    defaultValue: false,
  },
  published: {
    type: GraphQLBoolean,
    defaultValue: true,
  },
}

/**
 * This type is deprecated entirely, use Show instead.
 */
export const PartnerShowType = deprecateType(
  { inVersion: 2, preferUsageOf: "Show" },
  new GraphQLObjectType<any, ResolverContext>({
    name: "PartnerShow",
    interfaces: [NodeInterface],
    fields: () => {
      return {
        ...SlugAndInternalIDFields,
        cached,
        artists: {
          type: new GraphQLList(Artist.type),
          resolve: ({ artists }) => artists,
        },
        artworks: {
          type: new GraphQLList(Artwork.type),
          description: "The artworks featured in the show",
          args: {
            ...artworksArgs,
            all: {
              type: GraphQLBoolean,
              default: false,
            },
            page: {
              type: GraphQLInt,
              defaultValue: 1,
            },
            size: {
              type: GraphQLInt,
              description: "Number of artworks to return",
              defaultValue: 25,
            },
          },
          resolve: (show, options, { partnerShowArtworksLoader }) => {
            let fetch: Promise<any>
            if (options.all) {
              fetch = allViaLoader(partnerShowArtworksLoader, {
                path: { partner_id: show.partner.id, show_id: show.id },
                params: options,
              })
            } else {
              fetch = partnerShowArtworksLoader(
                { partner_id: show.partner.id, show_id: show.id },
                options
              ).then(({ body }) => body)
            }

            // @ts-ignore
            // FIXME: Update with Gravity param when ready
            return fetch.then(exclude(options.exclude, "id"))
          },
        },
        artworksConnection: {
          description: "A connection of artworks featured in the show",
          type: artworkConnection,
          args: pageable(artworksArgs),
          resolve: (show, options, { partnerShowArtworksLoader }) => {
            const loaderOptions = {
              partner_id: show.partner.id,
              show_id: show.id,
            }
            const { page, size, offset } = convertConnectionArgsToGravityArgs(
              options
            )

            interface GravityArgs {
              exclude_ids?: string[]
              page: number
              size: number
              total_count: boolean
            }

            const gravityArgs: GravityArgs = {
              page,
              size,
              total_count: true,
            }

            if (options.exclude) {
              gravityArgs.exclude_ids = flatten([options.exclude])
            }

            return partnerShowArtworksLoader(loaderOptions, gravityArgs).then(
              ({ body, headers }) => {
                return connectionFromArraySlice(body, options, {
                  arrayLength: parseInt(headers["x-total-count"] || "0", 10),
                  sliceStart: offset,
                })
              }
            )
          },
        },
        counts: {
          type: new GraphQLObjectType<any, ResolverContext>({
            name: "PartnerShowCounts",
            fields: {
              artworks: {
                type: GraphQLInt,
                args: {
                  artist_id: {
                    type: GraphQLString,
                    description: "The slug or ID of an artist in the show.",
                  },
                },
                resolve: (
                  { id, partner },
                  options,
                  { partnerShowArtworksLoader }
                ) => {
                  return totalViaLoader(
                    partnerShowArtworksLoader,
                    { partner_id: partner.id, show_id: id },
                    options
                  )
                },
              },
              eligible_artworks: numeral(
                ({ eligible_artworks_count }) => eligible_artworks_count
              ),
            },
          }),
          resolve: (partner_show) => partner_show,
        },
        cover_image: {
          type: Image.type,
          resolve: (
            { id, partner, image_versions, image_url },
            _options,
            { partnerShowArtworksLoader }
          ) => {
            if (image_versions && image_versions.length && image_url) {
              return normalizeImageData({ image_versions, image_url })
            }

            return (
              partner &&
              partnerShowArtworksLoader(
                { partner_id: partner.id, show_id: id },
                {
                  size: 1,
                  published: true,
                }
              ).then(({ body }) => {
                const artwork = body[0]
                return artwork && normalizeImageData(getDefault(artwork.images))
              })
            )
          },
        },
        created_at: date,
        description: {
          type: GraphQLString,
        },
        displayable: {
          type: GraphQLBoolean,
          deprecationReason: deprecate({
            inVersion: 2,
            preferUsageOf: "is_displayable",
          }),
        },
        end_at: date,
        events: {
          type: new GraphQLList(PartnerShowEventType),
          resolve: ({ partner, id }, _options, { partnerShowLoader }) =>
            // Gravity redirects from /api/v1/show/:id => /api/v1/partner/:partner_id/show/:show_id
            // this creates issues where events will remain cached. Fetch the non-redirected
            // route to circumvent this
            partnerShowLoader({ partner_id: partner.id, show_id: id }).then(
              ({ events }) => events
            ),
        },
        exhibition_period: {
          type: GraphQLString,
          description: "A formatted description of the start to end dates",
          resolve: ({ start_at, end_at }) => dateRange(start_at, end_at, "UTC"),
        },
        fair: {
          type: Fair.type,
          resolve: ({ fair }) => fair,
        },
        href: {
          type: GraphQLString,
          resolve: ({ id }) => `/show/${id}`,
        },
        images: {
          type: new GraphQLList(Image.type),
          args: {
            size: {
              type: GraphQLInt,
              description: "Number of images to return",
            },
            default: {
              type: GraphQLBoolean,
              description: "Pass true/false to include cover or not",
            },
            page: {
              type: GraphQLInt,
            },
          },
          resolve: ({ id }, options, { partnerShowImagesLoader }) => {
            return partnerShowImagesLoader(id, options).then(normalizeImageData)
          },
        },
        has_location: {
          type: GraphQLBoolean,
          description: "Flag showing if show has any location.",
          resolve: ({ location, fair, partner_city }) => {
            return isExisty(location || fair || partner_city)
          },
        },
        is_active: {
          type: GraphQLBoolean,
          description:
            "Gravity doesn’t expose the `active` flag. Temporarily re-state its logic.",
          resolve: ({ start_at, end_at }) => {
            const start = moment.utc(start_at).subtract(7, "days")
            const end = moment.utc(end_at).add(7, "days")
            return moment.utc().isBetween(start, end)
          },
        },
        is_displayable: {
          type: GraphQLBoolean,
          resolve: ({ displayable }) => displayable,
        },
        is_fair_booth: {
          type: GraphQLBoolean,
          resolve: ({ fair }) => isExisty(fair),
        },
        kind: {
          type: GraphQLString,
          resolve: (show, _options, { partnerShowLoader }) => {
            if (show.artists) return kind(show)
            return partnerShowLoader({
              partner_id: show.partner.id,
              show_id: show.id,
            }).then(kind)
          },
        },
        location: {
          type: Location.type,
          resolve: ({ location, fair_location }) => location || fair_location,
        },
        meta_image: {
          type: Image.type,
          resolve: (
            { id, partner, image_versions, image_url },
            _options,
            { partnerShowArtworksLoader }
          ) => {
            if (image_versions && image_versions.length && image_url) {
              return normalizeImageData({ image_versions, image_url })
            }

            return partnerShowArtworksLoader(
              { partner_id: partner.id, show_id: id },
              {
                published: true,
              }
            ).then(({ body }) => {
              return normalizeImageData(
                getDefault(find(body, { can_share_image: true }))
              )
            })
          },
        },
        name: {
          type: GraphQLString,
          description: "The exhibition title",
        },
        partner: {
          type: Partner.type,
          resolve: ({ partner }) => partner,
        },
        press_release: markdown(),
        start_at: date,
        status: {
          type: GraphQLString,
        },
        status_update: {
          type: GraphQLString,
          description: "A formatted update on upcoming status changes",
          args: {
            max_days: {
              type: GraphQLInt,
              description: "Before this many days no update will be generated",
            },
          },
          resolve: ({ start_at, end_at }, options) =>
            exhibitionStatus(start_at, end_at, options.max_days),
        },
        type: {
          type: GraphQLString,
          resolve: ({ fair }) => (isExisty(fair) ? "Fair Booth" : "Show"),
        },
      }
    },
  })
)

const PartnerShow: GraphQLFieldConfig<void, ResolverContext> = {
  type: PartnerShowType,
  description: "A Partner Show",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the PartnerShow",
    },
  },
  resolve: (_root, { id }, { showLoader }) => {
    return showLoader(id).then((show) => {
      if (!show.displayable) {
        return new HTTPError("Show Not Found", 404)
      }
      return show
    })
  },
}

export default PartnerShow
