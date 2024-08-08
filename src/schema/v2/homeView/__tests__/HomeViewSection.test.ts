import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("HomeViewSection", () => {
  describe("NewWorksFromGalleriesYouFollow", () => {
    it("returns lists of artworksConnection", async () => {
      const query = gql`
        {
          homeView {
            section(
              id: "home-view-section-new-works-from-galleries-you-follow"
            ) {
              __typename
              ... on ArtworksRailHomeViewSection {
                component {
                  title
                }
                artworksConnection(first: 2) {
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
        }
      `

      const artworks = [
        { id: "percy", title: "Percy the Cat" },
        { id: "matt", title: "Matt the Person" },
        { id: "paul", title: "Paul the snail" },
        { id: "paula", title: "Paula the butterfly" },
      ]

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
        },
        followedProfilesArtworksLoader: jest
          .fn()
          .mockReturnValue({ body: artworks, headers: { "x-total-count": 2 } }),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "ArtworksRailHomeViewSection",
          "artworksConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "id": "QXJ0d29yazpwZXJjeQ==",
                  "title": "Percy the Cat",
                },
              },
              Object {
                "node": Object {
                  "id": "QXJ0d29yazptYXR0",
                  "title": "Matt the Person",
                },
              },
            ],
          },
          "component": Object {
            "title": "New Works from Galleries You Follow",
          },
        }
      `)
    })
  })
})
