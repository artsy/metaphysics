/* eslint-disable promise/always-return */
import jwt from "jwt-simple"
import { omit } from "lodash"
import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"
import config from "config"

const { HMAC_SECRET } = config

describe("CausalityJWT", () => {
  let context

  const sale = {
    _id: "foo",
    name: "Foo sale",
    id: "slug",
    partner: { _id: "fooPartner" },
  }

  beforeEach(() => {
    const me = {
      _id: "craig",
      paddle_number: "123",
      type: "User",
    }

    const mePartners = [{ _id: "fooPartner" }]

    context = {
      saleLoader: sinon.stub().returns(Promise.resolve(sale)),
      meLoader: sinon.stub().returns(Promise.resolve(me)),
      mePartnersLoader: sinon.stub().returns(Promise.resolve(mePartners)),
      accessToken: "token",
      meBiddersLoader: sinon.stub().returns(
        Promise.resolve([
          {
            id: "bidder1",
            sale: { _id: "foo", id: "slug" },
            qualified_for_bidding: true,
          },
        ])
      ),
    }
  })

  it("encodes a bidder JWT for logged in registered users", () => {
    const query = `{
      system {
        causalityJWT(role: PARTICIPANT, saleID: "foo")
      }
    }`
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(
        omit(jwt.decode(data.system.causalityJWT, HMAC_SECRET), "iat")
      ).toEqual({
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
      system {
        causalityJWT(role: PARTICIPANT, saleID: "slug")
      }
    }`
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(
        omit(jwt.decode(data.system.causalityJWT, HMAC_SECRET), "iat")
      ).toEqual({
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
      system {
        causalityJWT(role: PARTICIPANT, saleID: "slug")
      }
    }`
    return runQuery(query, { saleLoader: context.saleLoader }).then((data) => {
      expect(
        omit(jwt.decode(data.system.causalityJWT, HMAC_SECRET), "iat")
      ).toEqual({
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
      system {
        causalityJWT(role: PARTICIPANT, saleID: "bar")
      }
    }`
    context.meBiddersLoader = sinon.stub().returns(Promise.resolve([]))
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(
        omit(jwt.decode(data.system.causalityJWT, HMAC_SECRET), "iat")
      ).toEqual({
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
      system {
        causalityJWT(role: PARTICIPANT, saleID: "foo")
      }
    }`
    context.meBiddersLoader = sinon.stub().returns(
      Promise.resolve([
        {
          id: "bidder1",
          sale: { _id: "foo", id: "slug" },
          qualified_for_bidding: false,
        },
      ])
    )
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(
        omit(jwt.decode(data.system.causalityJWT, HMAC_SECRET), "iat")
      ).toEqual({
        aud: "auctions",
        role: "observer",
        userId: "craig",
        saleId: "foo",
        bidderId: null,
      })
    })
  })

  it("does not allow a non-admin user to be operator", () => {
    expect.assertions(1)

    const query = `{
      system {
        causalityJWT(role: OPERATOR, saleID: "foo")
      }
    }`
    context.saleLoader = sinon.stub().returns(
      Promise.resolve({
        ...sale,
        partner: undefined, // in production partner is undefined when user is not an admin or a partner
      })
    )

    return runAuthenticatedQuery(query, context).catch((e) => {
      expect(e.message).toEqual("Unauthorized to be operator")
    })
  })

  it("does not allow a user not associated with sale partner to be operator", () => {
    expect.assertions(1)

    const query = `{
      system {
        causalityJWT(role: OPERATOR, saleID: "foo")
      }
    }`

    context.saleLoader = sinon.stub().returns(
      Promise.resolve({
        ...sale,
        partner: {
          _id: "partner-id",
        },
      })
    )
    context.mePartnersLoader = sinon.stub().returns(Promise.resolve([]))

    return runAuthenticatedQuery(query, context).catch((e) => {
      expect(e.message).toEqual("Unauthorized to be operator")
    })
  })

  it("allows a user associated with the sale partner to be an external operator for that sale", () => {
    const query = `{
      system {
        causalityJWT(role: OPERATOR, saleID: "foo")
      }
    }`
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(
        omit(jwt.decode(data.system.causalityJWT, HMAC_SECRET), "iat")
      ).toEqual({
        aud: "auctions",
        role: "externalOperator",
        userId: "craig",
        saleId: "foo",
        bidderId: "123",
      })
    })
  })
})
