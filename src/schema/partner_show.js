import moment from "moment"
import { isExisty, exclude } from "lib/helpers"
import { find } from "lodash"
import HTTPError from "lib/http_error"
import numeral from "./fields/numeral"
import { exhibitionPeriod, exhibitionStatus } from "lib/date"
import cached from "./fields/cached"
import date from "./fields/date"
import { markdown } from "./fields/markdown"
import Artist from "./artist"
import Partner from "./partner"
import Fair from "./fair"
import Artwork from "./artwork"
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
} from "graphql"
import { allViaLoader } from "../lib/all"
import { totalViaLoader } from "lib/total"

const kind = ({ artists, fair }) => {
  if (isExisty(fair)) return "fair"
  if (artists.length > 1) return "group"
  if (artists.length === 1) return "solo"
}

const PartnerShowType = new GraphQLObjectType({
  name: "PartnerShow",
  deprecationReason: "Prefer to use Show schema",
  interfaces: [NodeInterface],
  fields: () => ({
    ...GravityIDFields,
    cached,
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: ({ artists }) => artists,
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      args: {
        all: {
          type: GraphQLBoolean,
          default: false,
        },
        exclude: {
          type: new GraphQLList(GraphQLString),
          description:
            "List of artwork IDs to exclude from the response (irrespective of size)",
        },
        for_sale: {
          type: GraphQLBoolean,
          default: false,
        },
        published: {
          type: GraphQLBoolean,
          defaultValue: true,
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
          ).then(({ body }) => body)
        }

        return fetch.then(exclude(options.exclude, "id"))
      },
    },
    counts: {
      type: new GraphQLObjectType({
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
              request,
              { rootValue: { partnerShowArtworksLoader } }
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
      resolve: partner_show => partner_show,
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
            return artwork && Image.resolve(getDefault(artwork.images))
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
      resolve: ({ start_at, end_at }) => exhibitionPeriod(start_at, end_at),
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
      resolve: (
        { id },
        options,
        request,
        { rootValue: { partnerShowImagesLoader } }
      ) => {
        return partnerShowImagesLoader(id, options).then(Image.resolve)
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
      resolve: (
        show,
        options,
        request,
        { rootValue: { partnerShowLoader } }
      ) => {
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
        options,
        request,
        { rootValue: { partnerShowArtworksLoader } }
      ) => {
        if (image_versions && image_versions.length && image_url) {
          return Image.resolve({ image_versions, image_url })
        }

        return partnerShowArtworksLoader(
          { partner_id: partner.id, show_id: id },
          {
            published: true,
          }
        ).then(({ body }) => {
          return Image.resolve(
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
  }),
})

const PartnerShow = {
  type: PartnerShowType,
  description: "A Partner Show",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the PartnerShow",
    },
  },
  resolve: (root, { id }, request, { rootValue: { showLoader } }) => {
    return showLoader(id).then(show => {
      if (!show.displayable) {
        return new HTTPError("Show Not Found", 404)
      }
      return show
    })
  },
}

export default PartnerShow
