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
      recentlyViewedArtworkIdsLoader: async () => null,
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
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "slug": "percy",
              "title": "Percy the Cat",
            },
          },
          Object {
            "node": Object {
              "slug": "matt",
              "title": "Matt the Person",
            },
          },
        ],
        "pageInfo": Object {
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
    const similarToRecentlyViewed = data!.me.similarToRecentlyViewedConnection

    expect(similarToRecentlyViewed).toEqual({
      edges: [],
      pageInfo: {
        hasNextPage: false,
      },
    })
    expect.assertions(1)
  })

  it("when using an impersonated call", async () => {
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
    const artworks = [
      { id: "x", title: "X the snail" },
      { id: "y", title: "Y the Person" },
      { id: "z", title: "Z the butterfly" },
    ]

    const ids = ["x", "y", "z"]

    context.recentlyViewedArtworkIdsLoader = async () => ids
    context.similarArtworksLoader = async () => artworks
    context.xImpersonateUserID = "some-user-id"

    const data = await runQuery(query, context)
    const similarToRecentlyViewed = data!.me.similarToRecentlyViewedConnection

    expect(similarToRecentlyViewed).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "slug": "x",
              "title": "X the snail",
            },
          },
          Object {
            "node": Object {
              "slug": "y",
              "title": "Y the Person",
            },
          },
        ],
        "pageInfo": Object {
          "hasNextPage": true,
        },
      }
    `)
  })
})
