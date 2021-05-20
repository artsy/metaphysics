import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partnerArtist", () => {
  let partnerArtistData = null
  let partnerData = null
  let context = null

  beforeEach(() => {
    partnerData = {
      id: "catty-partner",
      slug: "catty-partner",
      name: "Catty Partner",
      has_full_profile: true,
      profile_banner_display: true,
      distinguish_represented_artists: true,
      partner_categories: [
        {
          id: "blue-chip",
          name: "Blue Chip",
        },
      ],
      website: "https://www.newmuseum.org/",
    }

    context = {
      partnerArtistsForPartnerLoader: () =>
        Promise.resolve({
          body: partnerArtistData,
          headers: {
            "x-total-count": partnerArtistData.length,
          },
        }),
      partnerLoader: () => Promise.resolve(partnerData),
    }
  })

  describe("biographyBlurb", () => {
    it("handles a default biography", async () => {
      partnerArtistData = [
        {
          use_default_biography: true,
          biography: "Partner provided biography",
          artist: {
            blurb: "Artsy provided biography",
          },
          partner: {
            name: "Catty Gallery",
          },
        },
      ]

      const query = gql`
        {
          partner(id: "levy-gorvy") {
            artistsConnection(first: 3) {
              edges {
                biographyBlurb {
                  credit
                  text
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                biographyBlurb: {
                  credit: null,
                  text: "Artsy provided biography",
                },
              },
            ],
          },
        },
      })
    })

    it("handles a non-default biography", async () => {
      partnerArtistData = [
        {
          use_default_biography: false,
          biography: "Partner provided biography",
          artist: {
            blurb: "Artsy provided biography",
          },
          partner: {
            name: "Catty Gallery",
          },
        },
      ]

      const query = gql`
        {
          partner(id: "levy-gorvy") {
            artistsConnection(first: 3) {
              edges {
                biographyBlurb {
                  credit
                  text
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                biographyBlurb: {
                  credit: "Submitted by Catty Gallery",
                  text: "Partner provided biography",
                },
              },
            ],
          },
        },
      })
    })

    it("handles no biography data", async () => {
      partnerArtistData = [
        {
          use_default_biography: false,
          biography: "",
          artist: {
            blurb: "Artsy provided biography",
          },
          partner: {
            name: "Catty Gallery",
          },
        },
      ]

      const query = gql`
        {
          partner(id: "levy-gorvy") {
            artistsConnection(first: 3) {
              edges {
                biographyBlurb {
                  credit
                  text
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                biographyBlurb: null,
              },
            ],
          },
        },
      })
    })
  })

  describe("#PartnerArtistArtworksConnection", () => {
    let partnerArtistArtworksResponse
    partnerArtistData = [
      {
        artist: {
          blurb: "Artsy provided biography",
        },
        partner: {
          name: "Catty Gallery",
        },
      },
    ]

    beforeEach(() => {
      partnerArtistArtworksResponse = [
        {
          artwork: {
            title: "Artwork 1",
          },
          position: 3,
          partner_artist: {
            represented_by: false,
          },
        },
        {
          artwork: {
            title: "Artwork 2",
          },
          position: 2,
          partner_artist: {
            represented_by: true,
          },
        },
        {
          artwork: {
            title: "Artwork 3",
          },
          position: 1,
          partner_artist: {
            represented_by: true,
          },
        },
      ]
      context = {
        partnerArtistArtworksLoader: () =>
          Promise.resolve({
            body: partnerArtistArtworksResponse,
            headers: {
              "x-total-count": partnerArtistArtworksResponse.length,
            },
          }),
        partnerArtistsForPartnerLoader: () =>
          Promise.resolve({
            body: partnerArtistData,
            headers: {
              "x-total-count": partnerArtistData.length,
            },
          }),
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    it("returns artworks", async () => {
      const query = gql`
        {
          partner(id: "catty-partner") {
            artistsConnection(first: 1) {
              edges {
                partnerArtistArtworksConnection(first: 12) {
                  totalCount
                  edges {
                    node {
                      artwork {
                        title
                      }
                      position
                      partnerArtist {
                        representedBy
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                partnerArtistArtworksConnection: {
                  totalCount: 3,
                  edges: [
                    {
                      node: {
                        artwork: {
                          title: "Artwork 1",
                        },
                        position: 3,
                        partnerArtist: {
                          representedBy: false,
                        },
                      },
                    },
                    {
                      node: {
                        artwork: {
                          title: "Artwork 2",
                        },
                        position: 2,
                        partnerArtist: {
                          representedBy: true,
                        },
                      },
                    },
                    {
                      node: {
                        artwork: {
                          title: "Artwork 3",
                        },
                        position: 1,
                        partnerArtist: {
                          representedBy: true,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      })
    })

    it("returns hasNextPage=true when first is below total", async () => {
      const query = gql`
        {
          partner(id: "catty-partner") {
            artistsConnection(first: 1) {
              edges {
                partnerArtistArtworksConnection(first: 1) {
                  pageInfo {
                    hasNextPage
                  }
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                partnerArtistArtworksConnection: {
                  pageInfo: {
                    hasNextPage: true,
                  },
                },
              },
            ],
          },
        },
      })
    })

    it("returns hasNextPage=false when first is above total", async () => {
      const query = gql`
        {
          partner(id: "catty-partner") {
            artistsConnection(first: 1) {
              edges {
                partnerArtistArtworksConnection(first: 3) {
                  pageInfo {
                    hasNextPage
                  }
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                partnerArtistArtworksConnection: {
                  pageInfo: {
                    hasNextPage: false,
                  },
                },
              },
            ],
          },
        },
      })
    })
  })
})
