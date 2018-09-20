import { skip } from "../rateLimiter"
import { Request } from "express"

describe("rateLimiter", () => {
  describe("concerning x-forwarded-for", () => {
    it("does not skip a request if the header doesn’t exist", () => {
      const req: Partial<Request> = {
        headers: {},
        body: {},
      }
      expect(skip(req as Request)).toBeFalsy
    })

    it("does not skip a request if it originated from a single host", () => {
      const req: Partial<Request> = {
        headers: { "x-forwarded-for": "4.4.4.4" },
        body: {},
      }
      expect(skip(req as Request)).toBeFalsy
    })

    it("skips a request if it originated from at least 2 hosts, one of which presumably is a front-end service of ours", () => {
      const req: Partial<Request> = {
        headers: { "x-forwarded-for": "4.4.4.4,8.8.8.8" },
        body: {},
      }
      expect(skip(req as Request)).toBeTruthy
    })
  })

  describe("concerning query", () => {
    it("does not skip a request if there’s no query", () => {
      const req: Partial<Request> = {
        headers: {},
        body: {},
      }
      expect(skip(req as Request)).toBeFalsy
    })

    it("does not skip a request if it includes the artist page query", () => {
      const req: Partial<Request> = {
        headers: {},
        body: { query: "query routes_OverviewQueryRendererQuery {}" },
      }
      expect(skip(req as Request)).toBeFalsy
    })

    it("skips a request if it does not include the artist page query", () => {
      const req: Partial<Request> = {
        headers: {},
        body: { query: "query anotherQuery {}" },
      }
      expect(skip(req as Request)).toBeTruthy
    })
  })
})
