import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partnerArtist", () => {
  let partnerArtistData = null
  let partnerData = null
  let context = null

  beforeEach(() => {
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

  it("returns a partner image", async () => {
    partnerArtistData = [
      {
        image_url: "foo.jpg",
        images_urls: ["foo.jpg", "bar.jpg"],
        image_versions: ["wide"],
      },
    ]

    const query = gql`
      {
        partner(id: "levy-gorvy") {
          artistsConnection(first: 3) {
            edges {
              imageUrl
              image {
                url
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
              image: {
                url: "foo.jpg",
              },
              imageUrl: "foo.jpg",
            },
          ],
        },
      },
    })
  })

  it("isHiddenInPresentationMode", async () => {
    partnerArtistData = [
      {
        hide_in_presentation_mode: true,
      },
    ]

    const query = gql`
      {
        partner(id: "levy-gorvy") {
          artistsConnection(first: 3) {
            edges {
              isHiddenInPresentationMode
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
              isHiddenInPresentationMode: true,
            },
          ],
        },
      },
    })
  })

  describe("isVerifiedRepresentative", () => {
    let verifiedRepresentativesLoader

    beforeEach(() => {
      partnerArtistData = [
        {
          artist: {
            id: "catty-artist",
          },
          partner: {
            id: "catty-partner",
          },
        },
      ]

      verifiedRepresentativesLoader = jest
        .fn()
        .mockReturnValue(Promise.resolve([]))

      context = {
        partnerArtistsForPartnerLoader: () =>
          Promise.resolve({
            body: partnerArtistData,
            headers: {
              "x-total-count": partnerArtistData.length,
            },
          }),
        partnerLoader: () => Promise.resolve(partnerData),
        verifiedRepresentativesLoader,
      }
    })

    const query = gql`
      {
        partner(id: "catty-partner") {
          artistsConnection(first: 1) {
            edges {
              isVerifiedRepresentative
            }
          }
        }
      }
    `

    it("is true when Artsy has verified the pair", async () => {
      verifiedRepresentativesLoader.mockReturnValue(
        Promise.resolve([
          {
            artist_id: "catty-artist",
            partner_id: "catty-partner",
          },
        ])
      )

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                isVerifiedRepresentative: true,
              },
            ],
          },
        },
      })
    })

    it("is false when Artsy has not verified the pair", async () => {
      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                isVerifiedRepresentative: false,
              },
            ],
          },
        },
      })
    })

    it("batches the lookup by partner rather than by pair", async () => {
      await runQuery(query, context)

      expect(verifiedRepresentativesLoader).toHaveBeenCalledTimes(1)
      expect(verifiedRepresentativesLoader).toHaveBeenCalledWith({
        partner_id: "catty-partner",
      })
    })

    describe("batching across a page", () => {
      beforeEach(() => {
        partnerArtistData = [
          {
            artist: { id: "verified-artist" },
            partner: { id: "catty-partner" },
          },
          {
            artist: { id: "unverified-artist" },
            partner: { id: "catty-partner" },
          },
        ]

        verifiedRepresentativesLoader.mockReturnValue(
          Promise.resolve([
            {
              artist_id: "verified-artist",
              partner_id: "catty-partner",
            },
          ])
        )
      })

      const pageQuery = gql`
        {
          partner(id: "catty-partner") {
            artistsConnection(first: 2) {
              edges {
                isVerifiedRepresentative
              }
            }
          }
        }
      `

      it("makes one Gravity call for the whole page", async () => {
        await runQuery(pageQuery, context)

        expect(verifiedRepresentativesLoader).toHaveBeenCalledTimes(1)
        expect(verifiedRepresentativesLoader).toHaveBeenCalledWith({
          partner_id: "catty-partner",
        })
      })

      it("resolves each edge from the batched response", async () => {
        const data = await runQuery(pageQuery, context)

        expect(data).toEqual({
          partner: {
            artistsConnection: {
              edges: [
                { isVerifiedRepresentative: true },
                { isVerifiedRepresentative: false },
              ],
            },
          },
        })
      })

      it("does not call Gravity when the field is not requested", async () => {
        const otherQuery = gql`
          {
            partner(id: "catty-partner") {
              artistsConnection(first: 2) {
                edges {
                  representedBy
                }
              }
            }
          }
        `

        await runQuery(otherQuery, context)

        expect(verifiedRepresentativesLoader).not.toHaveBeenCalled()
      })

      it("degrades to false when the batched lookup fails", async () => {
        verifiedRepresentativesLoader.mockReturnValue(
          Promise.reject(new Error("Gravity is down"))
        )

        const data = await runQuery(pageQuery, context)

        expect(data).toEqual({
          partner: {
            artistsConnection: {
              edges: [
                { isVerifiedRepresentative: false },
                { isVerifiedRepresentative: false },
              ],
            },
          },
        })
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
        },
        {
          artwork: {
            title: "Artwork 2",
          },
        },
        {
          artwork: {
            title: "Artwork 3",
          },
        },
      ]
      context = {
        partnerArtistPartnerArtistArtworksLoader: () =>
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
                artworksConnection(first: 12) {
                  totalCount
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

      const data = await runQuery(query, context)

      expect(data).toEqual({
        partner: {
          artistsConnection: {
            edges: [
              {
                artworksConnection: {
                  totalCount: 3,
                  edges: [
                    {
                      node: {
                        title: "Artwork 1",
                      },
                    },
                    {
                      node: {
                        title: "Artwork 2",
                      },
                    },
                    {
                      node: {
                        title: "Artwork 3",
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
                artworksConnection(first: 1) {
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
                artworksConnection: {
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
                artworksConnection(first: 3) {
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
                artworksConnection: {
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
