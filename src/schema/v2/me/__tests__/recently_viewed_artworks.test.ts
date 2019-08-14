/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

jest.mock("node-fetch", () => jest.fn())
import fetch from "node-fetch"

describe("RecentlyViewedArtworks", () => {
  let context
  beforeEach(() => {
    const me = {
      recently_viewed_artwork_ids: ["percy", "matt"],
    }
    const artworks = [
      { id: "percy", title: "Percy the Cat" },
      { id: "matt", title: "Matt the Person" },
    ]
    context = {
      meLoader: () => Promise.resolve(me),
      artworksLoader: () => Promise.resolve(artworks),
      recordArtworkViewLoader: jest.fn(() => Promise.resolve(me)),
    }
  })

  it("returns an artwork connection", async () => {
    const query = gql`
      {
        me {
          recentlyViewedArtworksConnection(first: 1) {
            edges {
              node {
                slug
                title
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)
    const recentlyViewedArtworks = data!.me.recentlyViewedArtworksConnection

    expect(recentlyViewedArtworks).toEqual({
      edges: [
        {
          node: {
            slug: "percy",
            title: "Percy the Cat",
          },
        },
      ],
      pageInfo: {
        hasNextPage: true,
      },
    })
  })

  it("can return an empty connection", async () => {
    const query = gql`
      {
        me {
          recentlyViewedArtworksConnection(first: 1) {
            edges {
              node {
                id
                title
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `
    context.meLoader = () =>
      Promise.resolve({ recently_viewed_artwork_ids: [] })

    const data = await runAuthenticatedQuery(query, context)
    const recentlyViewedArtworks = data!.me.recentlyViewedArtworksConnection

    expect(recentlyViewedArtworks).toEqual({
      edges: [],
      pageInfo: {
        hasNextPage: false,
      },
    })
    expect.assertions(1)
  })

  it("records an artwork view", async () => {
    const mutation = gql`
      mutation {
        recordArtworkView(input: { artwork_id: "percy" }) {
          artwork_id
        }
      }
    `

    const responseData = {
      data: { recordArtworkView: { artwork_id: "percy" } },
    }

    const mockFetch = (fetch as unknown) as jest.Mock<any>
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve({
        text: () => Promise.resolve(JSON.stringify(responseData)),
      })
    })

    const data = await runAuthenticatedQuery(mutation, context)

    // The graphQL API
    expect(mockFetch).toBeCalledWith(
      "https://api.artsy.test/api/graphql",
      expect.anything()
    )

    const artworkID = data!.recordArtworkView.artwork_id
    expect(artworkID).toEqual("percy")
  })
})
