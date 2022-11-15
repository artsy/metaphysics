import moment from "moment"
import { pageable } from "relay-cursor-paging"
import {
  connectionFromArraySlice,
  connectionFromArray,
  connectionDefinitions,
  Connection,
} from "graphql-relay"
import {
  isExisty,
  existyValue,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import { HTTPError } from "lib/HTTPError"
import numeral from "./fields/numeral"
import { dateRange, exhibitionStatus } from "lib/date"
import cached from "./fields/cached"
import date from "./fields/date"
import { markdown } from "./fields/markdown"
import Artist from "./artist"
import { PartnerType } from "schema/v2/partner/partner"
import { ExternalPartnerType } from "./external_partner"
import Fair from "./fair"
import { artworkConnection } from "./artwork"
import { LocationType } from "./location"
import Image, { getDefault, normalizeImageData } from "./image"
import ShowEventType from "./show_event"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { NodeInterface, SlugAndInternalIDFields } from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLUnionType,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
} from "graphql"
import { totalViaLoader } from "lib/total"
import { find, flatten } from "lodash"

import ShowSorts from "./sorts/show_sorts"
import EventStatus from "./input_fields/event_status"
import { LOCAL_DISCOVERY_RADIUS_KM } from "./city/constants"
import { ResolverContext } from "types/graphql"
import followArtistsResolver from "lib/shared_resolvers/followedArtistsResolver"
import { ExhibitionPeriodFormatEnum } from "./types/exhibitonPeriod"

const FollowArtistType = new GraphQLObjectType<any, ResolverContext>({
  name: "ShowFollowArtist",
  fields: () => ({
    artist: {
      type: Artist.type,
    },
  }),
})

const kind = ({ artists, fair, artists_without_artworks, group }) => {
  if (isExisty(fair)) return "fair"
  if (
    group ||
    artists.length > 1 ||
    (artists_without_artworks && artists_without_artworks.length > 1)
  ) {
    return "group"
  }
  if (
    artists.length === 1 ||
    (artists_without_artworks && artists_without_artworks.length === 1)
  ) {
    return "solo"
  }
}

const artworksArgs: GraphQLFieldConfigArgumentMap = {
  exclude: {
    type: new GraphQLList(GraphQLString),
    description:
      "List of artwork IDs to exclude from the response (irrespective of size)",
  },
  forSale: {
    type: GraphQLBoolean,
    defaultValue: false,
  },
  published: {
    type: GraphQLBoolean,
    defaultValue: true,
  },
}

export const ShowType = new GraphQLObjectType<any, ResolverContext>({
  name: "Show",
  interfaces: () => {
    const {
      EntityWithFilterArtworksConnectionInterface,
    } = require("./filterArtworksConnection")
    return [NodeInterface, EntityWithFilterArtworksConnectionInterface]
  },
  fields: () => {
    const {
      filterArtworksConnectionWithParams,
    } = require("./filterArtworksConnection")
    return {
      ...SlugAndInternalIDFields,
      cached,
      artists: {
        description: "The Artists presenting in this show",
        type: new GraphQLList(Artist.type),
        resolve: ({ artists }) => {
          return artists
        },
      },
      artworksConnection: {
        description: "The artworks featured in the show.",
        type: artworkConnection.connectionType,
        args: pageable(artworksArgs),
        resolve: async (show, options, { partnerShowArtworksLoader }) => {
          const loaderOptions = {
            partner_id: show.partner.id,
            show_id: show.id,
          }

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            options
          )

          const gravityArgs: {
            exclude_ids?: string[]
            page: number
            size: number
            total_count: boolean
          } = {
            page,
            size,
            total_count: true,
          }

          if (options.exclude) {
            gravityArgs.exclude_ids = flatten([options.exclude])
          }

          const { body, headers = {} } = await partnerShowArtworksLoader(
            loaderOptions,
            gravityArgs
          )

          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return {
            totalCount,
            ...connectionFromArraySlice(body, options, {
              arrayLength: totalCount,
              sliceStart: offset,
            }),
          }
        },
      },
      artworksCount: {
        description:
          "The total count of artworks, both unpublished and published, in a show",
        type: GraphQLInt,
        resolve: ({ artworks_count }) => artworks_count,
      },
      artistsWithoutArtworks: {
        description: "Artists inside the show who do not have artworks present",
        type: new GraphQLList(Artist.type),
        resolve: ({ artists_without_artworks }) => artists_without_artworks,
      },
      artistsGroupedByName: {
        description: "Artists in the show grouped by last name",
        type: new GraphQLList(
          new GraphQLObjectType<any, ResolverContext>({
            name: "ArtistGroup",
            fields: {
              letter: {
                type: GraphQLString,
                description: "Letter artists group belongs to",
              },
              items: {
                type: new GraphQLList(Artist.type),
                description: "Artists sorted by last name",
              },
            },
          })
        ),
        resolve: ({ artists }) => {
          const groups: {
            [letter: string]: {
              letter: string
              items: [string]
            }
          } = {}
          const sortedArtists = artists.sort((a, b) => {
            const aNames = a.name.split(" ")
            const bNames = b.name.split(" ")
            const aLastName = aNames[aNames.length - 1]
            const bLastName = bNames[bNames.length - 1]
            if (aLastName < bLastName) return -1
            if (aLastName > bLastName) return 1
            return 0
          })
          for (const artist of sortedArtists) {
            const names = artist.name.split(" ")
            const lastName = names[names.length - 1]
            const letter = lastName.substring(0, 1).toUpperCase()
            if (groups[letter] !== undefined) {
              groups[letter].items.push(artist)
            } else {
              groups[letter] = {
                letter,
                items: [artist],
              }
            }
          }
          return Object.values(groups)
        },
      },
      city: {
        description:
          "The general city, derived from a fair location, a show location or a potential city",
        type: GraphQLString,
        resolve: ({ fair, location, partner_city }) => {
          if (fair && fair.location && fair.location.city) {
            return fair.location.city
          }
          if (location && isExisty(location.city)) {
            return location.city
          }
          return existyValue(partner_city)
        },
      },
      coverImage: {
        description: "The image you should use to represent this show",
        type: Image.type,
        resolve: (
          { id, partner, image_versions, image_url },
          _options,
          { partnerShowArtworksLoader }
        ) => {
          if (image_versions && image_versions.length && image_url) {
            return normalizeImageData({
              image_versions,
              image_url,
            })
          }
          if (partner) {
            return partnerShowArtworksLoader(
              {
                partner_id: partner.id,
                show_id: id,
              },
              {
                size: 1,
                published: true,
              }
            )
              .then(({ body }) => {
                const artwork = body[0]
                return artwork && normalizeImageData(getDefault(artwork.images))
              })
              .catch(() => null)
          }
          return null
        },
      },
      counts: {
        description:
          "An object that represents some of the numbers you might want to highlight",
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "ShowCounts",
          fields: {
            artworks: {
              type: GraphQLInt,
              args: {
                artistID: {
                  type: GraphQLString,
                  description: "The slug or ID of an artist in the show.",
                },
              },
              resolve: (
                { id, partner },
                { artistID },
                { partnerShowArtworksLoader }
              ) => {
                const options: any = {
                  artist_id: artistID,
                }
                return totalViaLoader(
                  partnerShowArtworksLoader,
                  {
                    partner_id: partner.id,
                    show_id: id,
                  },
                  options
                )
              },
            },
            eligibleArtworks: numeral(
              ({ eligible_artworks_count }) => eligible_artworks_count
            ),
            artists: {
              type: GraphQLInt,
              resolve: (
                { id, partner },
                options,
                { partnerShowArtistsLoader }
              ) => {
                return totalViaLoader(
                  partnerShowArtistsLoader,
                  {
                    partner_id: partner.id,
                    show_id: id,
                  },
                  options
                )
              },
            },
          },
        }),
        resolve: (partner_show) => partner_show,
      },
      createdAt: date,
      description: {
        description: "A description of the show",
        type: GraphQLString,
      },
      endAt: date,
      events: {
        description: "Events from the partner that runs this show",
        type: new GraphQLList(ShowEventType),
        resolve: ({ partner, id }, _options, { partnerShowLoader }) =>
          partnerShowLoader({
            partner_id: partner.id,
            show_id: id,
          }).then(({ events }) => events),
      },
      exhibitionPeriod: {
        type: GraphQLString,
        description: "A formatted description of the start to end dates",
        args: {
          format: {
            type: ExhibitionPeriodFormatEnum,
            description: "Formatting option to apply to exhibition period",
            defaultValue: ExhibitionPeriodFormatEnum.getValue("LONG"),
          },
        },
        resolve: ({ start_at, end_at }, args) => {
          const { format } = args
          return dateRange(start_at, end_at, "UTC", format)
        },
      },
      fair: {
        description: "If the show is in a Fair, then that fair",
        type: Fair.type,
        resolve: ({ fair }) => fair,
      },
      filterArtworksConnection: filterArtworksConnectionWithParams(
        ({ _id, partner }) => ({
          partner_show_id: _id,
          partner_id: partner.id,
        })
      ),
      href: {
        description: "A path to the show on Artsy",
        type: GraphQLString,
        resolve: ({ id, is_reference, displayable }) => {
          if (is_reference || !displayable) return null
          return `/show/${id}`
        },
      },
      images: {
        description:
          "Images that represent the show, you may be interested in meta_image or cover_image for a definitive thumbnail",
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
      hasLocation: {
        type: GraphQLBoolean,
        description: "Flag showing if show has any location.",
        resolve: ({ location, fair, partner_city }) => {
          return isExisty(location || fair || partner_city)
        },
      },
      isFeatured: {
        type: GraphQLBoolean,
        resolve: ({ featured }) => featured,
      },
      isActive: {
        type: GraphQLBoolean,
        description:
          "Gravity doesn’t expose the `active` flag. Temporarily re-state its logic.",
        resolve: ({ start_at, end_at }) => {
          const start = moment.utc(start_at).subtract(7, "days")
          const end = moment.utc(end_at).add(7, "days")
          return moment.utc().isBetween(start, end)
        },
      },
      isReverseImageSearchEnabled: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: "Have we indexed this show's artworks to tineye?",
        resolve: ({ reverse_image_search_enabled }) => {
          return !!reverse_image_search_enabled
        },
      },
      isDisplayable: {
        description: "Is this something we can display to the front-end?",
        type: GraphQLBoolean,
        resolve: ({ displayable }) => displayable,
      },
      isFairBooth: {
        description: "Does the show exist as a fair booth?",
        type: GraphQLBoolean,
        resolve: ({ fair }) => isExisty(fair),
      },
      isOnlineExclusive: {
        description: "Does the show exist soley online",
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: ({ location, fair, partner_city }) => {
          return !location && !isExisty(fair) && !partner_city
        },
      },
      isReference: {
        description: "Is it a show provided for historical reference?",
        type: GraphQLBoolean,
        resolve: ({ is_reference }) => is_reference,
      },
      isStubShow: {
        description: "Is it an outsourced local discovery stub show?",
        type: GraphQLBoolean,
        resolve: ({ is_local_discovery }) => is_local_discovery,
      },
      kind: {
        description: "Whether the show is in a fair, group or solo",
        type: GraphQLString,
        resolve: (show, _options, { partnerShowLoader }) => {
          if (show.artists || show.artists_without_artworks) return kind(show)
          return partnerShowLoader({
            partner_id: show.partner.id,
            show_id: show.id,
          }).then(kind)
        },
      },
      location: {
        description:
          "Where the show is located (Could also be a fair location)",
        type: LocationType,
        resolve: ({ location, fair_location }) => location || fair_location,
      },
      metaImage: {
        description:
          "An image representing the show, or a sharable image from an artwork in the show",
        type: Image.type,
        resolve: (
          { id, partner, image_versions, image_url },
          _options,
          { partnerShowArtworksLoader }
        ) => {
          if (image_versions && image_versions.length && image_url) {
            return normalizeImageData({
              image_versions,
              image_url,
            })
          }
          return partnerShowArtworksLoader(
            {
              partner_id: partner.id,
              show_id: id,
            },
            {
              published: true,
            }
          ).then(({ body }) => {
            return normalizeImageData(
              getDefault(
                find(body, {
                  can_share_image: true,
                })
              )
            )
          })
        },
      },
      isFollowed: {
        type: GraphQLBoolean,
        description: "Is the user following this show",
        resolve: async ({ _id }, _args, { followedShowLoader }) => {
          if (!followedShowLoader) return null
          return followedShowLoader(_id).then(({ is_followed }) => is_followed)
        },
      },
      name: {
        type: GraphQLString,
        description: "The exhibition title",
        resolve: ({ name }) => (isExisty(name) ? name.trim() : name),
      },
      nearbyShowsConnection: {
        description: "Shows that are near (~75km) from this show",
        type: ShowsConnection.connectionType,
        args: pageable({
          sort: {
            type: ShowSorts,
          },
          status: {
            type: EventStatus.type,
            defaultValue: "CURRENT",
            description: "By default show only current shows",
          },
          discoverable: {
            type: GraphQLBoolean,
            description:
              "Whether to include local discovery stubs as well as displayable shows",
          },
        }),
        resolve: async (show, args, { showsWithHeadersLoader }) => {
          // Bail with an empty array if we can't get the lat/long for this show
          if (!show.location || !show.location.coordinates) {
            return connectionFromArray([], args)
          }
          // Manually toLowerCase to handle issue with resolving Enum default value
          args.status = args.status.toLowerCase()
          const coordinates = show.location.coordinates
          const gravityOptions = {
            ...convertConnectionArgsToGravityArgs(args),
            displayable: true,
            near: `${coordinates.lat},${coordinates.lng}`,
            max_distance: LOCAL_DISCOVERY_RADIUS_KM,
            has_location: true,
            total_count: true,
          }
          // @ts-expect-error FIXME: Make `page` an optional parameter on `gravityOptions`
          delete gravityOptions.page
          if (args.discoverable) {
            // @ts-expect-error FIXME: Make `displayable` an optional parameter on `gravityOptions`
            delete gravityOptions.displayable
          }
          const response = await showsWithHeadersLoader(gravityOptions)
          const { headers, body: cities } = response
          const results = connectionFromArraySlice(cities, args, {
            arrayLength: parseInt(headers["x-total-count"] || "0", 10),
            sliceStart: gravityOptions.offset,
          }) as Connection<any> & { totalCount: number }
          // This is in our schema, so might as well fill it
          results.totalCount = parseInt(headers["x-total-count"] || "0", 10)
          return results
        },
      },
      openingReceptionText: {
        type: GraphQLString,
        description:
          "Alternate Markdown-supporting free text representation of the opening reception event’s date/time",
        resolve: ({ opening_reception_text }) => opening_reception_text,
      },
      partner: {
        description:
          "The partner that represents this show, could be a non-Artsy partner",
        type: new GraphQLUnionType({
          name: "PartnerTypes",
          types: [PartnerType, ExternalPartnerType],
          resolveType: (value) => {
            if (value._links) {
              return ExternalPartnerType
            }
            return PartnerType
          },
        }),
        resolve: (
          { partner, galaxy_partner_id },
          _options,
          { galaxyGalleryLoader }
        ) => {
          if (partner) {
            return partner
          }
          if (galaxy_partner_id) {
            return galaxyGalleryLoader(galaxy_partner_id)
          }
        },
      },
      pressRelease: {
        description: "The press release for this show",
        ...markdown(({ press_release }) => press_release),
      },
      pressReleaseUrl: {
        type: GraphQLString,
        description: "Link to the press release for this show",
        resolve: ({ press_release_url }) => press_release_url,
      },
      startAt: {
        description: "When this show starts",
        ...date,
      },
      status: {
        description: "Is this show running, upcoming or closed?",
        type: GraphQLString,
      },
      statusUpdate: {
        type: GraphQLString,
        description: "A formatted update on upcoming status changes",
        args: {
          maxDays: {
            type: GraphQLInt,
            description: "Before this many days no update will be generated",
          },
        },
        resolve: ({ start_at, end_at }, { maxDays }) => {
          const options: any = {
            max_days: maxDays,
          }
          return exhibitionStatus(start_at, end_at, options.max_days)
        },
      },
      type: {
        description: "Is it a fair booth or a show?",
        type: GraphQLString,
        resolve: ({ fair }) => (isExisty(fair) ? "Fair Booth" : "Show"),
      },
      followedArtistsConnection: {
        type: connectionDefinitions({ nodeType: FollowArtistType })
          .connectionType,
        args: pageable({}),
        description:
          "A Connection of followed artists by current user for this show",
        resolve: (show, args, context) =>
          followArtistsResolver({ show_id: show.id }, args, context),
      },
      viewingRoomIDs: {
        type: new GraphQLNonNull(
          GraphQLList(new GraphQLNonNull(GraphQLString))
        ),
        resolve: ({ viewing_room_ids }) => viewing_room_ids,
      },
    }
  },
})

const Show: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShowType,
  description: "A Show",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Show",
    },
  },
  resolve: (_root, { id }, { showLoader }) => {
    // TODO: allowlist filterArtworksConnection
    return showLoader(id).then((show) => {
      if (
        !(
          show.displayable ||
          show.is_local_discovery ||
          show.is_reference ||
          isExisty(show.fair)
        )
      ) {
        return new HTTPError("Show Not Found", 404)
      }
      return show
    })
  },
}

export default Show
export const ShowsConnection = connectionWithCursorInfo({ nodeType: ShowType })
