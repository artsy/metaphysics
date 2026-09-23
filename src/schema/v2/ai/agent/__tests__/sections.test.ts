import { ExecutionResult, parse, subscribe, validate } from "graphql"
import gql from "lib/gql"

// Unlike index.test.ts, which calls the field config's `subscribe` directly,
// this runs the real v2 schema: graphql-js resolving the union against the
// payloads `runTurn` yields, and ArtworkType resolving its fields off raw
// Gravity hashes. The only place the wire shape a client selects is checked.
const mockRunTurn = jest.fn()
jest.mock("../runTurn", () => ({
  runTurn: (...args: any[]) => mockRunTurn(...args),
}))

jest.mock("lib/featureFlags", () => ({
  ...jest.requireActual("lib/featureFlags"),
  isFeatureFlagEnabled: () => true,
}))

const TURN = gql`
  subscription {
    aiAgentTurn(
      input: { conversationID: "c1", message: "Show me Warhol works" }
    ) {
      __typename
      ... on AIAgentTurnComplete {
        message
        stopReason
        toolCallCount
        artworks {
          internalID
          title
        }
        sections {
          __typename
          ... on AIAgentArtworksSection {
            artworks {
              internalID
              title
            }
          }
        }
      }
    }
  }
`

const ARTWORK_ID = "5f5a5b5c5d5e5f6061626364"

// A turn replaying one assistant answer's cards in the new input format.
const turnReplaying = (section: string) => gql`
  subscription {
    aiAgentTurn(
      input: {
        conversationID: "c1"
        message: "Tell me more about the second one"
        history: [
          {
            role: ASSISTANT
            content: "Here are a few."
            displayedSections: [${section}]
          }
        ]
      }
    ) {
      __typename
    }
  }
`

function v2Schema() {
  // Required lazily, matching schema/v2/test/utils -- the schema must not be
  // imported before the mocks above are installed.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("schema/v2").schema
}

async function collectTurn(payloads: any[], document = TURN) {
  mockRunTurn.mockReturnValue(
    (async function* () {
      for (const payload of payloads) yield payload
    })()
  )

  const result = await subscribe({
    schema: v2Schema(),
    document: parse(document),
    contextValue: { userID: "user-42", accessToken: "token" },
  })

  if (!(Symbol.asyncIterator in result)) {
    throw (result as ExecutionResult).errors?.[0] ?? new Error("No stream")
  }

  const events: any[] = []
  for await (const value of result as AsyncIterable<ExecutionResult>) {
    if (value.errors) throw value.errors[0]
    events.push((value.data as any).aiAgentTurn)
  }
  return events
}

describe("aiAgentTurn sections", () => {
  beforeEach(() => jest.clearAllMocks())

  it("resolves an artworks section, and the same works in legacy `artworks`", async () => {
    const artworks = [{ _id: ARTWORK_ID, id: "slug-a", title: "Flowers" }]
    const [complete] = await collectTurn([
      {
        __typename: "AIAgentTurnComplete",
        message: "Here you go.",
        artworks,
        sections: [{ __typename: "AIAgentArtworksSection", artworks }],
        stopReason: "stop",
        toolCallCount: 1,
      },
    ])

    expect(complete.sections).toEqual([
      {
        __typename: "AIAgentArtworksSection",
        artworks: [{ internalID: ARTWORK_ID, title: "Flowers" }],
      },
    ])
    // The legacy field a pre-`sections` client selects shows the same works.
    expect(complete.artworks).toEqual([
      { internalID: ARTWORK_ID, title: "Flowers" },
    ])
  })

  it("resolves an empty section list for a text-only answer", async () => {
    const [complete] = await collectTurn([
      {
        __typename: "AIAgentTurnComplete",
        message: "We don't track that.",
        artworks: [],
        sections: [],
        stopReason: "stop",
        toolCallCount: 0,
      },
    ])

    expect(complete.sections).toEqual([])
    expect(complete.artworks).toEqual([])
  })

  it("resolves an empty section list for a turn that failed outright", async () => {
    const [complete] = await collectTurn([
      {
        __typename: "AIAgentTurnComplete",
        message: null,
        artworks: null,
        sections: [],
        stopReason: "error",
        toolCallCount: 0,
      },
    ])

    expect(complete).toEqual({
      __typename: "AIAgentTurnComplete",
      message: null,
      stopReason: "error",
      toolCallCount: 0,
      artworks: null,
      sections: [],
    })
  })

  it("accepts a replayed section and hands it to the turn as typed history", async () => {
    await collectTurn(
      [
        {
          __typename: "AIAgentTurnComplete",
          message: "Sure.",
          artworks: null,
          sections: [],
          stopReason: "stop",
          toolCallCount: 0,
        },
      ],
      turnReplaying(`{ entityType: ARTWORK, internalIDs: ["${ARTWORK_ID}"] }`)
    )

    expect(mockRunTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        history: [
          {
            role: "assistant",
            content: "Here are a few.",
            displayedSections: [
              { entityType: "ARTWORK", internalIDs: [ARTWORK_ID] },
            ],
          },
        ],
      }),
      expect.anything(),
      expect.anything()
    )
  })

  it("passes declared section types through to the turn", async () => {
    await collectTurn(
      [
        {
          __typename: "AIAgentTurnComplete",
          message: "Sure.",
          artworks: null,
          sections: [],
          stopReason: "stop",
          toolCallCount: 0,
        },
      ],
      gql`
        subscription {
          aiAgentTurn(
            input: {
              conversationID: "c1"
              message: "Show me artists like Warhol"
              supportedSections: [ARTWORKS]
            }
          ) {
            __typename
          }
        }
      `
    )

    expect(mockRunTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        supportedSections: ["ARTWORKS"],
      }),
      expect.anything(),
      expect.anything()
    )
  })

  it("rejects an unknown section type at the schema boundary", () => {
    // The enum keeps a capability this server never heard of off the input.
    const errors = validate(
      v2Schema(),
      parse(gql`
        subscription {
          aiAgentTurn(
            input: {
              conversationID: "c1"
              message: "hi"
              supportedSections: [VIEWING_ROOMS]
            }
          ) {
            __typename
          }
        }
      `)
    )

    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/VIEWING_ROOMS/)
  })

  it("rejects an unknown entity type at the schema boundary", () => {
    // The enum is the input guard: an unknown entity type never reaches the
    // resolver as a string to be defended against.
    const errors = validate(
      v2Schema(),
      parse(turnReplaying(`{ entityType: SCULPTURE, internalIDs: ["x"] }`))
    )

    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/SCULPTURE/)
  })

  it("leaves the other event types alone", async () => {
    const events = await collectTurn([
      { __typename: "AIAgentTextDelta", text: "Here" },
      {
        __typename: "AIAgentTurnComplete",
        message: "Here",
        artworks: [],
        sections: [],
        stopReason: "stop",
        toolCallCount: 0,
      },
    ])

    expect(events.map((event) => event.__typename)).toEqual([
      "AIAgentTextDelta",
      "AIAgentTurnComplete",
    ])
  })
})
