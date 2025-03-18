/* eslint-disable promise/always-return */
import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner type", () => {
  let partnerData = null
  let context = null

  beforeEach(() => {
    partnerData = {
      _id: "internal-id",
      id: "catty-partner",
      slug: "catty-partner",
      name: "Catty Partner",
      type: "Gallery",
      has_full_profile: true,
      inquireable: false,
      distinguish_represented_artists: true,
      profile_banner_display: "Artworks",
      claimed: true,
      show_promoted: true,
      display_full_partner_page: true,
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

  it("returns distinguishRepresentedArtists field", async () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          distinguishRepresentedArtists
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        distinguishRepresentedArtists: true,
      },
    })
  })

  it("returns profileBannerDisplay field", async () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          profileBannerDisplay
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        profileBannerDisplay: "Artworks",
      },
    })
  })

  it("returns isInquireable field", async () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          isInquireable
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        isInquireable: false,
      },
    })
  })

  it("returns claimed field", async () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          claimed
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        claimed: true,
      },
    })
  })

  it("returns showPromoted field", async () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          showPromoted
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        showPromoted: true,
      },
    })
  })

  it("returns partnerType field", async () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          partnerType
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        partnerType: "Gallery",
      },
    })
  })

  it("returns displayFullPartnerPage field", async () => {
    const query = gql`
      {
        partner(id: "catty-partner") {
          displayFullPartnerPage
        }
      }
    `
    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        displayFullPartnerPage: true,
      },
    })
  })

  describe("#viewingRoomsConnection", () => {
    it("returns viewingRoomsConnection field", async () => {
      const query = gql`
        {
          partner(id: "catty-partner") {
            viewingRoomsConnection(first: 1) {
              totalCount
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      `

      const viewingRoomsLoader = jest.fn().mockResolvedValue({
        body: [
          {
            title: "Viewing Room 1",
          },
        ],
        headers: {
          "x-total-count": 1,
        },
      })

      const data = await runQuery(query, {
        ...context,
        viewingRoomsLoader: viewingRoomsLoader,
      })

      expect(viewingRoomsLoader).toHaveBeenCalledWith({
        page: 1,
        partner_id: "internal-id",
        size: 1,
        total_count: true,
      })

      expect(data).toMatchInlineSnapshot(`
        {
          "partner": {
            "viewingRoomsConnection": {
              "edges": [
                {
                  "node": {
                    "title": "Viewing Room 1",
                  },
                },
              ],
              "totalCount": 1,
            },
          },
        }
      `)
    })
  })

  it.each([
    ["Gallery", true],
    ["Institution", true],
    ["Institutional Seller", true],
    ["Brand", true],
    ["Auction", false],
    ["Demo", false],
    ["Private Collector", false],
    ["Private Dealer", false],
  ])(
    "returns partnerPageEligible field when partner type is %s",
    async (type, result) => {
      partnerData.type = type

      const query = gql`
        {
          partner(id: "catty-partner") {
            partnerPageEligible
          }
        }
      `
      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          partnerPageEligible: result,
        },
      })
    }
  )

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

  describe("#meta", () => {
    let profileData

    beforeEach(() => {
      profileData = {
        owner: partnerData,
        bio: "partner profile bio",
        owner_type: "PartnerGallery",
        icon: {
          image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
          image_versions: ["square140", "large"],
          image_urls: {
            square140: "https://xxx.cloudfront.net/xxx/square140.jpg",
            large: "https://xxx.cloudfront.net/xxx/large.jpg",
          },
        },
      }

      context = {
        profileLoader: () => Promise.resolve(profileData),
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    it("returns meta", async () => {
      const query = `
        {
          partner(id:"catty-partner") {
            meta {
              title
              image
              description
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          meta: {
            title:
              "Catty Partner | Artists, Art for Sale, and Contact Info | Artsy",
            image: "https://xxx.cloudfront.net/xxx/square140.jpg",
            description: "partner profile bio",
          },
        },
      })
    })

    it("returns meta if profile empty", async () => {
      context = {
        profileLoader: () => Promise.reject(),
        partnerLoader: () => Promise.resolve(partnerData),
      }

      const query = `
        {
          partner(id:"catty-partner") {
            meta {
              title
              image
              description
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          meta: {
            title: "Catty Partner | Artsy",
            image: null,
            description: "Catty Partner on Artsy",
          },
        },
      })
    })

    it("returns meta when Institution partner", async () => {
      profileData.owner_type = "PartnerInstitution"

      const query = `
        {
          partner(id:"catty-partner") {
            meta {
              title
              description
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          meta: {
            title:
              "Catty Partner | Artists, Artworks, and Contact Info | Artsy",
            description: "partner profile bio",
          },
        },
      })
    })

    it("returns meta when bio empty and Gallery partner", async () => {
      profileData.bio = null

      const query = `
        {
          partner(id:"catty-partner") {
            meta {
              title
              description
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          meta: {
            title:
              "Catty Partner | Artists, Art for Sale, and Contact Info | Artsy",
            description:
              "Explore Artists, Artworks, and Shows from Catty Partner on Artsy",
          },
        },
      })
    })

    it("returns meta when bio empty and not Gallery partner", async () => {
      profileData.bio = null
      profileData.owner_type = "PartnerInstitution"

      const query = `
        {
          partner(id:"catty-partner") {
            meta {
              title
              description
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          meta: {
            title:
              "Catty Partner | Artists, Artworks, and Contact Info | Artsy",
            description: "Catty Partner on Artsy",
          },
        },
      })
    })

    it("returns meta when FairOrganizer partner", async () => {
      profileData.owner_type = "FairOrganizer"

      const query = `
        {
          partner(id:"catty-partner") {
            meta {
              title
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          meta: {
            title:
              "Catty Partner | Fair Info, Artists, and Art for Sale | Artsy",
          },
        },
      })
    })

    it("returns meta when partner without icon", async () => {
      profileData.icon = null

      const query = `
        {
          partner(id:"catty-partner") {
            meta {
              image
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          meta: {
            image: null,
          },
        },
      })
    })
  })

  describe("#locationsConnection", () => {
    let locationsResponse

    beforeEach(() => {
      locationsResponse = [
        {
          city: "New York",
          country: "US",
          address: "401 Broadway 26th floor",
          address_2: "",
          postal_code: "10013",
          state: "NY",
          publicly_viewable: true,
          address_type: "Buisness",
        },
        {
          city: "Detroit",
          country: "US",
          address: "123 Main Street",
          address_2: "",
          postal_code: "12345",
          state: "MI",
        },
        {
          city: "Tokyo",
          country: "JP",
          address: "123 Main Street",
          address_2: "",
          postal_code: "12345",
          state: "",
        },
      ]
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          partnerLocationsConnectionLoader: () =>
            Promise.resolve({
              body: locationsResponse,
              headers: {
                "x-total-count": locationsResponse.length,
              },
            }),
        },
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    describe("authentication", () => {
      it("throws error if private=true, yet not authenticated", () => {
        const query = `
          {
            partner(id:"bau-xi-gallery") {
              locationsConnection(first:3, private:true) {
                totalCount
              }
            }
          }
        `
        return runQuery(query, context).catch((error) => {
          expect(error.message).toEqual(
            "You need to pass a X-Access-Token header to perform this action"
          )
        })
      })

      it("returns locations", async () => {
        context.authenticatedLoaders = context.unauthenticatedLoaders

        const query = `
          {
            partner(id:"bau-xi-gallery") {
              locationsConnection(first:3, private: true) {
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

    it("returns additional location metadata", async () => {
      const query = `
      {
        partner(id:"bau-xi-gallery") {
          locationsConnection(first:1) {
            totalCount
            edges {
              node {
                publiclyViewable
                addressType
                display
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
                  addressType: "Buisness",
                  publiclyViewable: true,
                  display: "401 Broadway 26th floor, New York, NY, 10013, US",
                },
              },
            ],
          },
        },
      })
    })

    it("returns formated display locations", async () => {
      const query = `
        {
          partner(id:"bau-xi-gallery") {
            locationsConnection(first:3) {
              totalCount
              edges {
                node {
                  display
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
                  display: "401 Broadway 26th floor, New York, NY, 10013, US",
                },
              },
              {
                node: {
                  display: "123 Main Street, Detroit, MI, 12345, US",
                },
              },
              {
                node: {
                  display: "123 Main Street, Tokyo, 12345, JP",
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
    const partnerArtworksLoader = jest.fn(() => {
      return Promise.resolve({
        body: artworksResponse,
        headers: {
          "x-total-count": artworksResponse.length,
        },
      })
    })

    const partnerArtworksAllLoader = jest.fn(() => {
      return Promise.resolve({
        body: artworksResponse,
        headers: {
          "x-total-count": artworksResponse.length,
        },
      })
    })

    const partnerLoader = jest.fn(() => {
      return Promise.resolve(partnerData)
    })

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
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    describe("when query is authenticated", () => {
      beforeEach(() => {
        context = {
          partnerArtworksAllLoader,
          partnerArtworksLoader,
          partnerLoader,
        }
      })

      it("loads the total count", async () => {
        const query = gql`
          {
            partner(id: "bau-xi-gallery") {
              artworksConnection(first: 3) {
                totalCount
              }
            }
          }
        `

        const data = await runAuthenticatedQuery(query, context)

        expect(data).toEqual({
          partner: {
            artworksConnection: {
              totalCount: 3,
            },
          },
        })
      })

      it("returns cursor info", async () => {
        const query = gql`
          {
            partner(id: "bau-xi-gallery") {
              artworksConnection(first: 3) {
                totalCount
                pageCursors {
                  around {
                    page
                  }
                }
              }
            }
          }
        `

        const data = await runAuthenticatedQuery(query, context)

        expect(data).toEqual({
          partner: {
            artworksConnection: {
              totalCount: 3,
              pageCursors: {
                around: [
                  {
                    page: 1,
                  },
                ],
              },
            },
          },
        })
      })

      describe("when shallow is false", () => {
        it("calls partnerArtworksAllLoader", async () => {
          const query = gql`
            {
              partner(id: "bau-xi-gallery") {
                artworksConnection(first: 3, shallow: false) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          `
          await runAuthenticatedQuery(query, context)
          expect(partnerArtworksAllLoader).toHaveBeenCalled()
        })
      })
      describe("when shallow is true", () => {
        it("does not call partnerArtworksAllLoader", async () => {
          const query = gql`
            {
              partner(id: "bau-xi-gallery") {
                artworksConnection(first: 3, shallow: true) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          `
          await runAuthenticatedQuery(query, context)
          expect(partnerArtworksAllLoader).not.toHaveBeenCalled()
        })
      })
    })

    describe("when query is not authenticated", () => {
      beforeEach(() => {
        context = { partnerLoader, partnerArtworksLoader }
      })
      it("returns artworks", async () => {
        const query = gql`
          {
            partner(id: "bau-xi-gallery") {
              artworksConnection(first: 3) {
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
        const query = gql`
          {
            partner(id: "bau-xi-gallery") {
              artworksConnection(first: 1) {
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
        const query = gql`
          {
            partner(id: "bau-xi-gallery") {
              artworksConnection(first: 3) {
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

      it("loads the total count", async () => {
        const query = gql`
          {
            partner(id: "bau-xi-gallery") {
              artworksConnection(first: 3) {
                totalCount
              }
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          partner: {
            artworksConnection: {
              totalCount: 3,
            },
          },
        })
      })

      describe("when shallow is false", () => {
        it("does not call partnerArtworksAllLoader", async () => {
          const query = gql`
            {
              partner(id: "bau-xi-gallery") {
                artworksConnection(first: 3, shallow: false) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          `
          await runQuery(query, context)

          expect(partnerArtworksAllLoader).not.toHaveBeenCalled()
        })
      })
      describe("when shallow is true", () => {
        it("does not call partnerArtworksAllLoader", async () => {
          const query = gql`
            {
              partner(id: "bau-xi-gallery") {
                artworksConnection(first: 3, shallow: true) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          `

          await runQuery(query, context)

          expect(partnerArtworksAllLoader).not.toHaveBeenCalled()
        })
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
      const query = gql`
        {
          partner(id: "levy-gorvy") {
            showsConnection(first: 3) {
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
      const query = gql`
        {
          partner(id: "bau-xi-gallery") {
            showsConnection(first: 1) {
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
      const query = gql`
        {
          partner(id: "bau-xi-gallery") {
            showsConnection(first: 3) {
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

    it("loads the total count", async () => {
      const query = gql`
        {
          partner(id: "levy-gorvy") {
            showsConnection(first: 3) {
              totalCount
            }
          }
        }
      `
      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          showsConnection: {
            totalCount: 3,
          },
        },
      })
    })
  })

  describe("#merchantAccount", () => {
    it("returns the merchant account", async () => {
      const merchantAccountResponse = [
        {
          external_id: "456",
        },
      ]

      context = {
        partnerLoader: () => Promise.resolve(partnerData),
        partnerMerchantAccountsLoader: () =>
          Promise.resolve({
            body: merchantAccountResponse,
            headers: {
              "x-total-count": merchantAccountResponse.length,
            },
          }),
      }

      const query = gql`
        {
          partner(id: "levy-gorvy") {
            merchantAccount {
              externalId
            }
          }
        }
      `
      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          merchantAccount: {
            externalId: "456",
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

    it("loads the total count", async () => {
      const query = gql`
        {
          partner(id: "bau-xi-gallery") {
            artistsConnection(first: 3) {
              totalCount
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            totalCount: 3,
          },
        },
      })
    })
  })

  describe("#allArtistsConnection", () => {
    let artistsResponse

    beforeEach(() => {
      artistsResponse = [
        {
          published_artworks_count: 0,
          represented_by: true,
          artist: {
            id: "jessica-lichtenstein",
          },
        },
        {
          published_artworks_count: 12,
          represented_by: true,
          artist: {
            id: "yves-klein",
          },
        },
        {
          published_artworks_count: 10,
          represented_by: false,
          artist: {
            id: "carol-rama",
          },
        },
        {
          published_artworks_count: 0,
          represented_by: false,
          artist: {
            id: "edozie-anedu",
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

    it("returns all artists", async () => {
      const query = gql`
        {
          partner(id: "catty-partner") {
            allArtistsConnection {
              edges {
                counts {
                  artworks
                }
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
          allArtistsConnection: {
            edges: [
              {
                counts: {
                  artworks: 0,
                },
                representedBy: true,
                node: {
                  slug: "jessica-lichtenstein",
                },
              },
              {
                counts: {
                  artworks: 12,
                },
                representedBy: true,
                node: {
                  slug: "yves-klein",
                },
              },
              {
                counts: {
                  artworks: 10,
                },
                representedBy: false,
                node: {
                  slug: "carol-rama",
                },
              },
              {
                counts: {
                  artworks: 0,
                },
                representedBy: false,
                node: {
                  slug: "edozie-anedu",
                },
              },
            ],
          },
        },
      })
    })

    it("returns all represented artists and not represented artists with published artworks", async () => {
      const query = gql`
        {
          partner(id: "catty-partner") {
            allArtistsConnection(
              hasNotRepresentedArtistWithPublishedArtworks: true
            ) {
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
          allArtistsConnection: {
            edges: [
              {
                node: {
                  slug: "jessica-lichtenstein",
                },
              },
              {
                node: {
                  slug: "yves-klein",
                },
              },
              {
                node: {
                  slug: "carol-rama",
                },
              },
            ],
          },
        },
      })
    })

    it("loads the total count", async () => {
      const query = gql`
        {
          partner(id: "bau-xi-gallery") {
            allArtistsConnection {
              totalCount
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          allArtistsConnection: {
            totalCount: 4,
          },
        },
      })
    })
  })

  describe("#artistWithAlertsConnection", () => {
    it("returns partner artist details and total counts of alerts set for that partner's artist", async () => {
      const response = {
        body: {
          hits: [
            {
              artist: {
                name: "Molly D",
                id: "5f80bfefe8d808000ea212c2",
              },
              total_alert_count: 1,
            },
            {
              artist: {
                name: "Percy Z",
                id: "5f80bfefe8d808000ea212c1",
              },
              total_alert_count: 12,
            },
          ],
        },
        headers: {
          "x-total-count": 2,
        },
      }

      const query = gql`
        {
          partner(id: "catty-partner") {
            artistsWithAlertCountsConnection(first: 10) {
              totalCount
              edges {
                totalAlertCount
                node {
                  name
                }
              }
            }
          }
        }
      `
      const partnerArtistsWithAlertCountsLoader = () =>
        Promise.resolve(response)

      const data = await runAuthenticatedQuery(query, {
        ...context,
        partnerArtistsWithAlertCountsLoader,
      })
      expect(data).toEqual({
        partner: {
          artistsWithAlertCountsConnection: {
            totalCount: 2,
            edges: [
              {
                totalAlertCount: 1,
                node: {
                  name: "Molly D",
                },
              },
              {
                totalAlertCount: 12,
                node: {
                  name: "Percy Z",
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("#partnerAlertHitsConnection", () => {
    it("returns connection of matching partner_alert_hits", async () => {
      const response = {
        body: [
          {
            id: "some-id",
            artwork: {
              title: "Some Artwork",
              _id: "5f80bfefe8d808000ea212c2",
            },
            created_at: "foo",
            user_ids: ["foo", "bar"],
            search_criteria: {
              id: "3f980bbe-7b9b-4fa9-beb1-69d13e94fb0c",
            },
          },
        ],
        headers: {
          "x-total-count": 1,
        },
      }

      const query = gql`
        {
          partner(id: "cypress-test-partner-for-automated-testing-purposes") {
            partnerAlertHitsConnection(first: 10) {
              totalCount
              edges {
                internalID
                artwork {
                  internalID
                  title
                }
                userIDs
                createdAt
                node {
                  internalID
                }
              }
            }
          }
        }
      `
      const partnerSearchCriteriaHitsLoader = () => Promise.resolve(response)

      const data = await runAuthenticatedQuery(query, {
        ...context,
        partnerSearchCriteriaHitsLoader,
      })
      expect(data).toEqual({
        partner: {
          partnerAlertHitsConnection: {
            totalCount: 1,
            edges: [
              {
                internalID: "some-id",
                userIDs: ["foo", "bar"],
                createdAt: "foo",
                artwork: {
                  internalID: "5f80bfefe8d808000ea212c2",
                  title: "Some Artwork",
                },
                node: {
                  internalID: "3f980bbe-7b9b-4fa9-beb1-69d13e94fb0c",
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("#alertsConnection", () => {
    it("returns a single partner alert", async () => {
      const response = {
        body: {
          id: "8754ff90-b020-425b-8dae-894ce5ad9d1f",
          search_criteria_id: "3f980bbe-7b9b-4fa9-beb1-69d13e94fb0c",
          partner_id: "5f80bfefe8d808000ea212c1",
          search_criteria: {
            id: "3f980bbe-7b9b-4fa9-beb1-69d13e94fb0c",
            price_range: "1-2",
          },
        },
      }

      const query = gql`
        {
          partner(id: "catty-partner") {
            alertsConnection(id: "8754ff90-b020-425b-8dae-894ce5ad9d1f") {
              edges {
                node {
                  priceRange
                }
              }
            }
          }
        }
      `
      const partnerSearchCriteriaLoader = () => Promise.resolve(response)

      const data = await runAuthenticatedQuery(query, {
        ...context,
        partnerSearchCriteriaLoader,
      })

      expect(data).toEqual({
        partner: {
          alertsConnection: {
            edges: [
              {
                node: {
                  priceRange: "1-2",
                },
              },
            ],
          },
        },
      })
    })

    it("returns partner search criteria details and associated search criteria details", async () => {
      const response = {
        body: {
          hits: [
            {
              id: "8754ff90-b020-425b-8dae-894ce5ad9d1f",
              search_criteria_id: "3f980bbe-7b9b-4fa9-beb1-69d13e94fb0c",
              partner_id: "5f80bfefe8d808000ea212c1",
              search_criteria: {
                id: "3f980bbe-7b9b-4fa9-beb1-69d13e94fb0c",
                price_range: "1-2",
              },
            },
            {
              id: "b4adc50d-a584-4820-9140-4d49d7b6c7dc",
              search_criteria_id: "614af56c-88cb-4ea7-bec5-fbdf9b67c24a",
              partner_id: "5f80bfefe8d808000ea212c1",
              search_criteria: {
                id: "614af56c-88cb-4ea7-bec5-fbdf9b67c24a",
                price_range: "1000-5000",
              },
            },
          ],
        },
        headers: {
          "x-total-count": 2,
        },
      }

      const query = gql`
        {
          partner(id: "catty-partner") {
            alertsConnection(first: 10) {
              edges {
                node {
                  priceRange
                }
              }
            }
          }
        }
      `
      const partnerSearchCriteriasLoader = () => Promise.resolve(response)

      const data = await runAuthenticatedQuery(query, {
        ...context,
        partnerSearchCriteriasLoader,
      })
      expect(data).toEqual({
        partner: {
          alertsConnection: {
            edges: [
              {
                node: {
                  priceRange: "1-2",
                },
              },
              {
                node: {
                  priceRange: "1000-5000",
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("#articlesConnection", () => {
    let articlesResponse

    beforeEach(() => {
      articlesResponse = {
        count: 4,
        results: [
          {
            slug: "bastian-picasso-printmaking",
          },
          {
            slug: "bastian-eating-eyes",
          },
          {
            slug: "bastian-questions-wim-wendr",
          },
        ],
      }

      context = {
        articlesLoader: () => Promise.resolve(articlesResponse),
        partnerLoader: () => Promise.resolve(partnerData),
      }
    })

    it("returns articles with count", async () => {
      const query = gql`
        {
          partner(id: "bastian") {
            articlesConnection(first: 3) {
              totalCount
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
          articlesConnection: {
            totalCount: 4,
            edges: [
              {
                node: {
                  slug: "bastian-picasso-printmaking",
                },
              },
              {
                node: {
                  slug: "bastian-eating-eyes",
                },
              },
              {
                node: {
                  slug: "bastian-questions-wim-wendr",
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("#showsSearchConnection", () => {
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
        partnerSearchShowsLoader: () =>
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
      const query = gql`
        {
          partner(id: "levy-gorvy") {
            showsSearchConnection(query: "levy") {
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
          showsSearchConnection: {
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
  })

  describe("#artistsSearchConnection", () => {
    let artistsResponse

    beforeEach(() => {
      artistsResponse = [
        {
          id: "pablo-picasso",
        },
        {
          id: "kaws",
        },
        {
          id: "bisa-butler",
        },
      ]
      context = {
        partnerSearchArtistsLoader: () =>
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
      const query = gql`
        {
          partner(id: "levy-gorvy") {
            artistsSearchConnection(query: "some-query") {
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
          artistsSearchConnection: {
            edges: [
              {
                node: {
                  slug: "pablo-picasso",
                },
              },
              {
                node: {
                  slug: "kaws",
                },
              },
              {
                node: {
                  slug: "bisa-butler",
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("#artworksSearchConnection", () => {
    let artworksResponse

    beforeEach(() => {
      artworksResponse = [
        {
          id: "pablo-picasso-odd-horse",
        },
        {
          id: "kaws-mickey-or-something",
        },
        {
          id: "bisa-butler-cool-quilt",
        },
      ]
      context = {
        partnerSearchArtworksLoader: () =>
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
      const query = gql`
        {
          partner(id: "levy-gorvy") {
            artworksSearchConnection(query: "some-query") {
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
          artworksSearchConnection: {
            edges: [
              {
                node: {
                  slug: "pablo-picasso-odd-horse",
                },
              },
              {
                node: {
                  slug: "kaws-mickey-or-something",
                },
              },
              {
                node: {
                  slug: "bisa-butler-cool-quilt",
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("#href", () => {
    it("returns an href when partner type is eligible for a page", async () => {
      partnerData.type = "Gallery"

      const query = gql`
        {
          partner(id: "catty-partner") {
            href
          }
        }
      `
      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          href: "/partner/catty-partner",
        },
      })
    })

    it("returns null when partner type is not eligible for a page", async () => {
      partnerData.type = "Auction"

      const query = gql`
        {
          partner(id: "catty-partner") {
            href
          }
        }
      `
      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          href: null,
        },
      })
    })
  })
})
