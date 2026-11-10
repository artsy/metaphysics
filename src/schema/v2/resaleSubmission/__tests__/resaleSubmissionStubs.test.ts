import { buildResaleSubmission } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  REJECTED_ARTWORK_ID,
  stubLoaders,
} from "./fixtures"

describe("resale submission stubs", () => {
  it("builds an accepted marketplace submission with a recommended range", () => {
    expect(buildResaleSubmission(MARKETPLACE_ARTWORK_ID, "user-42")).toEqual(
      expect.objectContaining({
        id: `stub-${MARKETPLACE_ARTWORK_ID}`,
        user_id: "user-42",
        submitted_artwork_id: MARKETPLACE_ARTWORK_ID,
        state: "accepted",
        channel: "marketplace",
        rejection_reasons: [],
        recommended_price_min_minor: 280000,
        recommended_price_max_minor: 360000,
        missing_requirements: [
          "price_listed_minor",
          "packaging",
          "packer",
          "courier_handoff",
        ],
        ready_to_list: false,
      })
    )
  })

  it("builds an accepted auction submission with nothing missing and no range", () => {
    expect(buildResaleSubmission(AUCTION_ARTWORK_ID, "user-42")).toEqual(
      expect.objectContaining({
        state: "accepted",
        channel: "auction",
        recommended_price_min_minor: null,
        recommended_price_max_minor: null,
        missing_requirements: [],
        ready_to_list: false,
      })
    )
  })

  it("builds a rejected submission outside the US", () => {
    expect(buildResaleSubmission(REJECTED_ARTWORK_ID, "user-42")).toEqual(
      expect.objectContaining({
        state: "rejected",
        channel: null,
        rejection_reasons: ["outside_us"],
        missing_requirements: [],
        ready_to_list: false,
      })
    )
  })

  it("counts a price of 0 as set", async () => {
    const { updateResaleSubmissionLoader } = stubLoaders()

    const submission = await updateResaleSubmissionLoader(
      `stub-${MARKETPLACE_ARTWORK_ID}`,
      { price_listed_minor: 0 }
    )

    expect(submission.missing_requirements).toEqual([
      "packaging",
      "packer",
      "courier_handoff",
    ])
  })

  it("rejects an ID it did not make", async () => {
    const { resaleSubmissionLoader } = stubLoaders()

    await expect(resaleSubmissionLoader("some-real-id")).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})
