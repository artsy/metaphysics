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

  describe("FairsRailHomeViewSection", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-featured-fairs") {
              __typename

              ... on FairsRailHomeViewSection {
                component {
                  title
                }

                fairsConnection(first: 2) {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `

      const fairs = {
        body: [
          {
            id: "fair-1",
            name: "Fair 1",
            start_at: "2024-05-23T11:00:00+00:00",
            end_at: "2024-06-23T11:00:00+00:00",
          },
          {
            id: "fair-2",
            name: "Fair 2",
            start_at: "2024-05-23T11:00:00+00:00",
            end_at: "2024-06-23T11:00:00+00:00",
          },
        ],
      }

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
        },
        fairsLoader: jest.fn().mockResolvedValue(fairs),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "FairsRailHomeViewSection",
          "component": Object {
            "title": "Featured Fairs",
          },
          "fairsConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "name": "Fair 1",
                },
              },
              Object {
                "node": Object {
                  "name": "Fair 2",
                },
              },
            ],
          },
        }
      `)
    })
  })

  describe("MarketingCollectionsRailHomeViewSection", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-marketing-collections") {
              __typename

              ... on MarketingCollectionsRailHomeViewSection {
                component {
                  title
                }

                marketingCollectionsConnection(first: 2) {
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

      const collections = {
        body: [
          {
            title: "Trending Now",
          },
          {
            title: "Top Auction Works",
          },
        ],
      }

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
        },
        marketingCollectionsLoader: jest.fn().mockResolvedValue(collections),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "MarketingCollectionsRailHomeViewSection",
          "component": Object {
            "title": "Collections",
          },
          "marketingCollectionsConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "title": "Trending Now",
                },
              },
              Object {
                "node": Object {
                  "title": "Top Auction Works",
                },
              },
            ],
          },
        }
      `)
    })

    describe("ViewingRoomsRailHomeViewSection", () => {
      it("returns correct data", async () => {
        const query = gql`
          {
            homeView {
              section(id: "home-view-section-viewing-rooms") {
                __typename

                ... on ViewingRoomsRailHomeViewSection {
                  component {
                    title
                  }
                }
              }
            }
          }
        `

        const context = {
          authenticatedLoaders: {
            meLoader: jest.fn().mockReturnValue({ type: "User" }),
          },
        }

        const data = await runQuery(query, context)

        expect(data.homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "ViewingRoomsRailHomeViewSection",
          "component": Object {
            "title": "Viewing Rooms",
          },
        }
      `)
      })
    })
  })

  describe("ActivityRailHomeViewSection", () => {
    it("returns the latest activity", async () => {
      const query = `
        {
          homeView {
            section(id: "home-view-section-latest-activity") {
              __typename
              ... on ActivityRailHomeViewSection {
                component {
                  title
                }
                notificationsConnection(first: 1) {
                  edges {
                    node {
                      internalID
                      isUnread
                      createdAt(format: "YYYY")
                      notificationType
                      title
                      message
                      targetHref
                      objectsCount
                    }
                  }
                }
              }
            }
          }
        }
      `

      const notificationsFeedLoader = jest.fn(() =>
        Promise.resolve({
          feed: [
            {
              id: "6303f205b54941000843419a",
              actors: "Works by Damien Hirst",
              message: "8 Works Added",
              status: "unread",
              date: "2022-08-22T21:15:49.000Z",
              object_ids: [
                "63036fafbe5cfc000cf358e3",
                "630392514f13a5000b55ecec",
              ],
              objects_count: 2,
              object: {
                artist: {
                  id: "damien-hirst",
                  _id: "4d8b926a4eb68a1b2c0000ae",
                },
              },
              activity_type: "ArtworkPublishedActivity",
              target_href: "/artist/damien-hirst/works-for-sale",
            },
          ],
          total: 100,
          total_unread: 10,
          total_unseen: 10,
        })
      )

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
        },
        notificationsFeedLoader,
      }

      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        Object {
          "homeView": Object {
            "section": Object {
              "__typename": "ActivityRailHomeViewSection",
              "component": Object {
                "title": "Latest Activity",
              },
              "notificationsConnection": Object {
                "edges": Array [
                  Object {
                    "node": Object {
                      "createdAt": "2022",
                      "internalID": "6303f205b54941000843419a",
                      "isUnread": true,
                      "message": "8 Works Added",
                      "notificationType": "ARTWORK_PUBLISHED",
                      "objectsCount": 2,
                      "targetHref": "/artist/damien-hirst/works-for-sale",
                      "title": "Works by Damien Hirst",
                    },
                  },
                ],
              },
            },
          },
        }
      `)
    })
  })

  describe("AuctionResultsRailHomeViewSection", () => {
    it("returns the latest activity", async () => {
      const query = `
        {
          homeView {
            section(id: "home-view-section-latest-auction-results") {
              __typename
              ... on AuctionResultsRailHomeViewSection {
                component {
                  title
                  href
                  behaviors {
                    viewAll {
                      href
                      buttonText
                    }
                  }
                }
                auctionResultsConnection(first: 2) {
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

      const auctionLotsLoader = jest.fn(async () => ({
        total_count: 2,
        _embedded: {
          items: [
            {
              title: "Auction Result 1",
              artist_id: "artist-1",
            },
            {
              title: "Auction Result 2",
              artist_id: "artist-2",
            },
            {
              title: "Auction Result Without Artist ID",
            },
          ],
        },
      }))

      const followedArtistsLoader = jest.fn(async () => ({
        headers: { "x-total-count": 2 },
        body: [
          {
            id: "followartist-1",
            artist: {
              _id: "artist-1",
              name: "Artist 1",
            },
          },
          {
            id: "followartist-2",
            artist: {
              _id: "artist-2",
              name: "Artist 2",
            },
          },
        ],
      }))

      const context = {
        authenticatedLoaders: {
          meLoader: jest.fn().mockReturnValue({ type: "User" }),
        },
        followedArtistsLoader,
        auctionLotsLoader,
      }

      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        Object {
          "homeView": Object {
            "section": Object {
              "__typename": "AuctionResultsRailHomeViewSection",
              "auctionResultsConnection": Object {
                "edges": Array [
                  Object {
                    "node": Object {
                      "title": "Auction Result 1",
                    },
                  },
                  Object {
                    "node": Object {
                      "title": "Auction Result 2",
                    },
                  },
                ],
              },
              "component": Object {
                "behaviors": Object {
                  "viewAll": Object {
                    "buttonText": "Browse All Results",
                    "href": "/auction-results-for-artists-you-follow",
                  },
                },
                "href": "/auction-results-for-artists-you-follow",
                "title": "Latest Auction Results",
              },
            },
          },
        }
      `)
    })
  })
})
