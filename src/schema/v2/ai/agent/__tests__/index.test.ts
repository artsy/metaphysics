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
  return (AIAgentTurn.subscribe as any)(undefined, { input }, context, info)
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

  it("ignores requested tool-call debugging where debug mode is disabled", () => {
    const originalNodeEnv = config.NODE_ENV
    config.NODE_ENV = "test"

    try {
      callSubscribe(
        {
          conversationID: "c1",
          message: "hi",
          includeDebugToolCalls: true,
        },
        { userID: "user-42", accessToken: "token" }
      )

      expect(mockRunTurn).toHaveBeenCalledWith(
        expect.objectContaining({ includeDebugToolCalls: false }),
        expect.anything(),
        expect.anything()
      )
    } finally {
      config.NODE_ENV = originalNodeEnv
    }
  })

  it("allows tool-call debugging outside development when ENABLE_AI_AGENT_DEBUG is set", () => {
    const originalNodeEnv = config.NODE_ENV
    const originalDebug = config.ENABLE_AI_AGENT_DEBUG
    config.NODE_ENV = "test"
    config.ENABLE_AI_AGENT_DEBUG = true

    try {
      callSubscribe(
        {
          conversationID: "c1",
          message: "hi",
          includeDebugToolCalls: true,
        },
        { userID: "user-42", accessToken: "token" }
      )

      expect(mockRunTurn).toHaveBeenCalledWith(
        expect.objectContaining({ includeDebugToolCalls: true }),
        expect.anything(),
        expect.anything()
      )
    } finally {
      config.NODE_ENV = originalNodeEnv
      config.ENABLE_AI_AGENT_DEBUG = originalDebug
    }
  })

  it("allows tool-call debugging in development", () => {
    const originalNodeEnv = config.NODE_ENV
    config.NODE_ENV = "development"
    const input = {
      conversationID: "c1",
      message: "hi",
      includeDebugToolCalls: true,
    }
    const context = { userID: "user-42", accessToken: "token" }

    try {
      callSubscribe(input, context)
      expect(mockRunTurn).toHaveBeenCalledWith(
        { ...input, includeSuggestedReplies: true },
        expect.anything(),
        context
      )
    } finally {
      config.NODE_ENV = originalNodeEnv
    }
  })

  describe("suggested replies", () => {
    const suggestedRepliesFlag = (enabled: boolean) =>
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) =>
        flag === "onyx_ai_agent-suggested-replies" ? enabled : true
      )

    const includeSuggestedRepliesPassedToRunTurn = () =>
      mockRunTurn.mock.calls[0][0].includeSuggestedReplies

    it("follows the feature flag for this user", () => {
      suggestedRepliesFlag(true)
      callSubscribe(
        { conversationID: "c1", message: "hi" },
        { userID: "user-42", accessToken: "token" }
      )

      expect(includeSuggestedRepliesPassedToRunTurn()).toBe(true)
      expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
        "onyx_ai_agent-suggested-replies",
        {
          userId: "user-42",
        }
      )
    })

    it("are off when the feature flag is disabled", () => {
      suggestedRepliesFlag(false)
      callSubscribe(
        { conversationID: "c1", message: "hi" },
        { userID: "user-42", accessToken: "token" }
      )

      expect(includeSuggestedRepliesPassedToRunTurn()).toBe(false)
    })

    it("are on in development regardless of the flag", () => {
      suggestedRepliesFlag(false)
      const originalNodeEnv = config.NODE_ENV
      config.NODE_ENV = "development"

      try {
        callSubscribe(
          { conversationID: "c1", message: "hi" },
          { userID: "user-42", accessToken: "token" }
        )
      } finally {
        config.NODE_ENV = originalNodeEnv
      }

      expect(includeSuggestedRepliesPassedToRunTurn()).toBe(true)
    })
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

  it("counts replayed artwork ids against the byte cap", () => {
    // They are client-supplied and reach the model like any other content, so
    // a history that is small in prose but enormous in ids must not slip past.
    const history = [
      {
        role: "assistant",
        content: "Here you go.",
        artworkIDs: Array.from({ length: 5000 }, () => "x".repeat(24)),
      },
    ]

    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi", history },
        { userID: "user-42", accessToken: "token" }
      )
    ).toThrow(/too large/)
  })

  it("counts ids replayed as displayed sections against the byte cap", () => {
    // Same reasoning as the legacy ids above: the new format reaches the model
    // the same way, so it must be weighed the same way.
    const history = [
      {
        role: "assistant",
        content: "Here you go.",
        displayedSections: [
          {
            entityType: "ARTWORK",
            internalIDs: Array.from({ length: 5000 }, () => "x".repeat(24)),
          },
        ],
      },
    ]

    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi", history },
        { userID: "user-42", accessToken: "token" }
      )
    ).toThrow(/too large/)
  })

  it("counts declared section types against the byte cap", () => {
    // The enum bounds which values are legal, not how many arrive.
    const supportedSections = Array.from({ length: 20_000 }, () => "ARTWORKS")

    expect(() =>
      callSubscribe(
        { conversationID: "c1", message: "hi", supportedSections },
        { userID: "user-42", accessToken: "token" }
      )
    ).toThrow(/too large/)
  })

  it("calls runTurn with the input and info.schema when all guards pass", () => {
    const schema = ({ marker: "the-schema" } as unknown) as GraphQLSchema
    const context = { userID: "user-42", accessToken: "token" }
    const input = { conversationID: "c1", message: "hi" }

    callSubscribe(input, context, schema)

    expect(mockRunTurn).toHaveBeenCalledWith(
      { ...input, includeDebugToolCalls: false, includeSuggestedReplies: true },
      schema,
      context
    )
  })

  describe("attached images", () => {
    const user = { userID: "user-42", accessToken: "token" }
    const image = { s3Key: "uploads/query.jpg", s3Bucket: "image-uploads" }
    let originalBuckets: string[]

    beforeEach(() => {
      originalBuckets = config.SEARCH_ARTWORK_IMAGE_BUCKETS
      config.SEARCH_ARTWORK_IMAGE_BUCKETS = ["image-uploads"]
    })

    afterEach(() => {
      config.SEARCH_ARTWORK_IMAGE_BUCKETS = originalBuckets
    })

    it("rejects an empty message with no image", () => {
      expect(() =>
        callSubscribe({ conversationID: "c1", message: "  " }, user)
      ).toThrow("A message or an image is required")
      expect(mockRunTurn).not.toHaveBeenCalled()
    })

    it("accepts an empty message when an image is attached", () => {
      callSubscribe({ conversationID: "c1", message: "", image }, user)

      expect(mockRunTurn).toHaveBeenCalledWith(
        expect.objectContaining({ message: "", image }),
        expect.anything(),
        expect.anything()
      )
    })

    it("rejects an image in a bucket image search doesn't support", () => {
      expect(() =>
        callSubscribe(
          {
            conversationID: "c1",
            message: "like this",
            image: { ...image, s3Bucket: "someone-elses-bucket" },
          },
          user
        )
      ).toThrow(
        'Images must be uploaded to a supported bucket, not "someone-elses-bucket"'
      )
      expect(mockRunTurn).not.toHaveBeenCalled()
    })

    it("rejects every image when no bucket is configured", () => {
      config.SEARCH_ARTWORK_IMAGE_BUCKETS = []

      expect(() =>
        callSubscribe({ conversationID: "c1", message: "", image }, user)
      ).toThrow(/supported bucket/)
    })

    it("rejects an image with a blank key", () => {
      expect(() =>
        callSubscribe(
          {
            conversationID: "c1",
            message: "",
            image: { ...image, s3Key: " " },
          },
          user
        )
      ).toThrow("An attached image needs an S3 key")
    })

    it("checks the bucket of images replayed on user turns", () => {
      const history = [
        {
          role: "user",
          content: "like this",
          image: { ...image, s3Bucket: "someone-elses-bucket" },
        },
        { role: "assistant", content: "Here you go." },
      ]

      expect(() =>
        callSubscribe(
          { conversationID: "c1", message: "cheaper", history },
          user
        )
      ).toThrow(/supported bucket/)
    })

    it("ignores an image replayed on an assistant turn, which never carried one", () => {
      const history = [
        {
          role: "assistant",
          content: "Here you go.",
          image: { ...image, s3Bucket: "someone-elses-bucket" },
        },
      ]

      expect(() =>
        callSubscribe(
          { conversationID: "c1", message: "cheaper", history },
          user
        )
      ).not.toThrow()
    })

    it("counts image fields against the byte cap", () => {
      const history = Array.from({ length: 20 }, () => ({
        role: "user",
        content: "",
        image: { s3Key: "k".repeat(5_000), s3Bucket: "image-uploads" },
      }))

      expect(() =>
        callSubscribe({ conversationID: "c1", message: "hi", history }, user)
      ).toThrow(/too large/)
    })

    it("gates attaching a new image on its own feature flag", () => {
      mockIsFeatureFlagEnabled.mockImplementation(
        (flag: string) => flag !== "onyx_ai_agent-image-input"
      )

      expect(() =>
        callSubscribe({ conversationID: "c1", message: "", image }, user)
      ).toThrow("Image input is not currently enabled")
      expect(
        mockIsFeatureFlagEnabled
      ).toHaveBeenCalledWith("onyx_ai_agent-image-input", { userId: "user-42" })
    })

    it("keeps replaying images already in the history when that flag is off", () => {
      mockIsFeatureFlagEnabled.mockImplementation(
        (flag: string) => flag !== "onyx_ai_agent-image-input"
      )
      const history = [
        { role: "user", content: "like this", image },
        { role: "assistant", content: "Here you go." },
      ]

      expect(() =>
        callSubscribe(
          { conversationID: "c1", message: "cheaper", history },
          user
        )
      ).not.toThrow()
    })

    it("skips the image flag in development", () => {
      mockIsFeatureFlagEnabled.mockReturnValue(false)
      const originalNodeEnv = config.NODE_ENV
      config.NODE_ENV = "development"

      try {
        expect(() =>
          callSubscribe({ conversationID: "c1", message: "", image }, user)
        ).not.toThrow()
      } finally {
        config.NODE_ENV = originalNodeEnv
      }
    })
  })

  it("resolve is the identity function", () => {
    const payload = { __typename: "AIAgentTextDelta", text: "hi" }
    expect((AIAgentTurn.resolve as any)(payload)).toBe(payload)
  })
})
