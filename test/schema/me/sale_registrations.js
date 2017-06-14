import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("SaleRegistrations", () => {
    const gravity = sinon.stub()
    const Me = schema.__get__("Me")
    const SaleRegistrations = Me.__get__("SaleRegistrations")

    beforeEach(() => {
      gravity.with = sinon.stub().returns(gravity)
      SaleRegistrations.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      SaleRegistrations.__ResetDependency__("gravity")
    })

    it("returns the sales along with the registration status", () => {
      const query = `
        {
          me {
            sale_registrations {
              is_registered
              sale {
                name
              }
            }
          }
        }
      `

      gravity
        // Sale fetch
        .onCall(0)
        .returns(Promise.resolve([{ name: "Foo Sale" }, { name: "Bar Sale" }]))
        // Registration fetches
        .onCall(1)
        .returns(Promise.resolve([]))
        .onCall(2)
        .returns(Promise.resolve([{ id: "bidder-id" }]))

      return runAuthenticatedQuery(query).then(({ me: { sale_registrations } }) => {
        expect(sale_registrations).toEqual([
          { is_registered: false, sale: { name: "Foo Sale" } },
          { is_registered: true, sale: { name: "Bar Sale" } },
        ])
      })
    })
  })
})
