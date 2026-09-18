import * as Sentry from "@sentry/node"
import { ResolverContext } from "types/graphql"
import {
  DEFAULT_SUPPORTED_SECTIONS,
  MAX_SECTION_IDS,
  hydrateSection,
  normalizeCitedIDs,
  orderByCitedIDs,
  resolveSupportedSections,
} from "../responseSections"

// Real Gravity internalIDs are 24-char hex; that shape is what routes a cited
// id to a batch endpoint rather than being dropped.
const ID_A = "5f5a5b5c5d5e5f6061626364"
const ID_B = "6a6b6c6d6e6f707172737475"
const ID_C = "7b7c7d7e7f80818283848586"

function fakeContext(
  overrides: { artworksLoader?: jest.Mock } = {}
): ResolverContext {
  return ({
    artworksLoader: overrides.artworksLoader ?? jest.fn().mockResolvedValue([]),
  } as unknown) as ResolverContext
}

describe("normalizeCitedIDs", () => {
  it("keeps internalIDs in the order they were cited", () => {
    expect(normalizeCitedIDs([ID_C, ID_A]).valid).toEqual([ID_C, ID_A])
  })

  it("separates out citations no batch endpoint could match", () => {
    const { valid, dropped } = normalizeCitedIDs([
      "andy-warhol-flowers",
      ID_A,
      "Happy Birthday",
    ])

    expect(valid).toEqual([ID_A])
    expect(dropped).toEqual(["andy-warhol-flowers", "Happy Birthday"])
  })

  it("collapses a repeated citation to its first position", () => {
    expect(normalizeCitedIDs([ID_B, ID_A, ID_B]).valid).toEqual([ID_B, ID_A])
  })

  it("caps before validating, so a long list can't buy more work", () => {
    const many = Array.from({ length: MAX_SECTION_IDS + 5 }, (_, index) =>
      index.toString(16).padStart(24, "0")
    )
    const { requested, valid } = normalizeCitedIDs(many)

    expect(requested).toBe(MAX_SECTION_IDS)
    expect(valid).toHaveLength(MAX_SECTION_IDS)
    expect(valid).not.toContain(many[MAX_SECTION_IDS])
  })
})

describe("orderByCitedIDs", () => {
  it("re-joins on `_id`, ignoring the order the records arrived in", () => {
    const ordered = orderByCitedIDs(
      [{ _id: ID_A }, { _id: ID_B }, { _id: ID_C }],
      [ID_C, ID_A, ID_B]
    )

    expect(ordered.map(({ _id }) => _id)).toEqual([ID_C, ID_A, ID_B])
  })

  it("leaves no hole for an id the endpoint dropped", () => {
    const ordered = orderByCitedIDs([{ _id: ID_A }], [ID_A, ID_C])

    expect(ordered).toEqual([{ _id: ID_A }])
    expect(ordered).not.toContain(undefined)
  })
})

describe("resolveSupportedSections", () => {
  it("offers artworks only when the client says nothing", () => {
    // A client that predates `sections` reads legacy `artworks`.
    expect(resolveSupportedSections(undefined)).toEqual(["ARTWORKS"])
    expect(resolveSupportedSections(null)).toEqual(DEFAULT_SUPPORTED_SECTIONS)
  })

  it("collapses repeats", () => {
    expect(resolveSupportedSections(["ARTWORKS", "ARTWORKS"])).toEqual([
      "ARTWORKS",
    ])
  })

  it("takes an explicit empty list at face value", () => {
    // A coherent request, not a sync problem: it gets a text-only turn.
    expect(resolveSupportedSections([])).toEqual([])
  })
})

describe("hydrateSection", () => {
  beforeEach(() => jest.clearAllMocks())

  describe("artworks", () => {
    it("loads the whole page in one call and returns an artworks section", async () => {
      const artworksLoader = jest
        .fn()
        .mockResolvedValue([{ _id: ID_B }, { _id: ID_A }])

      const section = await hydrateSection(
        { type: "ARTWORKS", internalIDs: [ID_A, ID_B] },
        fakeContext({ artworksLoader })
      )

      expect(artworksLoader).toHaveBeenCalledTimes(1)
      expect(artworksLoader).toHaveBeenCalledWith({
        ids: [ID_A, ID_B],
        size: 2,
      })
      expect(section).toEqual({
        __typename: "AIAgentArtworksSection",
        artworks: [{ _id: ID_A }, { _id: ID_B }],
      })
    })

    it("never asks for a citation that isn't an internalID", async () => {
      const artworksLoader = jest.fn().mockResolvedValue([{ _id: ID_A }])

      await hydrateSection(
        { type: "ARTWORKS", internalIDs: ["andy-warhol-flowers", ID_A] },
        fakeContext({ artworksLoader })
      )

      expect(artworksLoader).toHaveBeenCalledWith({ ids: [ID_A], size: 1 })
    })
  })

  it("asks for as many records as it cited, since fetching by id still paginates", async () => {
    // Gravity's default page is 10, so a batch of 20 comes back halved unless
    // `size` says otherwise.
    const many = Array.from({ length: 20 }, (_, index) =>
      index.toString(16).padStart(24, "0")
    )
    const artworksLoader = jest.fn().mockResolvedValue([])

    await hydrateSection(
      { type: "ARTWORKS", internalIDs: many },
      fakeContext({ artworksLoader })
    )

    expect(artworksLoader).toHaveBeenCalledWith({ ids: many, size: 20 })
  })

  it("has no section to show when nothing was cited in a usable form", async () => {
    const artworksLoader = jest.fn()

    const section = await hydrateSection(
      { type: "ARTWORKS", internalIDs: ["andy-warhol", ""] },
      fakeContext({ artworksLoader })
    )

    // Nothing worth asking Gravity about, so it isn't asked.
    expect(artworksLoader).not.toHaveBeenCalled()
    expect(section).toBeNull()
  })

  it("has no section to show when every cited id resolves to nothing", async () => {
    // An empty section would render as a rail with a header and no cards.
    const section = await hydrateSection(
      { type: "ARTWORKS", internalIDs: [ID_A] },
      fakeContext({ artworksLoader: jest.fn().mockResolvedValue([]) })
    )

    expect(section).toBeNull()
  })

  it("reports a loader failure with counts, not ids, and gives up the section only", async () => {
    const captureException = jest
      .spyOn(Sentry, "captureException")
      .mockImplementation(() => "test-event-id")
    const error = new Error("Gravity is down")

    const section = await hydrateSection(
      { type: "ARTWORKS", internalIDs: [ID_A, ID_B] },
      fakeContext({ artworksLoader: jest.fn().mockRejectedValue(error) })
    )

    expect(section).toBeNull()
    expect(captureException).toHaveBeenCalledWith(error, {
      tags: { ai_agent_section: "ARTWORKS" },
      contexts: {
        aiAgentSection: { sectionType: "ARTWORKS", requestedIDs: 2 },
      },
    })
    // The ids themselves are the collector's context, not diagnostics.
    expect(JSON.stringify(captureException.mock.calls)).not.toContain(ID_A)

    captureException.mockRestore()
  })
})
