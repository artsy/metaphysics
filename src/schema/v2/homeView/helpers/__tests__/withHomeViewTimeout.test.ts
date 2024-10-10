import { withTimeout } from "lib/loaders/helpers"
import { withHomeViewTimeout } from "../withHomeViewTimeout"
import { ResolverContext } from "types/graphql"
import { GraphQLResolveInfo } from "graphql"
import config from "config"

jest.mock("lib/loaders/helpers", () => ({
  withTimeout: jest.fn(() => Promise.resolve()),
}))

const mockWithTimeout = withTimeout as jest.Mock

const fakeResolverArgs: [any, any, ResolverContext, GraphQLResolveInfo] = [
  {},
  {},
  {} as ResolverContext,
  {} as GraphQLResolveInfo,
]

describe("withHomeViewTimeout", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when no timeout is provided", () => {
    it("defaults to an env var value from the config", async () => {
      const aSlowResolver = jest.fn()
      const aResolverWithTimeout = withHomeViewTimeout(aSlowResolver)

      await aResolverWithTimeout(...fakeResolverArgs)

      expect(mockWithTimeout.mock.calls[0][1]).toBe(
        config.HOME_VIEW_RESOLVER_TIMEOUT_MS
      )
    })
  })

  describe("when timeout is provided", () => {
    it("defaults to the provided value", async () => {
      const aSlowResolver = jest.fn()
      const aResolverWithTimeout = withHomeViewTimeout(aSlowResolver, 4242)

      await aResolverWithTimeout(...fakeResolverArgs)

      expect(mockWithTimeout.mock.calls[0][1]).toBe(4242)
    })
  })

  describe("when timeout is `undefined`", () => {
    it("defaults to an env var value from the config", async () => {
      const aSlowResolver = jest.fn()
      const aResolverWithTimeout = withHomeViewTimeout(aSlowResolver, undefined)

      await aResolverWithTimeout(...fakeResolverArgs)

      expect(mockWithTimeout.mock.calls[0][1]).toBe(
        config.HOME_VIEW_RESOLVER_TIMEOUT_MS
      )
    })
  })
})
