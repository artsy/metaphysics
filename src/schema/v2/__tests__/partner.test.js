/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner type", () => {
  let partnerData = null
  let context = null

  beforeEach(() => {
    partnerData = {
      id: "catty-partner",
      slug: "catty-partner",
      name: "Catty Partner",
      has_full_profile: true,
      profile_banner_display: true,
      partner_categories: [
        {
          id: "blue-chip",
          name: "Blue Chip",
        },
      ],
      website: "https://www.newmuseum.org/",
    }

    context = {
      partnerLoader: sinon
        .stub()
        .withArgs(partnerData.id)
        .returns(Promise.resolve(partnerData)),
    }
  })

  it("includes the gallery website address in shows", async () => {
    partnerData.partner = {
      website: "https://www.newmuseum.org/",
    }
    const query = gql`
      {
        partner(id: "new-museum-1-2015-triennial-surround-audience") {
          website
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        website: "https://www.newmuseum.org/",
      },
    })
  })

  it("returns a partner and categories", () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          name
          categories {
            slug
            name
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        partner: {
          name: "Catty Partner",
          categories: [
            {
              slug: "blue-chip",
              name: "Blue Chip",
            },
          ],
        },
      })
    })
  })

  describe("#LocationsConnection", () => {
    let locationsResponse

    beforeEach(() => {
      locationsResponse = [
        {
          city: "New York",
        },
        {
          city: "Detroit",
        },
        {
          city: "Tokyo",
        },
      ]
      context = {
        partnerLocationsConnectionLoader: () =>
          Promise.resolve({
            body: locationsResponse,
            headers: {
              "x-total-count": locationsResponse.length,
            },
          }),
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    it("returns locations", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            locationsConnection(first:3) {
              totalCount
              edges {
                node {
                  city
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          locationsConnection: {
            totalCount: 3,
            edges: [
              {
                node: {
                  city: "New York",
                },
              },
              {
                node: {
                  city: "Detroit",
                },
              },
              {
                node: {
                  city: "Tokyo",
                },
              },
            ],
          },
        },
      })
    })

    it("returns hasNextPage=true when first is below total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            locationsConnection(first:1) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          locationsConnection: {
            pageInfo: {
              hasNextPage: true,
            },
          },
        },
      })
    })

    it("returns hasNextPage=false when first is above total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            locationsConnection(first:3) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          locationsConnection: {
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      })
    })
  })

  describe("#artworksConnection", () => {
    let artworksResponse

    beforeEach(() => {
      artworksResponse = [
        {
          id: "cara-barer-iceberg",
        },
        {
          id: "david-leventi-rezzonico",
        },
        {
          id: "virginia-mak-hidden-nature-08",
        },
      ]
      context = {
        partnerArtworksLoader: () =>
          Promise.resolve({
            body: artworksResponse,
            headers: {
              "x-total-count": artworksResponse.length,
            },
          }),
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    it("returns artworks", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            artworksConnection(first:3) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artworksConnection: {
            edges: [
              {
                node: {
                  slug: "cara-barer-iceberg",
                },
              },
              {
                node: {
                  slug: "david-leventi-rezzonico",
                },
              },
              {
                node: {
                  slug: "virginia-mak-hidden-nature-08",
                },
              },
            ],
          },
        },
      })
    })

    it("returns hasNextPage=true when first is below total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            artworksConnection(first:1) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artworksConnection: {
            pageInfo: {
              hasNextPage: true,
            },
          },
        },
      })
    })

    it("returns hasNextPage=false when first is above total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            artworksConnection(first:3) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artworksConnection: {
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      })
    })
  })

  describe("#showsConnection", () => {
    let showsResponse

    beforeEach(() => {
      showsResponse = [
        {
          id: "levy-gorvy-our-lady-of-the-flowers-diane-arbus-carol-rama",
        },
        {
          id: "levy-gorvy-pierre-soulages-a-century",
        },
        {
          id: "levy-gorvy-levy-gorvy-at-fiac-2019",
        },
      ]
      context = {
        partnerShowsLoader: () =>
          Promise.resolve({
            body: showsResponse,
            headers: {
              "x-total-count": showsResponse.length,
            },
          }),
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    it("returns shows", async () => {
      const query = `
        {
          partner(id:"levy-gorvy") {
            showsConnection(first:3) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          showsConnection: {
            edges: [
              {
                node: {
                  slug:
                    "levy-gorvy-our-lady-of-the-flowers-diane-arbus-carol-rama",
                },
              },
              {
                node: {
                  slug: "levy-gorvy-pierre-soulages-a-century",
                },
              },
              {
                node: {
                  slug: "levy-gorvy-levy-gorvy-at-fiac-2019",
                },
              },
            ],
          },
        },
      })
    })

    it("returns hasNextPage=true when first is below total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            showsConnection(first:1) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          showsConnection: {
            pageInfo: {
              hasNextPage: true,
            },
          },
        },
      })
    })

    it("returns hasNextPage=false when first is above total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            showsConnection(first:3) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          showsConnection: {
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      })
    })
  })

  describe("#artistsConnection", () => {
    let artistsResponse

    beforeEach(() => {
      artistsResponse = [
        {
          represented_by: true,
          artist: {
            id: "jessica-lichtenstein",
          },
        },
        {
          represented_by: true,
          artist: {
            id: "yves-klein",
          },
        },
        {
          represented_by: false,
          artist: {
            id: "carol-rama",
          },
        },
      ]
      context = {
        partnerArtistsForPartnerLoader: () =>
          Promise.resolve({
            body: artistsResponse,
            headers: {
              "x-total-count": artistsResponse.length,
            },
          }),
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    it("returns artists", async () => {
      const query = `
        {
          partner(id:"levy-gorvy") {
            artistsConnection(first:3) {
              edges {
                representedBy
                node {
                  slug
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
                representedBy: true,
                node: {
                  slug: "jessica-lichtenstein",
                },
              },
              {
                representedBy: true,
                node: {
                  slug: "yves-klein",
                },
              },
              {
                representedBy: false,
                node: {
                  slug: "carol-rama",
                },
              },
            ],
          },
        },
      })
    })

    it("returns hasNextPage=true when first is below total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            artistsConnection(first:1) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            pageInfo: {
              hasNextPage: true,
            },
          },
        },
      })
    })

    it("returns hasNextPage=false when first is above total", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            artistsConnection(first:3) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      })
    })
  })
})
