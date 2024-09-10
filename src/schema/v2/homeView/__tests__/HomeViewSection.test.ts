import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

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
              ... on HomeViewSectionArtworks {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
                }
              }
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
                "href": "/similar-to-recently-viewed",
              },
            },
            "title": "Similar to Works You’ve Viewed",
          },
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
              ... on HomeViewSectionArtworks {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
                }
              }
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
                "href": "/recently-viewed",
              },
            },
            "title": "Recently Viewed",
          },
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
              ... on HomeViewSectionArtworks {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
                }
              }
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
                "href": "/new-for-you",
              },
            },
            "title": "New works for you",
          },
        }
      `)
    })
  })

  describe("AuctionLotsForYou", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-auction-lots-for-you") {
              __typename
              ... on HomeViewSectionArtworks {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
                }
              }
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
                "href": "/auctions/lots-for-you-ending-soon",
              },
            },
            "title": "Auction lots for you",
          },
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
              ... on HomeViewSectionArtworks {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
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
                  "href": "/artwork-recommendations",
                },
              },
              "title": "Artwork Recommendations",
            },
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
              ... on HomeViewSectionArtworks {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
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
                "href": "/new-works-from-galleries-you-follow",
              },
            },
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
              ... on HomeViewSectionArtists {
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

  describe("HeroUnits", () => {
    it("returns lists of hero units", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-hero-units") {
              __typename

              ... on HomeViewSectionHeroUnits {
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
        heroUnitsLoader: jest.fn().mockReturnValue(mockHeroUnitsResponse),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionHeroUnits",
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

              ... on HomeViewSectionArtworks {
                component {
                  title
                  description
                  backgroundImageURL
                  behaviors {
                    viewAll {
                      href
                    }
                  }
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
        authenticatedLoaders: {},
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
            "backgroundImageURL": "image.jpg",
            "behaviors": Object {
              "viewAll": Object {
                "href": "/collection/curators-picks-emerging",
              },
            },
            "description": "The best works by rising talents on Artsy, available now.",
            "title": "Curators' Picks Emerging",
          },
        }
      `)
    })
  })

  describe("HomeViewSectionFairs", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-featured-fairs") {
              __typename

              ... on HomeViewSectionFairs {
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
        fairsLoader: jest.fn().mockResolvedValue(fairs),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionFairs",
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

  describe("HomeViewSectionMarketingCollections", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-marketing-collections") {
              __typename

              ... on HomeViewSectionMarketingCollections {
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
        marketingCollectionsLoader: jest.fn().mockResolvedValue(collections),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionMarketingCollections",
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
  })

  describe("HomeViewSectionViewingRooms", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-viewing-rooms") {
              __typename

              ... on HomeViewSectionViewingRooms {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
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
                        "href": "/viewing-rooms",
                      },
                    },
                    "title": "Viewing Rooms",
                  },
                }
            `)
    })
  })

  describe("HomeViewSectionActivity", () => {
    it("returns the latest activity", async () => {
      const query = `
        {
          homeView {
            section(id: "home-view-section-latest-activity") {
              __typename
              ... on HomeViewSectionActivity {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
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
        accessToken: "424242",
        notificationsFeedLoader,
      }

      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        Object {
          "homeView": Object {
            "section": Object {
              "__typename": "HomeViewSectionActivity",
              "component": Object {
                "behaviors": Object {
                  "viewAll": Object {
                    "href": "/notifications",
                  },
                },
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

  describe("HomeViewSectionAuctionResults", () => {
    it("returns the latest activity", async () => {
      const query = `
        {
          homeView {
            section(id: "home-view-section-latest-auction-results") {
              __typename
              ... on HomeViewSectionAuctionResults {
                component {
                  title
                  href
                  behaviors {
                    viewAll {
                      href
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
        accessToken: "424242",
        followedArtistsLoader,
        auctionLotsLoader,
      }

      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        Object {
          "homeView": Object {
            "section": Object {
              "__typename": "HomeViewSectionAuctionResults",
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

  describe("LatestArticles", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-latest-articles") {
              __typename
              ... on HomeViewSectionArticles {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
                }
              }
            }
          }
        }
      `

      const { homeView } = await runQuery(query, {})

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArticles",
          "component": Object {
            "behaviors": Object {
              "viewAll": Object {
                "href": "/articles",
              },
            },
            "title": "Artsy Editorial",
          },
        }
      `)
    })
  })

  describe("News", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-news") {
              __typename

              ... on HomeViewSectionArticles {
                component {
                  title
                  type
                  behaviors {
                    viewAll {
                      href
                    }
                  }
                }

                articlesConnection(first: 3) {
                  edges {
                    node {
                      title
                      href
                    }
                  }
                }
              }
            }
          }
        }
      `

      const articles = [
        {
          title: "Bored apes stolen",
          slug: "stolen-apes",
        },
        {
          title: "More apes stolen",
          slug: "more-apes",
        },
      ]

      const context = {
        articlesLoader: jest.fn().mockReturnValue({
          count: articles.length,
          results: articles,
        }),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArticles",
          "articlesConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "href": "/article/stolen-apes",
                  "title": "Bored apes stolen",
                },
              },
              Object {
                "node": Object {
                  "href": "/article/more-apes",
                  "title": "More apes stolen",
                },
              },
            ],
          },
          "component": Object {
            "behaviors": Object {
              "viewAll": Object {
                "href": "/news",
              },
            },
            "title": "News",
            "type": "ArticlesCard",
          },
        }
      `)
    })
  })

  describe("HomeViewSectionSales", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-auctions") {
              __typename

              ... on HomeViewSectionSales {
                component {
                  title
                  behaviors {
                    viewAll {
                      href
                    }
                  }
                }

                salesConnection(first: 2) {
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

      const sales = [
        {
          name: "Auction 1",
        },
        {
          name: "Auction 2",
        },
      ]

      const context = {
        salesLoader: jest.fn().mockResolvedValue(sales),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionSales",
          "component": Object {
            "behaviors": Object {
              "viewAll": Object {
                "href": "/auctions",
              },
            },
            "title": "Auctions",
          },
          "salesConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "name": "Auction 1",
                },
              },
              Object {
                "node": Object {
                  "name": "Auction 2",
                },
              },
            ],
          },
        }
      `)
    })
  })

  describe("Your Active Bids", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-active-bids") {
              __typename

              ... on HomeViewSectionArtworks {
                component {
                  title
                }

                artworksConnection(first: 2) {
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

      const lots = [
        {
          sale_artwork: {
            artwork: {
              title: "Artwork 1",
            },
          },
        },
        {
          sale_artwork: {
            artwork: {
              title: "Artwork 2",
            },
          },
        },
      ]

      const context = {
        accessToken: "424242",
        lotStandingLoader: jest.fn().mockResolvedValue(lots),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArtworks",
          "artworksConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "title": "Artwork 1",
                },
              },
              Object {
                "node": Object {
                  "title": "Artwork 2",
                },
              },
            ],
          },
          "component": Object {
            "title": "Your Active Bids",
          },
        }
      `)
    })
  })

  describe("GalleriesNearYou", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-galleries-near-you") {
              __typename

              ... on HomeViewSectionGalleries {
                component {
                  title
                  backgroundImageURL
                  description
                  href
                  behaviors {
                    viewAll {
                      href
                      buttonText
                    }
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
                  "__typename": "HomeViewSectionGalleries",
                  "component": Object {
                    "backgroundImageURL": "https://files.artsy.net/images/galleries_for_you.webp",
                    "behaviors": Object {
                      "viewAll": Object {
                        "buttonText": "Explore",
                        "href": "/galleries-for-you",
                      },
                    },
                    "description": "Follow these local galleries for updates on artists you love.",
                    "href": "/galleries-for-you",
                    "title": "Galleries Near You",
                  },
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
              ... on HomeViewSectionArticles {
                id
              }
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
            ... on HomeViewSectionArticles {
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
