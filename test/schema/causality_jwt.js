import gravity from "lib/loaders/legacy/gravity"
jest.mock("lib/loaders/legacy/gravity")

import jwt from "jwt-simple"
import { omit } from "lodash"

import { runQuery, runAuthenticatedQuery } from "test/utils"

const { HMAC_SECRET } = process.env

describe("CausalityJWT", () => {
  beforeEach(() => {
    gravity.mockImplementationOnce(() => Promise.resolve({ _id: "foo", name: "Foo sale", id: "slug" }))
    gravity.with.mockImplementationOnce(() => () =>
      Promise.resolve({
        _id: "craig",
        paddle_number: "123",
        type: "User",
      })
    )

    gravity.with.mockImplementationOnce(() => () =>
      Promise.resolve([
        {
          id: "bidder1",
          sale: { _id: "foo", id: "slug" },
          qualified_for_bidding: true,
        },
      ])
    )
  })

  it("encodes a bidder JWT for logged in registered users", () => {
    const query = `{
      causality_jwt(role: PARTICIPANT, sale_id: "foo")
    }`
    return runAuthenticatedQuery(query).then(data => {
      expect(omit(jwt.decode(data.causality_jwt, HMAC_SECRET), "iat")).toEqual({
        aud: "auctions",
        role: "bidder",
        userId: "craig",
        saleId: "foo",
        bidderId: "bidder1",
      })
    })
  })

  it("works with a sale slug", () => {
    const query = `{
      causality_jwt(role: PARTICIPANT, sale_id: "slug")
    }`
    return runAuthenticatedQuery(query).then(data => {
      expect(omit(jwt.decode(data.causality_jwt, HMAC_SECRET), "iat")).toEqual({
        aud: "auctions",
        role: "bidder",
        userId: "craig",
        saleId: "foo",
        bidderId: "bidder1",
      })
    })
  })

  it("allows an anonymous user to be an observer", () => {
    const query = `{
      causality_jwt(role: PARTICIPANT, sale_id: "slug")
    }`
    gravity.onCall(0).returns(Promise.resolve({ _id: "foo" }))
    return runQuery(query).then(data => {
      expect(omit(jwt.decode(data.causality_jwt, HMAC_SECRET), "iat")).toEqual({
        aud: "auctions",
        role: "observer",
        userId: null,
        saleId: "foo",
        bidderId: null,
      })
    })
  })

  it("falls back to observer if not registered to the sale", () => {
    const query = `{
      causality_jwt(role: PARTICIPANT, sale_id: "bar")
    }`
    gravity.onCall(2).returns(Promise.resolve([]))
    return runAuthenticatedQuery(query).then(data => {
      expect(omit(jwt.decode(data.causality_jwt, HMAC_SECRET), "iat")).toEqual({
        aud: "auctions",
        role: "observer",
        userId: "craig",
        saleId: "foo",
        bidderId: null,
      })
    })
  })

  it("falls back to observer if disqualified for bidding", () => {
    const query = `{
      causality_jwt(role: PARTICIPANT, sale_id: "foo")
    }`
    gravity.onCall(2).returns(
      Promise.resolve([
        {
          id: "bidder1",
          sale: { _id: "foo", id: "slug" },
          qualified_for_bidding: false,
        },
      ])
    )
    return runAuthenticatedQuery(query).then(data => {
      expect(omit(jwt.decode(data.causality_jwt, HMAC_SECRET), "iat")).toEqual({
        aud: "auctions",
        role: "observer",
        userId: "craig",
        saleId: "foo",
        bidderId: null,
      })
    })
  })

  it("denies a non-admin operator", () => {
    const query = `{
      causality_jwt(role: OPERATOR, sale_id: "foo")
    }`

    return runAuthenticatedQuery(query).catch(e => {
      expect(e.message).toEqual("Unauthorized to be operator")
    })
  })
})
