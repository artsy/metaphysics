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
})
