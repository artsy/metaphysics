import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v1/test/utils"
import { assign } from "lodash"

describe("Default Context", () => {
  let context: any
  let parentArtwork = {}

  const query = gql`
    {
      artwork(id: "donn-delson-space-invader") {
        contextGrids {
          title
          ctaTitle
          ctaHref
          artworks(first: 2) {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      }
    }
  `

  beforeEach(() => {
    assign(parentArtwork, {
      _id: "abc123",
      id: "parentArtwork",
      title: "the Parent artwork",
      artist: {
        id: "andy-warhol",
        name: "Andy Warhol",
        published_artworks_count: 123,
      },
      partner: {
        id: "cama-gallery",
        name: "CAMA Gallery",
      },
      sale_ids: ["phillips-auction"],
    })

    const artistArtworks = [
      { id: "artwork1", title: "Artwork 1" },
      { id: "artwork2", title: "Artwork 2" },
      { id: "artwork3", title: "Artwork 3" },
    ]

    const partnerArtworks = [
      { id: "partnerArtwork1", title: "Partner Artwork 1" },
      { id: "partnerArtwork2", title: "Partner Artwork 2" },
      { id: "partnerArtwork3", title: "Partner Artwork 3" },
    ]

    const saleArtworks = [
      { id: "saleArtwork1", title: "Sale Artwork 1" },
      { id: "saleArtwork2", title: "Sale Artwork 2" },
      { id: "saleArtwork3", title: "Sale Artwork 3" },
    ]

    context = {
      artworkLoader: () => Promise.resolve(parentArtwork),
      artistArtworksLoader: () => Promise.resolve(artistArtworks),
      relatedFairsLoader: () => Promise.resolve(null),
      relatedShowsLoader: () => Promise.resolve(null),
      partnerArtworksLoader: () => {
        return Promise.resolve({
          body: partnerArtworks,
          headers: { "x-total-count": "10" },
        })
      },
      relatedLayerArtworksLoader: () => Promise.resolve(null),
      relatedLayersLoader: () => Promise.resolve([]),
      saleLoader: () => {
        return Promise.resolve({
          id: "phillips-auction",
          is_auction: true,
          auction_state: "open",
          eligible_sale_artworks_count: 10,
          name: "Phillips Auction",
        })
      },
      saleArtworksLoader: () => {
        return Promise.resolve({
          body: saleArtworks,
        })
      },
    }
  })

  it("Does not return auction-related grids for a non-auction sale", () => {
    expect.assertions(1)
    context.saleLoader = () =>
      Promise.resolve({
        id: "phillips-auction",
        is_auction: false,
        auction_state: "closed",
      })

    return runAuthenticatedQuery(query, context).then((data) => {
      // Returns the default grid
      expect(data.artwork.contextGrids.length).toEqual(3)
    })
  })

  it("Returns the correct values for metadata fields for an open auction", () => {
    expect.assertions(5)

    return runAuthenticatedQuery(query, context).then((data) => {
      // Should have one artist grid and one related grid with 0 works
      expect(data.artwork.contextGrids.length).toEqual(1)
      const {
        title,
        ctaTitle,
        ctaHref,
        artworks,
      } = data.artwork.contextGrids[0]

      expect(title).toEqual("Other works from Phillips Auction")
      expect(ctaTitle).toEqual("View all works from the auction")
      expect(ctaHref).toEqual("/auction/phillips-auction")
      expect(artworks.edges.length).toEqual(2)
    })
  })

  it("Returns the correct values for metadata fields for a closed auction", () => {
    expect.assertions(6)

    context.saleLoader = () =>
      Promise.resolve({
        id: "phillips-auction",
        is_auction: true,
        auction_state: "closed",
      })

    return runAuthenticatedQuery(query, context).then((data) => {
      // Should have one partner grid and one related grid with 0 works
      expect(data.artwork.contextGrids.length).toEqual(2)
      const {
        title,
        ctaTitle,
        ctaHref,
        artworks,
      } = data.artwork.contextGrids[0]

      expect(title).toEqual("Other works by Andy Warhol")
      expect(ctaTitle).toEqual("View all works by Andy Warhol")
      expect(ctaHref).toEqual("/artist/andy-warhol")
      expect(artworks.edges.map(({ node }) => node.id)).toEqual([
        "artwork1",
        "artwork2",
      ])

      // Related artworks grid should have no artworks
      expect(data.artwork.contextGrids[1].artworks).toEqual(null)
    })
  })
})
