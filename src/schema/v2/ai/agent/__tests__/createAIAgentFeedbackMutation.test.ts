import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

const mockAnnotateTrace = jest.fn()
jest.mock("lib/apis/phoenix", () => ({
  ...jest.requireActual("lib/apis/phoenix"),
  annotateTrace: (...args: unknown[]) => mockAnnotateTrace(...args),
}))

const mockIsFeatureFlagEnabled = jest.fn()
jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: (...args: unknown[]) =>
    mockIsFeatureFlagEnabled(...args),
}))

const FEEDBACK_ID = "0af7651916cd43dd8448eb211c80319c" as const

const signedIn = { accessToken: "secret", userID: "user-42" }

const mutation = gql`
  mutation($input: CreateAIAgentFeedbackInput!) {
    createAIAgentFeedback(input: $input) {
      success
    }
  }
`

describe("createAIAgentFeedback", () => {
  beforeEach(() => {
    mockAnnotateTrace.mockReset()
    mockAnnotateTrace.mockResolvedValue(true)
    mockIsFeatureFlagEnabled.mockReset()
    mockIsFeatureFlagEnabled.mockReturnValue(true)
  })

  it("is gated by the same flag as the agent turn", async () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)

    await expect(
      runQuery(mutation, signedIn, {
        input: { feedbackID: FEEDBACK_ID, rating: "THUMBS_UP" },
      })
    ).rejects.toThrow("This feature is not currently enabled")
    expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
      "onyx_ai_agent-turn",
      { userId: "user-42" }
    )
    expect(mockAnnotateTrace).not.toHaveBeenCalled()
  })

  it("records the signed-in user's rating", async () => {
    const data = await runQuery(mutation, signedIn, {
      input: {
        feedbackID: FEEDBACK_ID,
        rating: "THUMBS_DOWN",
        comment: "  Wrong artist  ",
      },
    })

    expect(data).toEqual({ createAIAgentFeedback: { success: true } })
    expect(mockAnnotateTrace).toHaveBeenCalledWith({
      traceID: FEEDBACK_ID,
      name: "user_feedback",
      identifier: "user-42",
      label: "thumbs_down",
      score: 0,
      explanation: "Wrong artist",
      metadata: { userID: "user-42" },
    })
  })

  it("records a thumbs up as a score of 1", async () => {
    await runQuery(mutation, signedIn, {
      input: { feedbackID: FEEDBACK_ID, rating: "THUMBS_UP" },
    })

    expect(mockAnnotateTrace).toHaveBeenCalledWith(
      expect.objectContaining({ label: "thumbs_up", score: 1 })
    )
  })

  it("reports a failure to record without erroring", async () => {
    mockAnnotateTrace.mockResolvedValue(false)

    const data = await runQuery(mutation, signedIn, {
      input: { feedbackID: FEEDBACK_ID, rating: "THUMBS_UP" },
    })

    expect(data).toEqual({ createAIAgentFeedback: { success: false } })
  })

  it("requires a signed-in user", async () => {
    await expect(
      runQuery(mutation, undefined, {
        input: { feedbackID: FEEDBACK_ID, rating: "THUMBS_UP" },
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
    expect(mockAnnotateTrace).not.toHaveBeenCalled()
  })

  it("rejects an overlong comment", async () => {
    await expect(
      runQuery(mutation, signedIn, {
        input: {
          feedbackID: FEEDBACK_ID,
          rating: "THUMBS_DOWN",
          comment: "x".repeat(2001),
        },
      })
    ).rejects.toThrow("Comment is too long")
    expect(mockAnnotateTrace).not.toHaveBeenCalled()
  })
})
