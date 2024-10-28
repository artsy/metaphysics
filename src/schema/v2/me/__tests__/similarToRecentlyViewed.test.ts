/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

jest.mock("node-fetch", () => jest.fn())

describe("SimilarToRecentlyViewed", () => {
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
      similarArtworksLoader: async () => artworks,
      recordArtworkViewLoader: jest.fn(async () => me),
    }
  })

  it("returns an artwork connection", async () => {
    const query = gql`
      {
        me {
          similarToRecentlyViewedConnection(first: 2) {
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
    const similarToRecentlyViewed = data!.me.similarToRecentlyViewedConnection

    expect(similarToRecentlyViewed).toMatchInlineSnapshot(`
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

  it("works for a request using impersonation", async () => {
    context.meLoader = () => Promise.reject("This should not be called")
    context.xImpersonateUserID = "some-user-id"
    context.recentlyViewedArtworkIdsLoader = async () =>
      Promise.resolve({ body: ["percy", "matt", "paul"] })

    const query = gql`
      {
        me {
          similarToRecentlyViewedConnection(first: 2) {
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
    const similarToRecentlyViewed = data!.me.similarToRecentlyViewedConnection

    expect(similarToRecentlyViewed).toMatchInlineSnapshot(`
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
          similarToRecentlyViewedConnection(first: 1) {
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
    context.similarArtworksLoader = async () => []

    const data = await runAuthenticatedQuery(query, context)
    const similarToRecentlyViewed = data!.me?.similarToRecentlyViewedConnection

    expect(similarToRecentlyViewed).toEqual({
      edges: [],
      pageInfo: {
        hasNextPage: false,
      },
    })
    expect.assertions(1)
  })
})
