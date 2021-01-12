import { GraphQLObjectType, GraphQLString } from "graphql"
import { reduce } from "lodash"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "./fields/pagination"
import { SaleArtworkType } from "./sale_artwork"

const LotType = new GraphQLObjectType<any, ResolverContext>({
  name: "Lot",
  fields: () => ({
    internalID: {
      type: GraphQLString,
      resolve: ({ saleArtwork }) => saleArtwork._id,
    },
    saleArtwork: {
      type: SaleArtworkType,
      resolve: ({ saleArtwork }) => {
        return saleArtwork
      },
    },
    // internalID: ({saleArtwork}) => saleArtwork.id
    // ...InternalIDFields,
  }),
})

export const auctionLotConnection = connectionWithCursorInfo({
  nodeType: LotType,
})

export const watchedLotsConnection = {
  description: "A list of lots a user is watching",
  type: auctionLotConnection.connectionType,
  args: pageable(),
  resolve: async (_parent, _args, context) => {
    // rough approach:

    // get Sale Artworks
    // query gravity api/v2/sale_artworks?included_watched_artworks=true

    // get lot state for each sale artwork from causality (ex query:
    // query {
    //   lots( ids: saleArtworks.map(sa => sa.id) ) {
    //    # We probably have to select all graphql fields here?
    //   }
    // }

    // zip them together and return with full necessary relay fields
    const lotData = [lotStub]
    const lotDataMap = reduce(
      lotData,
      (acc, lot) => {
        acc[lot.internalID] = lot
        return acc
      },
      {}
    )

    context.lotDataMap = lotDataMap

    return {
      totalCount: 1,
      pageCursors: {},
      edges: [{ node: { saleArtwork: saleArtworkStub, lot: lotStub } }],
    }
  },
}

const saleArtworkStub = {
  artwork: {
    artist: {
      _id: "5f73a8584ea32a001317456e",
      id: "pedro-g-ocejo-huerta",
      sortable_id: "huerta-pedro-g-ocejo",
      name: "Pedro G. Ocejo Huerta",
      years: "born 1990",
      public: true,
      birthday: "1990",
      consignable: false,
      deathday: "",
      nationality: "Cuban",
      published_artworks_count: 23,
      forsale_artworks_count: 22,
      artworks_count: 23,
      original_width: 3764,
      original_height: 2772,
      image_url:
        "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/:version.jpg",
      image_versions: ["large", "square", "tall", "four_thirds"],
      image_urls: {
        large:
          "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/large.jpg",
        square:
          "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/square.jpg",
        tall:
          "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/tall.jpg",
        four_thirds:
          "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/four_thirds.jpg",
      },
      target_supply: false,
    },
    partner: {
      partner_categories: [],
      _id: "5ffca1d84f953900068cc5c7",
      id: "mocktion-demo-partner-deploy-test",
      default_profile_id: "mocktion-demo-partner-deploy-test",
      default_profile_public: true,
      sortable_id: "mocktion-demo-partner-deploy-test",
      type: "Auction",
      name: "Mocktion Demo Partner Deploy Test",
      short_name: null,
      pre_qualify: false,
      website: "",
      has_full_profile: false,
      has_fair_partnership: false,
      has_limited_fair_partnership: false,
      profile_layout: "gallery_default",
      display_works_section: true,
      profile_banner_display: null,
      profile_artists_layout: null,
      display_artists_section: true,
    },
    images: [
      {
        id: "5ffca1db4f953900068cc5cf",
        position: 1,
        aspect_ratio: 1.17,
        downloadable: false,
        original_width: 1024,
        original_height: 872,
        is_default: true,
        image_url:
          "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/:version.jpg",
        image_versions: [
          "square",
          "small",
          "larger",
          "medium",
          "large",
          "tall",
          "medium_rectangle",
          "large_rectangle",
          "normalized",
        ],
        image_urls: {
          square:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/square.jpg",
          small:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/small.jpg",
          larger:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/larger.jpg",
          medium:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/medium.jpg",
          large:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/large.jpg",
          tall:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/tall.jpg",
          medium_rectangle:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/medium_rectangle.jpg",
          large_rectangle:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/large_rectangle.jpg",
          normalized:
            "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/normalized.jpg",
        },
        tile_size: 512,
        tile_overlap: 0,
        tile_format: "jpg",
        tile_base_url:
          "https://d2v80f5yrouhh2.cloudfront.net/sp1m0WxNxIaGA88iG9F6bQ/dztiles",
        max_tiled_height: 872,
        max_tiled_width: 1024,
        gemini_token: "sp1m0WxNxIaGA88iG9F6bQ",
        gemini_token_updated_at: null,
      },
    ],
    edition_sets: [],
    cultural_makers: [],
    artists: [
      {
        _id: "5f73a8584ea32a001317456e",
        id: "pedro-g-ocejo-huerta",
        sortable_id: "huerta-pedro-g-ocejo",
        name: "Pedro G. Ocejo Huerta",
        years: "born 1990",
        public: true,
        birthday: "1990",
        consignable: false,
        deathday: "",
        nationality: "Cuban",
        published_artworks_count: 23,
        forsale_artworks_count: 22,
        artworks_count: 23,
        original_width: 3764,
        original_height: 2772,
        image_url:
          "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/:version.jpg",
        image_versions: ["large", "square", "tall", "four_thirds"],
        image_urls: {
          large:
            "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/large.jpg",
          square:
            "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/square.jpg",
          tall:
            "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/tall.jpg",
          four_thirds:
            "https://d32dm0rphc51dk.cloudfront.net/SvHpEe1LlwFbvDiT_y0Aqw/four_thirds.jpg",
        },
        target_supply: false,
      },
    ],
    _id: "5ffca1db4f953900068cc5ca",
    id: "pedro-g-ocejo-huerta-transcendence",
    title: "Transcendence",
    display: "Pedro G. Ocejo Huerta, Transcendence",
    manufacturer: null,
    category: "",
    medium: "4-color screenprint on paper-backed wood veneer",
    unique: false,
    forsale: false,
    sold: false,
    date: "",
    dimensions: {
      in: "20 1/8 × 27 in",
      cm: "51.1 × 68.6 cm",
    },
    price: "",
    availability: "not for sale",
    availability_hidden: false,
    ecommerce: false,
    offer: false,
    collecting_institution: "",
    blurb:
      'Ed Ruscha defies categorization with his diverse output of photographic books and tongue-in-cheek photo-collages, paintings, and drawings. Insects as a subject evoke both Dadaist and Surrealistic tendencies, and the physical environment of the artist\'s studio. Why insects? "Because I have a jillion cockroaches around my studio. I love them, but I don’t want them around."',
    edition_sets_count: 0,
    published: true,
    private: false,
    price_currency: "USD",
    price_cents: null,
    sale_message: "Not for sale",
    inquireable: false,
    acquireable: false,
    offerable: false,
    published_at: "2021-01-11T19:07:07+00:00",
    can_share: true,
    can_share_image: true,
    deleted_at: null,
    cultural_maker: null,
    sale_ids: ["5ffca1d84f953900068cc5c9"],
    attribution_class: null,
  },
  bidder_positions_count: 0,
  display_highest_bid_amount_dollars: null,
  display_minimum_next_bid_dollars: "CHF 1,400",
  highest_bid_amount_cents: null,
  highest_bid: null,
  id: "pedro-g-ocejo-huerta-transcendence",
  minimum_next_bid_cents: 140000,
  sale_id: "deploy-test",
  _id: "5fec9c2caa6ad9000d757ae0",
  currency: "CHF",
  display_estimate_dollars: null,
  display_high_estimate_dollars: "CHF 2,500",
  display_low_estimate_dollars: "CHF 1,800",
  display_opening_bid_dollars: "CHF 1,400",
  estimate_cents: null,
  high_estimate_cents: 250000,
  lot_label: "1",
  lot_number: 1,
  low_estimate_cents: 180000,
  opening_bid_cents: 140000,
  position: 1.0,
  reserve_status: "no_reserve",
  reserve_unknown: true,
  symbol: "CHF",
  user_notes: "",
  withdrawn: false,
  withdrawn_at: null,
}

const lotStub = {
  bidCount: 4,
  reserveStatus: "NoReserve",
  sellingPrice: {
    display: "$1,600",
  },
  soldStatus: "ForSale",
  internalID: "5fec9c2caa6ad9000d757ae0",
}
