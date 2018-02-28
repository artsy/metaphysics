import { runQuery } from "test/utils"

describe("PartnerShows type", () => {
  describe("#kind", () => {
    it("returns the correct computed `kind` field for each show", () => {
      const query = `
        {
          partner_shows {
            id
            kind
          }
        }
      `

      const rootValue = {
        showsLoader: sinon.stub().returns(
          Promise.resolve([
            {
              id: "new-museum-solo-show",
              partner: {
                id: "new-museum",
              },
              display_on_partner_profile: true,
            },
            {
              id: "new-museum-group-show",
              partner: {
                id: "new-museum",
              },
              display_on_partner_profile: true,
            },
            {
              id: "new-museum-fair-booth",
              partner: {
                id: "new-museum",
              },
              display_on_partner_profile: true,
            },
          ])
        ),
        partnerShowLoader: jest
          .fn()
          .mockReturnValueOnce(
            Promise.resolve({
              artists: [{}],
              fair: null,
            })
          )
          .mockReturnValueOnce(
            Promise.resolve({
              artists: [{}, {}],
              fair: null,
            })
          )
          .mockReturnValueOnce(
            Promise.resolve({
              artists: [{}],
              fair: { id: "existy" },
            })
          ),
      }

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          partner_shows: [
            { id: "new-museum-solo-show", kind: "solo" },
            { id: "new-museum-group-show", kind: "group" },
            { id: "new-museum-fair-booth", kind: "fair" },
          ],
        })
      })
    })
  })
})
