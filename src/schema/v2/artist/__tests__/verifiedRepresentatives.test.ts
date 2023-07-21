/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Artist verifiedRepresentatives", () => {
  const artist = {
    _id: "123456",
  }

  const artistLoader = () => Promise.resolve(artist)

  const verifiedRepresentativesResponse = [
    {
      partner_id: "123456",
    },
  ]

  const partnerDataResponse = {
    body: [
      {
        name: "Catty Partner",
      },
      {
        name: "Yttac Partner",
      },
    ],
  }

  const verifiedRepresentativesLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(verifiedRepresentativesResponse))

  const partnersLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(partnerDataResponse))

  const context = {
    artistLoader,
    verifiedRepresentativesLoader,
    partnersLoader,
  }

  describe("with a artist_id", () => {
    it("returns a verifiedRepresentatives partners", () => {
      const query = `
      {
        artist(id: "123456") {
          verifiedRepresentatives {
            name
          }
        }
      }
    `

      return runQuery(query, context).then(({ artist: { ...response } }) => {
        const verifiedRepresentatives = response.verifiedRepresentatives
        expect(verifiedRepresentatives[0].name).toBe("Catty Partner")
        expect(verifiedRepresentatives[1].name).toBe("Yttac Partner")
      })
    })
  })
})
