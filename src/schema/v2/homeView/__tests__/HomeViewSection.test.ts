import { isFeatureFlagEnabled } from "lib/featureFlags"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("HomeViewSection", () => {
  describe("SimilarToRecentlyViewedArtworks", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(
              id: "home-view-section-similar-to-recently-viewed-artworks"
            ) {
              __typename
              component {
                title
                behaviors {
                  viewAll {
                    buttonText
                    href
                    ownerType
                  }
                }
              }
              ownerType
            }
          }
        }
      `

      const context = {
        accessToken: "424242",
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArtworks",
          "component": Object {
            "behaviors": Object {
              "viewAll": Object {
                "buttonText": "Browse All Artworks",
                "href": null,
                "ownerType": null,
              },
            },
            "title": "Similar to Works You’ve Viewed",
          },
          "ownerType": "similarToRecentlyViewed",
        }
      `)
    })
  })

  describe("RecentlyViewedArtworks", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-recently-viewed-artworks") {
              __typename
              component {
                title
                behaviors {
                  viewAll {
                    buttonText
                    href
                    ownerType
                  }
                }
              }
              ownerType
            }
          }
        }
      `

      const context = {
        accessToken: "424242",
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArtworks",
          "component": Object {
            "behaviors": Object {
              "viewAll": Object {
                "buttonText": "Browse All Artworks",
                "href": null,
                "ownerType": null,
              },
            },
            "title": "Recently Viewed",
          },
          "ownerType": "recentlyViewed",
        }
      `)
    })
  })

  describe("NewWorksForYou", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-new-works-for-you") {
              __typename
              component {
                title
                behaviors {
                  viewAll {
                    buttonText
                    href
                    ownerType
                  }
                }
              }
              ownerType
            }
          }
        }
      `

      const context = {
        accessToken: "424242",
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArtworks",
          "component": Object {
            "behaviors": Object {
              "viewAll": Object {
                "buttonText": "Browse All Artworks",
                "href": null,
                "ownerType": null,
              },
            },
            "title": "New Works for You",
          },
          "ownerType": "newWorksForYou",
        }
      `)
    })
  })

  describe("RecommendedArtworks", () => {
    it("returns lists of artworksConnection", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-recommended-artworks") {
              __typename
              component {
                title
                behaviors {
                  viewAll {
                    buttonText
                    href
                    ownerType
                  }
                }
              }
              ownerType

              ... on HomeViewSectionArtworks {
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

      const vortexResponse = {
        data: {
          artworkRecommendations: {
            edges: [
              {
                node: {
                  artworkId: "608a7417bdfbd1a789ba092a",
                  score: 3.422242962512335,
                },
              },
              {
                node: {
                  artworkId: "308a7416bdfbd1a789ba0911",
                  score: 3.2225049587839654,
                },
              },
              {
                node: {
                  artworkId: "208a7416bdfbd1a789ba0911",
                  score: 4.2225049587839654,
                },
              },
              {
                node: {
                  artworkId: "108a7416bdfbd1a789ba0911",
                  score: 5.2225049587839654,
                },
              },
            ],
            totalCount: 4,
          },
        },
      }

      const vortexGraphQLAuthenticatedLoader = jest.fn(() => async () =>
        vortexResponse
      )

      const artworksResponse = [
        {
          _id: "608a7417bdfbd1a789ba092a",
          id: "gerhard-richter-abendstimmung-evening-calm-2",
          slug: "gerhard-richter-abendstimmung-evening-calm-2",
        },
        {
          _id: "308a7416bdfbd1a789ba0911",
          id: "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
          slug: "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
        },
      ]

      const artworksLoader = jest.fn(async () => artworksResponse)

      const context: any = {
        accessToken: "424242",
        artworksLoader,
        userID: "vortex-user-id",
        authenticatedLoaders: {
          vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: null,
        },
      }

      const response = await runQuery(query, context)

      expect(artworksLoader).toHaveBeenCalledWith({
        ids: ["608a7417bdfbd1a789ba092a", "308a7416bdfbd1a789ba0911"],
      })

      expect(response.homeView).toMatchInlineSnapshot(`
        Object {
          "section": Object {
            "__typename": "HomeViewSectionArtworks",
            "artworksConnection": Object {
              "edges": Array [
                Object {
                  "node": Object {
                    "id": "QXJ0d29yazo2MDhhNzQxN2JkZmJkMWE3ODliYTA5MmE=",
                    "title": "Untitled",
                  },
                },
                Object {
                  "node": Object {
                    "id": "QXJ0d29yazozMDhhNzQxNmJkZmJkMWE3ODliYTA5MTE=",
                    "title": "Untitled",
                  },
                },
              ],
            },
            "component": Object {
              "behaviors": Object {
                "viewAll": Object {
                  "buttonText": "Browse All Artworks",
                  "href": null,
                  "ownerType": null,
                },
              },
              "title": "Artwork Recommendations",
            },
            "ownerType": "artworkRecommendations",
          },
        }
      `)
    })
  })

  describe("NewWorksFromGalleriesYouFollow", () => {
    it("returns lists of artworksConnection", async () => {
      const query = gql`
        {
          homeView {
            section(
              id: "home-view-section-new-works-from-galleries-you-follow"
            ) {
              __typename
              component {
                title
                behaviors {
                  viewAll {
                    buttonText
                    href
                    ownerType
                  }
                }
              }
              ownerType

              ... on HomeViewSectionArtworks {
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
        accessToken: "424242",
        followedProfilesArtworksLoader: jest
          .fn()
          .mockReturnValue({ body: artworks, headers: { "x-total-count": 2 } }),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArtworks",
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
            "behaviors": Object {
              "viewAll": Object {
                "buttonText": "Browse All Artworks",
                "href": null,
                "ownerType": null,
              },
            },
            "title": "New Works from Galleries You Follow",
          },
          "ownerType": "newWorksFromGalleriesYouFollow",
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
              component {
                title
              }
              ... on HomeViewSectionArtists {
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
        accessToken: "424242",
        authenticatedLoaders: {
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
          "__typename": "HomeViewSectionArtists",
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

  describe("HomeViewSectionViewingRooms", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-viewing-rooms") {
              __typename
              component {
                title
                behaviors {
                  viewAll {
                    buttonText
                    href
                    ownerType
                  }
                }
              }
            }
          }
        }
      `

      const context = {}

      const data = await runQuery(query, context)

      expect(data.homeView.section).toMatchInlineSnapshot(`
                Object {
                  "__typename": "HomeViewSectionViewingRooms",
                  "component": Object {
                    "behaviors": Object {
                      "viewAll": Object {
                        "buttonText": null,
                        "href": "/viewing-rooms",
                        "ownerType": "viewingRooms",
                      },
                    },
                    "title": "Viewing Rooms",
                  },
                }
            `)
    })
  })

  describe("HomeViewSectionTasks", () => {
    beforeAll(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "emerald_home-view-tasks-section") return true
      })
    })

    const query = gql`
      {
        homeView {
          section(id: "home-view-section-tasks") {
            __typename
            component {
              title
            }

            ... on HomeViewSectionTasks {
              tasksConnection(first: 2) {
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

    it("returns correct data", async () => {
      const tasks = {
        body: [
          {
            title: "Task 1",
          },
          {
            title: "Task 2",
          },
        ],
        headers: { "x-total-count": 10 },
      }

      const context = {
        accessToken: "424242",
        meLoader: () => Promise.resolve({}),
        meTasksLoader: jest.fn().mockResolvedValue(tasks),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionTasks",
          "component": Object {
            "title": "Act Now",
          },
          "tasksConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "title": "Task 1",
                },
              },
              Object {
                "node": Object {
                  "title": "Task 2",
                },
              },
            ],
          },
        }
      `)
    })

    describe("when the feature flag is disabled", () => {
      beforeAll(() => {
        mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === "emerald_home-view-tasks-section") return false
        })
      })

      it("throws an error when accessed by id", async () => {
        const context = {
          fairsLoader: jest.fn().mockResolvedValue([]),
        }

        await expect(runQuery(query, context)).rejects.toThrow(
          "Section is not displayable: home-view-section-tasks"
        )
      })
    })
  })

  describe("GalleriesNearYou", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-galleries-near-you") {
              __typename
              ownerType
              ... on HomeViewSectionCard {
                card {
                  title
                  subtitle
                  href
                  buttonText
                  image {
                    imageURL
                  }
                }
              }
            }
          }
        }
      `

      const context = {}

      const data = await runQuery(query, context)

      expect(data.homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionCard",
          "card": Object {
            "buttonText": "Explore",
            "href": null,
            "image": Object {
              "imageURL": "https://files.artsy.net/images/galleries_for_you.webp",
            },
            "subtitle": "Follow these local galleries for updates on artists you love.",
            "title": "Galleries near You",
          },
          "ownerType": "galleriesForYou",
        }
      `)
    })
  })

  describe("implements the NodeInterface", () => {
    it("returns the correct id", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-news") {
              __typename
              id
            }
          }
        }
      `

      const context = {}

      const data = await runQuery(query, context)

      expect(data.homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArticles",
          "id": "SG9tZVZpZXdTZWN0aW9uOmhvbWUtdmlldy1zZWN0aW9uLW5ld3M=",
        }
      `)
    })

    it("can query via the node interface", async () => {
      const query = gql`
        {
          node(id: "SG9tZVZpZXdTZWN0aW9uOmhvbWUtdmlldy1zZWN0aW9uLW5ld3M=") {
            __typename
            ... on HomeViewSectionGeneric {
              component {
                title
              }
            }
          }
        }
      `

      const context = {}

      const data = await runQuery(query, context)

      expect(data.node).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArticles",
          "component": Object {
            "title": "News",
          },
        }
      `)
    })
  })
})
