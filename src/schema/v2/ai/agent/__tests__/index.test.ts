import { GraphQLResolveInfo, GraphQLSchema } from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"

const mockIsFeatureFlagEnabled = jest.fn().mockReturnValue(true)
jest.mock("lib/featureFlags", () => ({
  ...jest.requireActual("lib/featureFlags"),
  isFeatureFlagEnabled: (...args: any[]) => mockIsFeatureFlagEnabled(...args),
}))

const mockRunTurn = jest.fn()
jest.mock("../runTurn", () => ({
  runTurn: (...args: any[]) => mockRunTurn(...args),
}))

import { AIAgentTurn } from "../index"

// `subscribe`/`resolve` are tested directly as plain functions rather than
// through a full schema execution — graphql-js's `execute()` (which
// `runQuery`/`graphql()` use) never calls a field's `subscribe`, only
// `resolve`; only the dedicated `subscribe()` entry point does. Testing the
// field config directly exercises the real guard logic without needing to
// stand up graphql-js's SSE-oriented subscribe() machinery in a unit test.
function callSubscribe(
  input: any,
  context: Partial<ResolverContext>,
  schema: GraphQLSchema = ({} as unknown) as GraphQLSchema
) {
  const info = ({ schema } as unknown) as GraphQLResolveInfo
  return (AIAgentTurn.subscribe as any)(
    undefined,
    { input },
    context,
    info
  )
}

describe("AIAgentTurn", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsFeatureFlagEnabled.mockReturnValue(true)
    mockRunTurn.mockReturnValue(
      (async function* () {
        yield { __typename: "AIAgentTurnComplete" }
      })()
    )
  })

  it("rejects when unauthenticated (no userID)", () => {
    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi" },
        { userID: undefined, accessToken: "token" }
      )
    ).toThrow("You need to be signed in to perform this action")
  })

  it("rejects when there's no access token", () => {
    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi" },
        { userID: "user-42", accessToken: undefined }
      )
    ).toThrow("You need to be signed in to perform this action")
  })

  it("rejects when the feature flag is disabled", () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)

    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi" },
        { userID: "user-42", accessToken: "token" }
      )
    ).toThrow("This feature is not currently enabled")

    expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
      "onyx_ai_agent-turn",
      { userId: "user-42" }
    )
  })

  it("skips the feature flag check in development, since there's no local Unleash override", () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)
    const originalNodeEnv = config.NODE_ENV
    config.NODE_ENV = "development"

    try {
      expect(() =>
        callSubscribe(
          { conversationID: "c1", message: "hi" },
          { userID: "user-42", accessToken: "token" }
        )
      ).not.toThrow()
      expect(mockIsFeatureFlagEnabled).not.toHaveBeenCalled()
    } finally {
      config.NODE_ENV = originalNodeEnv
    }
  })

  it("rejects a history longer than the message cap", () => {
    const history = Array.from({ length: 41 }, () => ({
      role: "user",
      content: "hi",
    }))

    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi", history },
        { userID: "user-42", accessToken: "token" }
      )
    ).toThrow(/too long/)
  })

  it("rejects an oversized history", () => {
    const history = [{ role: "user", content: "x".repeat(200_000) }]

    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi", history },
        { userID: "user-42", accessToken: "token" }
      )
    ).toThrow(/too large/)
  })

  it("calls runTurn with the input and info.schema when all guards pass", () => {
    const schema = ({ marker: "the-schema" } as unknown) as GraphQLSchema
    const context = { userID: "user-42", accessToken: "token" }
    const input = { conversationID: "c1", message: "hi" }

    callSubscribe(input, context, schema)

    expect(mockRunTurn).toHaveBeenCalledWith(input, schema, context)
  })

  it("resolve is the identity function", () => {
    const payload = { __typename: "AIAgentTextDelta", text: "hi" }
    expect((AIAgentTurn.resolve as any)(payload)).toBe(payload)
  })
})
