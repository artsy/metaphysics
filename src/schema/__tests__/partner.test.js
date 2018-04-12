import { runQuery } from "test/utils"
import gql from "test/gql"

import { makeExecutableSchema } from "graphql-tools"
import fs from "fs"
import path from "path"

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

  describe("acceptsCardPayments", () => {
    let credit_card_enabled = true
    const query = gql`
      {
        partner(id: "catty-partner") {
          acceptsCardPayments
        }
      }
    `

    beforeEach(() => {
      partner.payments_enabled = true

      const typeDefs = fs.readFileSync(
        path.resolve(__dirname, "../../data/lewitt.graphql"),
        "utf8"
      )

      const resolvers = {
        RootQuery: {
          partner_product_merchant_account: () => {
            return { credit_card_enabled }
          },
        },
      }

      const lewittSchema = makeExecutableSchema({
        typeDefs,
        resolvers,
      })

      rootValue.lewittSchema = lewittSchema
    })

    it("returns true if payments_enabled and partner_product_merchant_account is configured in lewitt", () => {
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          partner: {
            acceptsCardPayments: true,
          },
        })
      })
    })

    it("returns false if payments_enabled set to false on partner", () => {
      partner.payments_enabled = false
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          partner: {
            acceptsCardPayments: false,
          },
        })
      })
    })

    it("returns false if partner_product_merchant_account is not configured in lewitt", () => {
      credit_card_enabled = false
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          partner: {
            acceptsCardPayments: false,
          },
        })
      })
    })
  })
})
