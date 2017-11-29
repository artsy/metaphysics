import { runQuery } from "test/utils"

describe("Partner type", () => {
  let partner = null
  let rootValue = null

  beforeEach(() => {
    partner = {
      id: "catty-partner",
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
    const query = `
      {
        partner(id: "catty-partner") {
          name
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
