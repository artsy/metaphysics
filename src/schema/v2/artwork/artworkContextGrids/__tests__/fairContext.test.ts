import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { assign } from "lodash"

describe("Fair Context", () => {
  let context: any
  const parentArtwork = {} as any

  const query = gql`
    {
      artwork(id: "donn-delson-space-invader") {
        contextGrids {
          title
          ctaTitle
          ctaHref
          artworksConnection(first: 2) {
            edges {
              node {
                slug
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
        forsale_artworks_count: 123,
      },
      partner: {
        id: "cama-gallery",
        name: "CAMA Gallery",
      },
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

    const showArtworks = [
      { id: "showArtwork1", title: "Show Artwork 1" },
      { id: "showArtwork2", title: "Show Artwork 2" },
      { id: "showArtwork3", title: "Show Artwork 3" },
    ]

    context = {
      artworkLoader: () => Promise.resolve(parentArtwork),
      artistArtworksLoader: () => Promise.resolve(artistArtworks),
      relatedFairsLoader: () =>
        Promise.resolve([{ id: "fair1", has_full_feature: true }]),
      showsLoader: () => {
        return Promise.resolve([
          { id: "cool-show", name: "Cool Show", partner: { id: "partner" } },
        ])
      },
      partnerArtworksLoader: () => {
        return Promise.resolve({
          body: partnerArtworks,
          headers: { "x-total-count": "10" },
        })
      },
      partnerShowArtworksLoader: () => {
        return Promise.resolve({
          body: showArtworks,
          headers: { "x-total-count": "10" },
        })
      },
      relatedLayerArtworksLoader: () => Promise.resolve(null),
      relatedLayersLoader: () => Promise.resolve([]),
    }
  })

  it("Returns the correct values for metadata fields when there is just show data", async () => {
    expect.assertions(6)

    parentArtwork.artist = null
    parentArtwork.show_ids = ["abc123"]
    context.artistArtworksLoader = () => Promise.resolve(null)

    const data = await runAuthenticatedQuery(query, context)
    // Should have one artist grid and one related grid with 0 works
    expect(data.artwork.contextGrids.length).toEqual(2)
    const {
      title,
      ctaTitle,
      ctaHref,
      artworksConnection,
    } = data.artwork.contextGrids[0]
    expect(title).toEqual("Other works from Cool Show")
    expect(ctaTitle).toEqual("View all works from the booth")
    expect(ctaHref).toEqual("/show/cool-show")
    expect(artworksConnection.edges.length).toEqual(2)
    // Related artworks grid should have no artworks
    expect(data.artwork.contextGrids[1].artworksConnection).toEqual(null)
  })

  it("Returns the correct values for metadata fields when there is all data", async () => {
    context.relatedLayersLoader = () => Promise.resolve([{ id: "main" }])
    context.relatedLayerArtworksLoader = () =>
      Promise.resolve([
        { id: "relatedArtwork1", title: "Related Artwork 1" },
        { id: "relatedArtwork2", title: "Related Artwork 2" },
        { id: "relatedArtwork3", title: "Related Artwork 3" },
      ])

    const data = await runAuthenticatedQuery(query, context)
    // Should have one artist grid and one related grid with 0 works
    expect(data.artwork.contextGrids.length).toEqual(3)
    // The first grid should include show-related metadata
    const {
      title: showTitle,
      ctaTitle: showCtaTitle,
      ctaHref: showctaHref,
      artworksConnection: showArtworks,
    } = data.artwork.contextGrids[0]
    expect(showTitle).toEqual("Other works from Cool Show")
    expect(showCtaTitle).toEqual("View all works from the booth")
    expect(showctaHref).toEqual("/show/cool-show")
    expect(showArtworks.edges.map(({ node }) => node.slug)).toEqual([
      "showArtwork1",
      "showArtwork2",
    ])
    // The second grid should include artist-related metadata
    const {
      title: artistTitle,
      ctaTitle: artistCtaTitle,
      ctaHref: artistctaHref,
      artworksConnection: artistArtworks,
    } = data.artwork.contextGrids[1]
    expect(artistTitle).toEqual("Other works by Andy Warhol")
    expect(artistCtaTitle).toEqual("View all works by Andy Warhol")
    expect(artistctaHref).toEqual("/artist/andy-warhol")
    expect(
      artistArtworks.edges.map(({ node: node_1 }) => node_1.slug)
    ).toEqual(["artwork1", "artwork2"])
    // The third grid should include related artworks
    const {
      title: relatedTitle,
      ctaTitle: relatedCtaTitle,
      ctaHref: relatedctaHref,
      artworksConnection: relatedArtworks,
    } = data.artwork.contextGrids[2]
    expect(relatedTitle).toEqual("Related works")
    expect(relatedCtaTitle).toEqual(null)
    expect(relatedctaHref).toEqual(null)
    expect(
      relatedArtworks.edges.map(({ node: node_2 }) => node_2.slug)
    ).toEqual(["relatedArtwork1", "relatedArtwork2"])
    expect.assertions(13)
  })

  it("allows related artworks to be excluded", async () => {
    context.relatedLayersLoader = () => Promise.resolve([{ id: "main" }])
    context.relatedLayerArtworksLoader = jest.fn()

    const response = await runAuthenticatedQuery(
      gql`
        {
          artwork(id: "donn-delson-space-invader") {
            contextGrids(includeRelatedArtworks: false) {
              title
              artworksConnection(first: 2) {
                edges {
                  node {
                    slug
                    title
                  }
                }
              }
            }
          }
        }
      `,
      context
    )

    const grids = response.artwork.contextGrids
    const gridTitles = grids.map((grid) => grid.title)

    expect(grids.length).toEqual(2)
    expect(gridTitles).not.toInclude("Related works")
    expect(context.relatedLayerArtworksLoader).not.toHaveBeenCalled()
  })
})
