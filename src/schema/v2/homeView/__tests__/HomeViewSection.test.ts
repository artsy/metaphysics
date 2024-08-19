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

  describe("RecommendedArtists", () => {
    it("returns lists of artists with the right title", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-recommended-artists") {
              __typename
              ... on ArtistsRailHomeViewSection {
                component {
                  title
                }
                artistsConnection(first: 2) {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `

      const mockVortexResponse = {
        data: {
          artistRecommendations: {
            edges: [
              {
                node: {
                  artistId: "artist-1",
                },
              },
              {
                node: {
                  artistId: "artist-2",
                },
              },
            ],
            totalCount: 2,
          },
        },
      }

      const mockArtistsResponse = {
        body: [
          {
            _id: "artist-1",
            id: "banksy",
            name: "Artist 1",
          },
          {
            _id: "artist-2",
            id: "1-plus-1-plus-1",
            name: "Artist 2",
          },
        ],
      }

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
          vortexGraphqlLoader: jest.fn(() => async () => mockVortexResponse),
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: jest.fn(() => async () => []),
        },
        artistsLoader: jest.fn().mockReturnValue(mockArtistsResponse),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "ArtistsRailHomeViewSection",
          "artistsConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "id": "QXJ0aXN0OmFydGlzdC0x",
                  "name": "Artist 1",
                },
              },
              Object {
                "node": Object {
                  "id": "QXJ0aXN0OmFydGlzdC0y",
                  "name": "Artist 2",
                },
              },
            ],
          },
          "component": Object {
            "title": "Recommended Artists",
          },
        }
      `)
    })
  })

  describe("HeroUnits", () => {
    it("returns lists of hero units", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-hero-units") {
              __typename

              ... on HeroUnitsHomeViewSection {
                heroUnitsConnection(first: 2) {
                  edges {
                    node {
                      title
                    }
                  }
                }
              }
            }
          }
        }
      `

      const mockHeroUnitsResponse = {
        body: [
          {
            title: "Foundations Summer 2024",
          },
          {
            title: "Foundations Prize Finalists",
          },
        ],
        headers: { "x-total-count": 2 },
      }

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
        },
        heroUnitsLoader: jest.fn().mockReturnValue(mockHeroUnitsResponse),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HeroUnitsHomeViewSection",
          "heroUnitsConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "title": "Foundations Summer 2024",
                },
              },
              Object {
                "node": Object {
                  "title": "Foundations Prize Finalists",
                },
              },
            ],
          },
        }
      `)
    })
  })

  describe("CuratorsPicksEmerging", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-curators-picks-emerging") {
              __typename

              ... on ArtworksRailHomeViewSection {
                component {
                  title
                  description
                  href
                  backgroundImageURL
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
        { _id: "percy", title: "Percy the Cat" },
        { _id: "matt", title: "Matt the Person" },
      ]

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
        },
        unauthenticatedLoaders: {
          filterArtworksLoader: jest.fn().mockReturnValue(
            Promise.resolve({
              hits: artworks,
              aggregations: {
                total: {
                  value: 2,
                },
              },
            })
          ),
        },
        siteHeroUnitLoader: jest.fn().mockReturnValue({
          app_title: "Curators' Picks Emerging",
          app_description:
            "The best works by rising talents on Artsy, available now.",
          background_image_app_phone_url: "image.jpg",
          background_image_app_tablet_url: "image.jpg",
        }),
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
            "backgroundImageURL": "image.jpg",
            "description": "The best works by rising talents on Artsy, available now.",
            "href": "/collection/curators-picks-emerging",
            "title": "Curators' Picks Emerging",
          },
        }
      `)
    })
  })
})
