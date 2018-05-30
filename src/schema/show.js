import moment from "moment"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { isExisty, exclude, existyValue, parseRelayOptions } from "lib/helpers"
import { find } from "lodash"
import HTTPError from "lib/http_error"
import numeral from "./fields/numeral"
import { exhibitionPeriod, exhibitionStatus } from "lib/date"
import cached from "./fields/cached"
import date from "./fields/date"
import { markdown } from "./fields/markdown"
import Artist from "./artist"
import Partner from "./partner"
import ExternalPartner from "./external_partner"
import Fair from "./fair"
import Artwork, { artworkConnection } from "./artwork"
import Location from "./location"
import Image, { getDefault } from "./image"
import PartnerShowEventType from "./partner_show_event"
import { GravityIDFields, NodeInterface } from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLUnionType,
} from "graphql"
import { allViaLoader } from "../lib/all"
import { totalViaLoader } from "lib/total"

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

  return undefined // explicitly return undefined
}

const artworksArgs = {
  size: {
    type: GraphQLInt,
    description: "Number of artworks to return",
    defaultValue: 25,
  },
  published: {
    type: GraphQLBoolean,
    defaultValue: true,
  },
  page: {
    type: GraphQLInt,
    defaultValue: 1,
  },
  all: {
    type: GraphQLBoolean,
    default: false,
  },
  for_sale: {
    type: GraphQLBoolean,
    default: false,
  },
  exclude: {
    type: new GraphQLList(GraphQLString),
    description:
      "List of artwork IDs to exclude from the response (irrespective of size)",
  },
}

export const ShowType = new GraphQLObjectType({
  name: "Show",
  interfaces: [NodeInterface],
  fields: () => {return {
    ...GravityIDFields,
    cached,
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: ({ artists }) => {return artists},
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      args: artworksArgs,
      resolve: (
        show,
        options,
        request,
        { rootValue: { partnerShowArtworksLoader } }
      ) => {
        let fetch = null

        if (options.all) {
          fetch = allViaLoader(
            partnerShowArtworksLoader,
            { partner_id: show.partner.id, show_id: show.id },
            options
          )
        } else {
          fetch = partnerShowArtworksLoader(
            { partner_id: show.partner.id, show_id: show.id },
            options
          ).then(({ body }) => {return body})
        }

        return fetch.then(exclude(options.exclude, "id"))
      },
    },
    artworks_connection: {
      type: artworkConnection,
      args: pageable(artworksArgs),
      resolve: (
        show,
        options,
        request,
        { rootValue: { partnerShowArtworksLoader } }
      ) => {
        const loaderOptions = {
          partner_id: show.partner.id,
          show_id: show.id,
        }
        const gravityOptions = parseRelayOptions(options)
        delete gravityOptions.page

        return Promise.all([
          totalViaLoader(
            partnerShowArtworksLoader,
            loaderOptions,
            Object.assign({}, gravityOptions, { size: 0 })
          ),
          partnerShowArtworksLoader(loaderOptions, gravityOptions),
        ]).then(([count, { body }]) =>
          {return connectionFromArraySlice(body, options, {
            arrayLength: count,
            sliceStart: gravityOptions.offset,
          })}
        )
      },
    },
    artists_without_artworks: {
      type: new GraphQLList(Artist.type),
      resolve: ({ artists_without_artworks }) => {return artists_without_artworks},
    },
    city: {
      type: GraphQLString,
      resolve: ({ location, partner_city }) => {
        if (location && isExisty(location.city)) {
          return location.city
        }
        return existyValue(partner_city)
      },
    },
    cover_image: {
      type: Image.type,
      resolve: (
        { id, partner, image_versions, image_url },
        options,
        request,
        { rootValue: { partnerShowArtworksLoader } }
      ) => {
        if (image_versions && image_versions.length && image_url) {
          return Image.resolve({ image_versions, image_url })
        }

        if (partner) {
          partnerShowArtworksLoader(
            { partner_id: partner.id, show_id: id },
            {
              size: 1,
              published: true,
            }
          )
            .then(({ body }) => {
              const artwork = body[0]
              return artwork && Image.resolve(getDefault(artwork.images))
            })
            .catch(e => {
              throw e
            })
        }

        return undefined // explicitly return undefined
      },
    },
    counts: {
      type: new GraphQLObjectType({
        name: "ShowCounts",
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
              request,
              { rootValue: { partnerShowArtworksLoader } }
            ) =>
              {return totalViaLoader(
                partnerShowArtworksLoader,
                { partner_id: partner.id, show_id: id },
                options
              )},
          },
          eligible_artworks: numeral(
            ({ eligible_artworks_count }) => {return eligible_artworks_count}
          ),
        },
      }),
      resolve: partner_show => {return partner_show},
    },
    description: {
      type: GraphQLString,
    },
    displayable: {
      type: GraphQLBoolean,
      deprecationReason: "Prefix Boolean returning fields with `is_`",
    },
    end_at: date,
    events: {
      type: new GraphQLList(PartnerShowEventType),
      resolve: (
        { partner, id },
        options,
        request,
        { rootValue: { partnerShowLoader } }
      ) =>
        {return partnerShowLoader({ partner_id: partner.id, show_id: id }).then(
          ({ events }) => {return events}
        )},
    },
    exhibition_period: {
      type: GraphQLString,
      description: "A formatted description of the start to end dates",
      resolve: ({ start_at, end_at }) => {return exhibitionPeriod(start_at, end_at)},
    },
    fair: {
      type: Fair.type,
      resolve: ({ fair }) => {return fair},
    },
    href: {
      type: GraphQLString,
      resolve: ({ id, is_reference, displayable }) => {
        if (is_reference || !displayable) return null
        return `/show/${id}`
      },
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
      resolve: (
        { id },
        options,
        request,
        { rootValue: partnerShowImagesLoader }
      ) => {return partnerShowImagesLoader(id, options).then(Image.resolve)},
    },
    has_location: {
      type: GraphQLBoolean,
      description: "Flag showing if show has any location.",
      resolve: ({ location, fair, partner_city }) =>
        {return isExisty(location || fair || partner_city)},
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
      resolve: ({ displayable }) => {return displayable},
    },
    is_fair_booth: {
      type: GraphQLBoolean,
      resolve: ({ fair }) => {return isExisty(fair)},
    },
    is_reference: {
      type: GraphQLBoolean,
      resolve: ({ is_reference }) => {return is_reference},
    },
    kind: {
      type: GraphQLString,
      resolve: (
        show,
        options,
        request,
        { rootValue: { partnerShowLoader } }
      ) => {
        if (show.artists || show.artists_without_artworks) return kind(show)
        return partnerShowLoader({
          partner_id: show.partner.id,
          show_id: show.id,
        }).then(kind)
      },
    },
    location: {
      type: Location.type,
      resolve: ({ location, fair_location }) => {return location || fair_location},
    },
    meta_image: {
      type: Image.type,
      resolve: (
        { id, partner, image_versions, image_url },
        options,
        request,
        { rootValue: { partnerShowArtworksLoader } }
      ) => {
        if (image_versions && image_versions.length && image_url) {
          return Image.resolve({
            image_versions,
            image_url,
          })
        }
        return partnerShowArtworksLoader(
          { partner_id: partner.id, show_id: id },
          {
            published: true,
          }
        )
          .then(({ body }) =>
            {return Image.resolve(getDefault(find(body, { can_share_image: true })))}
          )
          .catch(e => {
            throw e
          })
      },
    },
    name: {
      type: GraphQLString,
      description: "The exhibition title",
      resolve: ({ name }) => {return (isExisty(name) ? name.trim() : name)},
    },
    partner: {
      type: new GraphQLUnionType({
        name: "PartnerTypes",
        types: [Partner.type, ExternalPartner.type],
        resolveType: value => {
          if (value._links) {
            return ExternalPartner.type
          }
          return Partner.type
        },
      }),
      resolve: (
        { partner, galaxy_partner_id },
        options,
        request,
        { rootValue: { galaxyGalleriesLoader } }
      ) => {
        if (partner) {
          return partner
        }
        if (galaxy_partner_id) {
          return galaxyGalleriesLoader(galaxy_partner_id)
        }

        return undefined // explicitly return undefined
      },
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
        {return exhibitionStatus(start_at, end_at, options.max_days)},
    },
    type: {
      type: GraphQLString,
      resolve: ({ fair }) => {return (isExisty(fair) ? "Fair Booth" : "Show")},
    },
  }},
})
const Show = {
  type: ShowType,
  description: "A Show",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Show",
    },
  },
  resolve: (root, { id }, request, { rootValue: { showLoader } }) =>
    {return showLoader(id)
      .then(show => {
        if (!show.displayable && !show.is_reference) {
          return new HTTPError("Show Not Found", 404)
        }
        return show
      })
      .catch(() => {return null})},
}
export default Show
export const showConnection = connectionDefinitions({
  nodeType: Show.type,
}).connectionType
