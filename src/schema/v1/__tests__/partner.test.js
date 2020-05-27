/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"
import gql from "lib/gql"

describe("Partner type", () => {
  let partnerData = null
  let context = null

  beforeEach(() => {
    partnerData = {
      id: "catty-partner",
      _id: "catty-partner",
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
          is_limited_fair_partner
          categories {
            id
            name
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        partner: {
          name: "Catty Partner",
          is_limited_fair_partner: false,
          categories: [
            {
              id: "blue-chip",
              name: "Blue Chip",
            },
          ],
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
                  id
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
                  id: "cara-barer-iceberg",
                },
              },
              {
                node: {
                  id: "david-leventi-rezzonico",
                },
              },
              {
                node: {
                  id: "virginia-mak-hidden-nature-08",
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
})
