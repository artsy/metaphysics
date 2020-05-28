/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Artist Statuses", () => {
  let context = null
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
    context = {
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

  // FIXME: Didn't return results, might be a bug (or need to be updated to the correct usage)
  it.skip("returns partner artist highlights", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          highlights {
            partnersConnection(first: 1, displayOnPartnerProfile: true) {
              edges {
                representedBy
                node {
                  slug
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
          partnersConnection: {
            edges: [
              {
                representedBy: true,
                node: {
                  slug: "catty-gallery",
                  name: "Catty Gallery",
                },
              },
            ],
          },
        },
      },
    }

    return runQuery(query, context).then((data) => {
      expect(data).toEqual(expectedHighlightData)
    })
  })
})
