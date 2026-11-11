import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  REJECTED_ARTWORK_ID,
  meLoader,
  stubLoaders,
} from "./fixtures"

const query = (id: string) => gql`
  {
    me {
      resaleSubmission(id: "${id}") {
        id
        internalID
        state
        channel
        rejectionReasons
        recommendedPriceMin {
          minor
          currencyCode
          display
        }
        recommendedPriceMax {
          minor
        }
        priceListed {
          minor
        }
        packaging
        packer
        courierHandoff
        missingRequirements
        isReadyToList
        createdAt
      }
    }
  }
`

const resaleSubmission = async (id: string, loaders = stubLoaders()) => {
  const { me } = await runAuthenticatedQuery(query(id), {
    meLoader,
    ...loaders,
  } as any)
  return me.resaleSubmission
}

describe("me.resaleSubmission", () => {
  it("resolves a marketplace submission", async () => {
    const submission = await resaleSubmission(`stub-${MARKETPLACE_ARTWORK_ID}`)

    expect(submission).toEqual({
      id: expect.any(String),
      internalID: `stub-${MARKETPLACE_ARTWORK_ID}`,
      state: "ACCEPTED",
      channel: "MARKETPLACE",
      rejectionReasons: [],
      recommendedPriceMin: {
        minor: 280000,
        currencyCode: "USD",
        display: "US$2,800",
      },
      recommendedPriceMax: { minor: 360000 },
      priceListed: null,
      packaging: null,
      packer: null,
      courierHandoff: null,
      missingRequirements: [
        "PRICE_LISTED",
        "PACKAGING",
        "PACKER",
        "COURIER_HANDOFF",
      ],
      isReadyToList: false,
      createdAt: expect.any(String),
    })
    expect(submission.id).not.toEqual(submission.internalID)
  })

  it("resolves an auction submission as not ready to list", async () => {
    const submission = await resaleSubmission(`stub-${AUCTION_ARTWORK_ID}`)

    expect(submission).toMatchObject({
      state: "ACCEPTED",
      channel: "AUCTION",
      recommendedPriceMin: null,
      recommendedPriceMax: null,
      missingRequirements: [],
      isReadyToList: false,
    })
  })

  it("resolves a rejected submission with its reasons", async () => {
    const submission = await resaleSubmission(`stub-${REJECTED_ARTWORK_ID}`)

    expect(submission).toMatchObject({
      state: "REJECTED",
      channel: null,
      rejectionReasons: ["OUTSIDE_US"],
      isReadyToList: false,
    })
  })

  it("reads saved fields and readiness from the record without recomputing them", async () => {
    const resaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        id: "gravity-id",
        state: "listed",
        channel: "marketplace",
        price_currency_code: "USD",
        price_listed_minor: 0,
        packaging: "no_preference",
        packer: "courier",
        courier_handoff: "courier_pickup",
        missing_requirements: ["packer"],
        ready_to_list: true,
      })
    )

    const submission = await resaleSubmission("gravity-id", {
      resaleSubmissionLoader,
    } as any)

    expect(submission).toMatchObject({
      priceListed: { minor: 0 },
      packaging: "NO_PREFERENCE",
      packer: "COURIER",
      courierHandoff: "COURIER_PICKUP",
      missingRequirements: ["PACKER"],
      isReadyToList: true,
    })
  })

  it("falls back to artworkLoader for the submitted artwork", async () => {
    const artworkLoader = jest.fn(() =>
      Promise.resolve({ _id: MARKETPLACE_ARTWORK_ID, id: "my-work" })
    )

    const { me } = await runAuthenticatedQuery(
      gql`
        {
          me {
            resaleSubmission(id: "stub-${MARKETPLACE_ARTWORK_ID}") {
              submittedArtwork {
                internalID
              }
            }
          }
        }
      `,
      {
        meLoader,
        ...stubLoaders(),
        artworkLoader,
      } as any
    )

    expect(me.resaleSubmission.submittedArtwork.internalID).toEqual(
      MARKETPLACE_ARTWORK_ID
    )
    expect(artworkLoader).toHaveBeenCalledWith(MARKETPLACE_ARTWORK_ID)
  })

  it("is null when signed out", async () => {
    const { me } = await runQuery(
      gql`
        {
          me {
            resaleSubmission(id: "stub-x") {
              internalID
            }
          }
        }
      `,
      { meLoader: () => Promise.resolve({}) }
    )

    expect(me.resaleSubmission).toBeNull()
  })
})
