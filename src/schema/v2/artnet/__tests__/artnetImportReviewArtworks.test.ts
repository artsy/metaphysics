import { toGlobalId } from "graphql-relay"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("ArtnetImport.reviewArtworksConnection", () => {
  const query = `
    {
      artnetImport(id: "artnet-import-1") {
        reviewArtworksConnection(reviewState: OPEN, first: 2) {
          totalCount
          edges {
            node {
              internalID
              artnetArtworkID
              artnetRecord {
                title
                date
                artistName
                medium
                height
                width
                metric
                imageURL
              }
              importedArtwork {
                internalID
              }
              duplicatePairs {
                internalID
                status
              }
            }
          }
        }
      }
    }
  `

  const reviewArtwork = (overrides = {}) => ({
    id: "row-1",
    artnet_artwork_id: "artnet-1",
    artwork_id: "imported-1",
    artnet_record: {
      title: "Let Them Kiss",
      year: 2015,
      to_year: null,
      artist_name: "Tyler Shields",
      medium: "Photography",
      height: "142",
      width: "196",
      metric: "cm",
      image_url: "https://images.artnet.com/1.jpg",
    },
    duplicate_pairs: [{ id: "pair-1", status: "open" }],
    ...overrides,
  })

  it("pages through the import's works under review", async () => {
    const artnetImportReviewArtworksLoader = jest.fn().mockResolvedValue({
      body: [reviewArtwork()],
      headers: { "x-total-count": "3" },
    })

    const data = await runAuthenticatedQuery(query, {
      artnetImportLoader: () => Promise.resolve({ id: "artnet-import-1" }),
      artnetImportReviewArtworksLoader,
      artworkLoader: () => Promise.resolve({ _id: "imported-1" }),
    })

    expect(artnetImportReviewArtworksLoader).toHaveBeenCalledWith(
      "artnet-import-1",
      {
        review_state: "open",
        page: 1,
        size: 2,
        total_count: true,
      }
    )
    expect(data.artnetImport.reviewArtworksConnection).toEqual({
      totalCount: 3,
      edges: [
        {
          node: {
            internalID: "row-1",
            artnetArtworkID: "artnet-1",
            artnetRecord: {
              title: "Let Them Kiss",
              date: "2015",
              artistName: "Tyler Shields",
              medium: "Photography",
              height: "142",
              width: "196",
              metric: "cm",
              imageURL: "https://images.artnet.com/1.jpg",
            },
            importedArtwork: { internalID: "imported-1" },
            duplicatePairs: [{ internalID: "pair-1", status: "OPEN" }],
          },
        },
      ],
    })
  })

  it("returns no imported artwork once it has been merged away", async () => {
    const notFound = Object.assign(new Error("Artwork Not Found"), {
      statusCode: 404,
    })

    const data = await runAuthenticatedQuery(query, {
      artnetImportLoader: () => Promise.resolve({ id: "artnet-import-1" }),
      artnetImportReviewArtworksLoader: jest.fn().mockResolvedValue({
        body: [
          reviewArtwork({
            artnet_record: { ...reviewArtwork().artnet_record, to_year: 2016 },
          }),
        ],
        headers: { "x-total-count": "1" },
      }),
      artworkLoader: () => Promise.reject(notFound),
    })

    const node = data.artnetImport.reviewArtworksConnection.edges[0].node
    expect(node.importedArtwork).toBeNull()
    expect(node.artnetRecord.date).toEqual("2015-2016")
  })
})

describe("ArtnetImport as a Node", () => {
  it("can be refetched through node(id:)", async () => {
    const artnetImportLoader = jest
      .fn()
      .mockResolvedValue({ id: "artnet-import-1", state: "completed" })

    const data = await runAuthenticatedQuery(
      `{
        node(id: "${toGlobalId("ArtnetImport", "artnet-import-1")}") {
          ... on ArtnetImport {
            internalID
            state
          }
        }
      }`,
      { artnetImportLoader }
    )

    expect(artnetImportLoader).toHaveBeenCalledWith("artnet-import-1")
    expect(data.node).toEqual({
      internalID: "artnet-import-1",
      state: "COMPLETED",
    })
  })
})
