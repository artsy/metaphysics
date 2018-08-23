/* eslint-disable promise/always-return */

import { runQuery } from "test/utils"
import gql from "lib/gql"

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

  it("returns a list of shows matching array of ids", async () => {
    const showsLoader = ({ id }) => {
      if (id) {
        return Promise.resolve(
          id.map(_id => ({
            _id,
            partner: {
              id: "new-museum",
            },
            display_on_partner_profile: true,
          }))
        )
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        partner_shows(ids: ["52c721e5b202a3edf1000072"]) {
          _id
        }
      }
    `
    const { partner_shows } = await runQuery(query, { showsLoader })
    expect(partner_shows[0]._id).toEqual("52c721e5b202a3edf1000072")
  })
})
