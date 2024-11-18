/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import me from ".."

jest.mock("node-fetch", () => jest.fn())

describe("NewWorksFromGalleriesYouFollow", () => {
  let context
  beforeEach(() => {
    const me = {}
    const artworks = [
      { id: "percy", title: "Percy the Cat" },
      { id: "matt", title: "Matt the Person" },
      { id: "paul", title: "Paul the snail" },
      { id: "paula", title: "Paula the butterfly" },
    ]
    context = {
      meLoader: async () => me,
      followedProfilesArtworksLoader: async () => ({
        body: artworks,
        headers: { "x-total-count": 4 },
      }),
    }
  })

  it("returns an artwork connection", async () => {
    const query = gql`
      {
        me {
          newWorksFromGalleriesYouFollowConnection(first: 2) {
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
    const newWorksFromGalleriesYouFollow = data!.me
      .newWorksFromGalleriesYouFollowConnection

    expect(newWorksFromGalleriesYouFollow).toMatchInlineSnapshot(`
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
          newWorksFromGalleriesYouFollowConnection(first: 1) {
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
    context = {
      meLoader: async () => me,
      followedProfilesArtworksLoader: async () => ({
        body: [],
        headers: { "x-total-count": 4 },
      }),
    }

    const data = await runAuthenticatedQuery(query, context)
    const newWorksFromGalleriesYouFollow = data!.me
      .newWorksFromGalleriesYouFollowConnection

    expect(newWorksFromGalleriesYouFollow).toMatchInlineSnapshot(`
      {
        "edges": [],
        "pageInfo": {
          "hasNextPage": true,
        },
      }
    `)
    expect.assertions(1)
  })
})
