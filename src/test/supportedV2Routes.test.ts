import { supportedV2RouteHandler } from "index"

describe("supportedV2RouteHandler", () => {
  describe("not allowing GraphQL requests", () => {
    it("calls next for a POST not on the root of /v2", () => {
      const req = { method: "POST", url: "/foo" }
      const next = jest.fn()
      supportedV2RouteHandler(req, null, next)
      expect(next).toHaveBeenCalled()
    })

    it("calls next for a GET not on the root of /v2", () => {
      const req = { method: "GET", url: "/foo" }
      const next = jest.fn()
      supportedV2RouteHandler(req, null, next)
      expect(next).toHaveBeenCalled()
    })

    it("calls next for a GET on the root of /v2 with unknown query params", () => {
      const req = { method: "GET", url: "/?", query: { unknown: true } }
      const next = jest.fn()
      supportedV2RouteHandler(req, null, next)
      expect(next).toHaveBeenCalled()
    })

    it("calls next for a PUT", () => {
      const req = { method: "PUT", url: "/" }
      const next = jest.fn()
      supportedV2RouteHandler(req, null, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe("allowing GraphQL requests", () => {
    it("allows a GraphQL request to a POST on the root of /v2", () => {
      const req = { method: "POST", url: "/" }
      const next = jest.fn()
      supportedV2RouteHandler(req, null, next)
      expect(next).not.toHaveBeenCalled()
    })

    it("allows a GraphQL request to a GET on the root of /v2 w/o query params", () => {
      const req = { method: "GET", url: "/" }
      const next = jest.fn()
      supportedV2RouteHandler(req, null, next)
      expect(next).not.toHaveBeenCalled()
    })

    it("allows a GraphQL request to a GET on the root of /v2 with proper query params", () => {
      const req = { method: "GET", url: "/?", query: { query: true } }
      const next = jest.fn()
      supportedV2RouteHandler(req, null, next)
      expect(next).not.toHaveBeenCalled()
    })
  })
})
