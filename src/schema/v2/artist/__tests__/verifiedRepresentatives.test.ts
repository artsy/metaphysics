/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Artist verifiedRepresentatives", () => {
  const artist = {
    _id: "123456",
  }

  const artistLoader = () => Promise.resolve(artist)

  const verifiedRepresentativesResponse = [
    {
      partner_id: "123",
    },
    {
      partner_id: "456",
    },
  ]

  const cattyPartnerDataResponse = {
    name: "Catty Partner",
  }

  const yttacPartnerDataResponse = {
    name: "Yttac Partner",
  }

  const verifiedRepresentativesLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(verifiedRepresentativesResponse))

  const verifiedRepresentativesWithoutResponseLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve([]))

  const partnerLoader = jest
    .fn()
    .mockReturnValueOnce(Promise.resolve(cattyPartnerDataResponse))
    .mockReturnValueOnce(Promise.resolve(yttacPartnerDataResponse))

  const context = {
    artistLoader,
    verifiedRepresentativesLoader,
    partnerLoader,
  }

  const contextWithEmptyResponse = {
    artistLoader,
    verifiedRepresentativesLoader: verifiedRepresentativesWithoutResponseLoader,
    partnerLoader,
  }

  describe("with a artist_id", () => {
    it("returns a verifiedRepresentatives partners", () => {
      const query = `
      {
        artist(id: "123456") {
          verifiedRepresentatives {
            partner {
              name
            }
          }
        }
      }
    `

      return runQuery(query, context).then(({ artist: { ...response } }) => {
        const verifiedRepresentatives = response.verifiedRepresentatives
        expect(verifiedRepresentatives[0].partner.name).toBe("Catty Partner")
        expect(verifiedRepresentatives[1].partner.name).toBe("Yttac Partner")
      })
    })

    it("returns empty list when there are no partners", () => {
      const query = `
      {
        artist(id: "123456") {
          verifiedRepresentatives {
            partner {
              name
            }
          }
        }
      }
    `

      return runQuery(query, contextWithEmptyResponse).then((data) => {
        expect(data.artist.verifiedRepresentatives).toEqual([])
      })
    })
  })
})
