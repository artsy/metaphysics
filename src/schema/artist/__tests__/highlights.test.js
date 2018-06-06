/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Artist Statuses", () => {
  let rootValue = null
  const artist = {
    id: "percy-z",
    birthday: "2014",
    artworks_count: 420,
  }

  const partnerArtistResp = [
    {
      artist,
      partner: {
        id: "catty-gallery",
        name: "Catty Gallery",
        has_full_profile: true,
        profile_banner_display: true,
      },
      represented_by: true,
    },
  ]

  beforeEach(() => {
    rootValue = {
      partnerArtistsLoader: sinon
        .stub()
        .withArgs(
          "partner_artists",
          sinon.match({ display_on_partner_profile: true })
        )
        .returns(
          Promise.resolve({
            headers: { "x-total-count": 1 },
            body: partnerArtistResp,
          })
        ),
      artistLoader: sinon.stub().returns(Promise.resolve(artist)),
    }
  })

  it("returns partner artist highlights", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          highlights {
            partners(first: 1, display_on_partner_profile: true) {
              edges {
                is_represented_by
                node {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `

    const expectedHighlightData = {
      artist: {
        highlights: {
          partners: {
            edges: [
              {
                is_represented_by: true,
                node: {
                  id: "catty-gallery",
                  name: "Catty Gallery",
                },
              },
            ],
          },
        },
      },
    }

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual(expectedHighlightData)
    })
  })
})
