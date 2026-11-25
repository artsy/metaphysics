import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { warn } from "lib/loggers"
import { ResolverContext } from "types/graphql"

jest.mock("lib/loggers", () => ({
  ...jest.requireActual("lib/loggers"),
  warn: jest.fn(),
}))

const query = gql`
  query {
    me {
      resaleSubmission(id: "submission-1") {
        internalID
        state
        channel
        rejectionReasons
        submittedArtworkID
        priceListed {
          minor
          currencyCode
          display
        }
        recommendedPriceMin {
          minor
          currencyCode
        }
        recommendedPriceMax {
          minor
          currencyCode
        }
        packaging
        packer
        courierHandoff
        condition {
          value
          displayText
          description
        }
        missingRequirements
        notes
        canceledAt
        createdAt(format: "YYYY-MM-DD")
        updatedAt(format: "YYYY-MM-DD")
      }
    }
  }
`

const acceptedSubmission = {
  id: "submission-1",
  user_id: "user-42",
  submitted_artwork_id: "artwork-1",
  state: "accepted",
  channel: "marketplace",
  rejection_reasons: [],
  price_currency_code: "USD",
  price_listed_minor: 250000,
  recommended_price_min_minor: 200000,
  recommended_price_max_minor: 300000,
  packaging: "framed",
  packer: "courier",
  courier_handoff: "seller_dropoff",
  condition: "good",
  missing_requirements: [],
  notes: "Small tear on the verso",
  canceled_at: null,
  created_at: "2026-11-12T10:00:00.000Z",
  updated_at: "2026-11-12T11:00:00.000Z",
}

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meLoader: jest.fn(() => Promise.resolve({ id: "user-42" })),
    meResaleSubmissionLoader: jest.fn(() =>
      Promise.resolve(acceptedSubmission)
    ),
  }
})

describe("me.resaleSubmission", () => {
  it("passes the id to Gravity", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.meResaleSubmissionLoader as jest.Mock).toHaveBeenCalledWith(
      "submission-1"
    )
  })

  it("returns an accepted submission", async () => {
    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission).toEqual({
      internalID: "submission-1",
      state: "ACCEPTED",
      channel: "MARKETPLACE",
      rejectionReasons: [],
      submittedArtworkID: "artwork-1",
      priceListed: {
        minor: 250000,
        currencyCode: "USD",
        display: "US$2,500",
      },
      recommendedPriceMin: { minor: 200000, currencyCode: "USD" },
      recommendedPriceMax: { minor: 300000, currencyCode: "USD" },
      packaging: "FRAMED",
      packer: "COURIER",
      courierHandoff: "SELLER_DROPOFF",
      condition: { value: "GOOD", displayText: "Good", description: null },
      missingRequirements: [],
      notes: "Small tear on the verso",
      canceledAt: null,
      createdAt: "2026-11-12",
      updatedAt: "2026-11-12",
    })
  })

  it("returns null notes when the seller hasn’t given any", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({ ...acceptedSubmission, notes: null })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.notes).toBeNull()
  })

  it("returns a null condition when the seller hasn’t answered it", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        ...acceptedSubmission,
        condition: null,
      })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.condition).toBeNull()
  })

  it("returns null money fields when prices are unset", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        ...acceptedSubmission,
        price_listed_minor: null,
        recommended_price_min_minor: null,
        recommended_price_max_minor: null,
      })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.priceListed).toBeNull()
    expect(response.me.resaleSubmission.recommendedPriceMin).toBeNull()
    expect(response.me.resaleSubmission.recommendedPriceMax).toBeNull()
  })

  it("returns a rejected submission with its reasons and no channel", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        ...acceptedSubmission,
        state: "rejected",
        channel: null,
        rejection_reasons: ["medium_not_supported", "outside_us"],
      })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.state).toEqual("REJECTED")
    expect(response.me.resaleSubmission.channel).toBeNull()
    expect(response.me.resaleSubmission.rejectionReasons).toEqual([
      "MEDIUM_NOT_SUPPORTED",
      "OUTSIDE_US",
    ])
  })

  it("maps every rejection reason Gravity defines", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        ...acceptedSubmission,
        state: "rejected",
        channel: null,
        rejection_reasons: [
          "medium_not_supported",
          "not_purchased_on_artsy",
          "outside_us",
        ],
      })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.rejectionReasons).toEqual([
      "MEDIUM_NOT_SUPPORTED",
      "NOT_PURCHASED_ON_ARTSY",
      "OUTSIDE_US",
    ])
  })

  it("returns missing requirements so clients can resume a draft", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        ...acceptedSubmission,
        price_listed_minor: null,
        packaging: null,
        packer: null,
        courier_handoff: null,
        missing_requirements: [
          "price_listed_minor",
          "packaging",
          "packer",
          "courier_handoff",
        ],
      })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.missingRequirements).toEqual([
      "price_listed_minor",
      "packaging",
      "packer",
      "courier_handoff",
    ])
    expect(response.me.resaleSubmission.packaging).toBeNull()
  })

  it("maps every shipping preference Gravity defines", async () => {
    const cases = [
      { field: "packaging", values: ["framed", "rolled", "no_preference"] },
      { field: "packer", values: ["seller", "courier", "no_preference"] },
      {
        field: "courier_handoff",
        values: ["seller_dropoff", "courier_pickup", "no_preference"],
      },
    ]

    for (const { field, values } of cases) {
      for (const value of values) {
        context.meResaleSubmissionLoader = jest.fn(() =>
          Promise.resolve({ ...acceptedSubmission, [field]: value })
        )

        const response = await runAuthenticatedQuery(query, context)
        const graphqlField =
          field === "courier_handoff" ? "courierHandoff" : field

        expect(response.me.resaleSubmission[graphqlField]).toEqual(
          value.toUpperCase()
        )
      }
    }
  })

  it("propagates a Gravity 404", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(new HTTPError("Not Found", 404, { error: "Not Found" }))
    )

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow()
  })

  it("returns null when signed out", async () => {
    const response = await runQuery(query, {})

    expect(response.me).toBeNull()
  })

  describe("statusMessage", () => {
    const statusQuery = gql`
      query {
        me {
          resaleSubmission(id: "submission-1") {
            statusMessage
          }
        }
      }
    `

    it.each([
      ["accepted", "In progress"],
      ["auction_review", "Submitted"],
      ["canceled", "Canceled"],
      ["listed", "Submitted"],
      ["rejected", "Previously rejected"],
    ])("describes a %s submission as “%s”", async (state, message) => {
      context.meResaleSubmissionLoader = jest.fn(() =>
        Promise.resolve({ ...acceptedSubmission, state })
      )

      const response = await runAuthenticatedQuery(statusQuery, context)

      expect(response.me.resaleSubmission.statusMessage).toEqual(message)
    })

    it("returns an empty message and logs a warning for an unknown state", async () => {
      context.meResaleSubmissionLoader = jest.fn(() =>
        Promise.resolve({ ...acceptedSubmission, state: "mystery" })
      )

      const response = await runAuthenticatedQuery(statusQuery, context)

      expect(response.me.resaleSubmission.statusMessage).toEqual("")
      expect(warn).toHaveBeenCalledWith(
        "Unknown resale submission state: mystery"
      )
    })
  })

  describe("isCancelable and isEditable", () => {
    const capabilitiesQuery = gql`
      query {
        me {
          resaleSubmission(id: "submission-1") {
            isCancelable
            isEditable
          }
        }
      }
    `

    it.each([
      ["accepted", true],
      ["auction_review", false],
      ["canceled", false],
      ["listed", false],
      ["rejected", false],
    ])("returns %s as %s", async (state, expected) => {
      context.meResaleSubmissionLoader = jest.fn(() =>
        Promise.resolve({ ...acceptedSubmission, state })
      )

      const response = await runAuthenticatedQuery(capabilitiesQuery, context)

      expect(response.me.resaleSubmission).toEqual({
        isCancelable: expected,
        isEditable: expected,
      })
    })
  })

  describe("submittedArtwork", () => {
    const artworkQuery = gql`
      query {
        me {
          resaleSubmission(id: "submission-1") {
            submittedArtworkID
            submittedArtwork {
              internalID
              title
            }
          }
        }
      }
    `

    beforeEach(() => {
      context.artworkLoader = jest.fn(() =>
        Promise.resolve({
          _id: "artwork-1",
          id: "an-artwork",
          title: "Untitled",
        })
      )
    })

    it("loads the submitted artwork by its ID", async () => {
      const response = await runAuthenticatedQuery(artworkQuery, context)

      expect(context.artworkLoader as jest.Mock).toHaveBeenCalledWith(
        "artwork-1"
      )
      expect(response.me.resaleSubmission).toEqual({
        submittedArtworkID: "artwork-1",
        submittedArtwork: { internalID: "artwork-1", title: "Untitled" },
      })
    })

    it("returns null when Gravity cannot find the artwork for this user", async () => {
      context.artworkLoader = jest.fn(() =>
        Promise.reject(new HTTPError("Artwork Not Found", 404))
      )

      const response = await runAuthenticatedQuery(artworkQuery, context)

      expect(response.me.resaleSubmission.submittedArtworkID).toEqual(
        "artwork-1"
      )
      expect(response.me.resaleSubmission.submittedArtwork).toBeNull()
    })

    it("surfaces other artwork loading errors", async () => {
      context.artworkLoader = jest.fn(() =>
        Promise.reject(new HTTPError("Server Error", 500))
      )

      await expect(
        runAuthenticatedQuery(artworkQuery, context)
      ).rejects.toThrow()
    })
  })

  describe("conditionPhotos", () => {
    const photosQuery = gql`
      query {
        me {
          resaleSubmission(id: "submission-1") {
            conditionPhotos {
              internalID
              imageURL
              url(version: "large")
              width
              height
            }
          }
        }
      }
    `

    it("returns the submission’s photos as images, oldest first", async () => {
      context.meResaleSubmissionLoader = jest.fn(() =>
        Promise.resolve({
          ...acceptedSubmission,
          images: [
            {
              id: "image-1",
              image_url: "https://d32dm0rphc51dk.cloudfront.net/a/:version.jpg",
              image_urls: {
                large: "https://d32dm0rphc51dk.cloudfront.net/a/large.jpg",
              },
              image_versions: ["large"],
              original_height: 800,
              original_width: 600,
            },
            {
              id: "image-2",
              image_url: "https://d32dm0rphc51dk.cloudfront.net/b/:version.jpg",
              image_urls: {
                large: "https://d32dm0rphc51dk.cloudfront.net/b/large.jpg",
              },
              image_versions: ["large"],
              original_height: 400,
              original_width: 300,
            },
          ],
        })
      )

      const response = await runAuthenticatedQuery(photosQuery, context)

      expect(response.me.resaleSubmission.conditionPhotos).toEqual([
        {
          internalID: "image-1",
          imageURL: "https://d32dm0rphc51dk.cloudfront.net/a/:version.jpg",
          url: "https://d32dm0rphc51dk.cloudfront.net/a/large.jpg",
          width: 600,
          height: 800,
        },
        {
          internalID: "image-2",
          imageURL: "https://d32dm0rphc51dk.cloudfront.net/b/:version.jpg",
          url: "https://d32dm0rphc51dk.cloudfront.net/b/large.jpg",
          width: 300,
          height: 400,
        },
      ])
    })

    it("returns an empty list when Gravity sends no images", async () => {
      const response = await runAuthenticatedQuery(photosQuery, context)

      expect(response.me.resaleSubmission.conditionPhotos).toEqual([])
    })
  })
})
