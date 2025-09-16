import { rateLimitInterfaceKey } from "../rateLimitKey"
import { Request } from "express"

describe("rateLimitInterfaceKey", () => {
  const buildRequest = (body: Record<string, any>): Request => {
    return ({ body } as any) as Request
  }

  it("returns operation + root field for a simple query", () => {
    const req = buildRequest({ query: '{ artist(id: "banksy") { name } }' })
    expect(rateLimitInterfaceKey(req)).toBe("query.artist")
  })

  it("returns operation + root field for a mutation", () => {
    const req = buildRequest({
      query: 'mutation { followArtist(id: "banksy") { artist { id } } }',
    })
    expect(rateLimitInterfaceKey(req)).toBe("mutation.followArtist")
  })

  it("handles multiple root fields and sorts them alphabetically", () => {
    const req = buildRequest({
      query: '{ me { id } artist(id: "cat") { id } }',
    })
    expect(rateLimitInterfaceKey(req)).toBe("query.artist,query.me")
  })

  it("falls back to documentID when there is no query string", () => {
    const req = buildRequest({ documentID: "abc123" })
    expect(rateLimitInterfaceKey(req)).toBe("persisted.abc123")
  })

  it("returns 'unknown' when neither query nor documentID is present", () => {
    const req = buildRequest({})
    expect(rateLimitInterfaceKey(req)).toBe("unknown")
  })
})
