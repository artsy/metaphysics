/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("RecentlyViewedArtworks", () => {
  let context
  beforeEach(() => {
    const me = {
      recently_viewed_artwork_ids: ["percy", "matt", "paul"],
    }

    const artworks = [
      { id: "percy", title: "Percy the Cat" },
      { id: "matt", title: "Matt the Person" },
      { id: "paul", title: "Paul the snail" },
      { id: "paula", title: "Paula the butterfly" },
    ]

    context = {
      meLoader: async () => me,
      artworksLoader: async () => artworks,
      recordArtworkViewLoader: jest.fn(async () => me),
    }
  })

  it("returns an artwork connection", async () => {
    const query = gql`
      {
        me {
          recentlyViewedArtworksConnection(first: 2) {
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

    expect(recentlyViewedArtworks).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "slug": "percy",
              "title": "Percy the Cat",
            },
          },
          {
            "node": {
              "slug": "matt",
              "title": "Matt the Person",
            },
          },
        ],
        "pageInfo": {
          "hasNextPage": true,
        },
      }
    `)
  })

  it("returns a second page of artworks", async () => {
    // In this test I want to get an artwork which comes right after "Matt the Person" artwork.
    // It's cursor is "YXJyYXljb25uZWN0aW9uOjE" - I specify it a few lines bellow.
    const query = gql`
      {
        me {
          recentlyViewedArtworksConnection(
            first: 1
            after: "YXJyYXljb25uZWN0aW9uOjE"
          ) {
            edges {
              node {
                slug
                title
              }
            }
          }
        }
      }
    `
    const data = await runAuthenticatedQuery(query, context)
    const recentlyViewedArtworks = data!.me.recentlyViewedArtworksConnection

    expect(recentlyViewedArtworks).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "slug": "paul",
              "title": "Paul the snail",
            },
          },
        ],
      }
    `)
  })

  it("works for a request using impersonation", async () => {
    context.meLoader = () => Promise.reject("This should not be called")
    context.xImpersonateUserID = "some-user-id"
    context.recentlyViewedArtworkIdsLoader = async () =>
      Promise.resolve({ body: ["percy", "matt", "paul"] })

    const query = gql`
      {
        me {
          recentlyViewedArtworksConnection(first: 2) {
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
    const data = await runQuery(query, context)
    const recentlyViewedArtworks = data!.me.recentlyViewedArtworksConnection

    expect(recentlyViewedArtworks).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "slug": "percy",
              "title": "Percy the Cat",
            },
          },
          {
            "node": {
              "slug": "matt",
              "title": "Matt the Person",
            },
          },
        ],
        "pageInfo": {
          "hasNextPage": true,
        },
      }
    `)
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

    context.recentlyViewedArtworkIdsLoader = () => Promise.resolve({ body: [] })

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
          artworkId
          artwork_id
        }
      }
    `

    const data = await runAuthenticatedQuery(mutation, context)

    expect(context.recordArtworkViewLoader).toHaveBeenCalledWith({
      artwork_id: "percy",
    })

    expect(data!.recordArtworkView.artworkId).toEqual("percy")
    expect(data!.recordArtworkView.artwork_id).toEqual("percy")
  })
})
