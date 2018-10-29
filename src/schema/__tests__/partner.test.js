/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import gql from "lib/gql"

describe("Partner type", () => {
  let partner = null
  let rootValue = null

  beforeEach(() => {
    partner = {
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
    }

    rootValue = {
      partnerLoader: sinon
        .stub()
        .withArgs(partner.id)
        .returns(Promise.resolve(partner)),
    }
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

    return runQuery(query, rootValue).then(data => {
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
})
