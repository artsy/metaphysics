import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("LatestAuctionResults", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-latest-auction-results") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
              description
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
    const context = {
      accessToken: "424242",
    }

    const data = await runQuery(query, context)

    expect(data).toMatchInlineSnapshot(`
      {
        "homeView": {
          "section": {
            "__typename": "HomeViewSectionAuctionResults",
            "component": {
              "behaviors": {
                "viewAll": {
                  "buttonText": "Browse All Results",
                  "href": null,
                  "ownerType": null,
                },
              },
              "description": null,
              "title": "Latest Auction Results",
            },
            "contextModule": "auctionResultsRail",
            "internalID": "home-view-section-latest-auction-results",
            "ownerType": "auctionResultsForArtistsYouFollow",
          },
        },
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = `
    {
      homeView {
        section(id: "home-view-section-latest-auction-results") {
          ... on HomeViewSectionAuctionResults {
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
      {
        "homeView": {
          "section": {
            "auctionResultsConnection": {
              "edges": [
                {
                  "node": {
                    "title": "Auction Result 1",
                  },
                },
                {
                  "node": {
                    "title": "Auction Result 2",
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
