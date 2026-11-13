import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  REJECTED_ARTWORK_ID,
  stubLoaders,
} from "./fixtures"

const mutation = (input: string) => gql`
  mutation {
    updateResaleSubmission(input: ${input}) {
      responseOrError {
        __typename
        ... on UpdateResaleSubmissionSuccess {
          resaleSubmission {
            priceListed {
              minor
              currencyCode
            }
            packaging
            packer
            courierHandoff
            missingRequirements
            isReadyToList
          }
        }
        ... on UpdateResaleSubmissionFailure {
          mutationError {
            message
            statusCode
          }
        }
      }
    }
  }
`

const update = async (input: string, loaders: any = stubLoaders()) => {
  const { updateResaleSubmission } = await runAuthenticatedQuery(
    mutation(input),
    loaders
  )
  return updateResaleSubmission.responseOrError
}

const marketplaceID = `"stub-${MARKETPLACE_ARTWORK_ID}"`

describe("updateResaleSubmission", () => {
  it("is ready to list once all four fields are sent", async () => {
    expect(
      await update(`{
        id: ${marketplaceID}
        priceListed: { amount: 3200, currencyCode: "USD" }
        packaging: ROLLED
        packer: NO_PREFERENCE
        courierHandoff: SELLER_DROPOFF
      }`)
    ).toEqual({
      __typename: "UpdateResaleSubmissionSuccess",
      resaleSubmission: {
        priceListed: { minor: 320000, currencyCode: "USD" },
        packaging: "ROLLED",
        packer: "NO_PREFERENCE",
        courierHandoff: "SELLER_DROPOFF",
        missingRequirements: [],
        isReadyToList: true,
      },
    })
  })

  it("still reports the price as missing when only shipping is sent", async () => {
    expect(
      await update(`{
        id: ${marketplaceID}
        packaging: FRAMED
        packer: SELLER
        courierHandoff: COURIER_PICKUP
      }`)
    ).toMatchObject({
      resaleSubmission: {
        priceListed: null,
        missingRequirements: ["PRICE_LISTED"],
        isReadyToList: false,
      },
    })
  })

  it("converts the asking price to minor units and sends only the given fields", async () => {
    const loaders = stubLoaders()
    const updateResaleSubmissionLoader = jest.fn(
      loaders.updateResaleSubmissionLoader
    )

    await update(
      `{ id: ${marketplaceID}, priceListed: { amount: 1234.565, currencyCode: "usd" } }`,
      { updateResaleSubmissionLoader }
    )

    expect(updateResaleSubmissionLoader).toHaveBeenCalledWith(
      `stub-${MARKETPLACE_ARTWORK_ID}`,
      {
        price_listed_minor: 123457,
      }
    )
  })

  it("keeps an asking price of 0", async () => {
    expect(
      await update(
        `{ id: ${marketplaceID}, priceListed: { amount: 0, currencyCode: "USD" } }`
      )
    ).toMatchObject({
      resaleSubmission: {
        priceListed: { minor: 0 },
        missingRequirements: ["PACKAGING", "PACKER", "COURIER_HANDOFF"],
      },
    })
  })

  it("leaves a field unchanged when it is sent as null", async () => {
    const loaders = stubLoaders()
    const updateResaleSubmissionLoader = jest.fn(
      loaders.updateResaleSubmissionLoader
    )

    await update(`{ id: ${marketplaceID}, packaging: null, packer: SELLER }`, {
      updateResaleSubmissionLoader,
    })

    expect(updateResaleSubmissionLoader).toHaveBeenCalledWith(
      `stub-${MARKETPLACE_ARTWORK_ID}`,
      {
        packer: "seller",
      }
    )
  })

  it("accepts shipping answers on an auction submission without making it ready to list", async () => {
    expect(
      await update(`{ id: "stub-${AUCTION_ARTWORK_ID}", packaging: FRAMED }`)
    ).toMatchObject({
      resaleSubmission: {
        packaging: "FRAMED",
        missingRequirements: [],
        isReadyToList: false,
      },
    })
  })

  it("fails for a currency other than the submission's", async () => {
    const updateResaleSubmissionLoader = jest.fn()

    expect(
      await update(
        `{ id: ${marketplaceID}, priceListed: { amount: 3200, currencyCode: "EUR" } }`,
        { updateResaleSubmissionLoader }
      )
    ).toEqual({
      __typename: "UpdateResaleSubmissionFailure",
      mutationError: {
        message: "priceListed currency must be USD",
        statusCode: null,
      },
    })
    expect(updateResaleSubmissionLoader).not.toHaveBeenCalled()
  })

  it("fails for a rejected submission", async () => {
    expect(
      await update(`{ id: "stub-${REJECTED_ARTWORK_ID}", packaging: FRAMED }`)
    ).toEqual({
      __typename: "UpdateResaleSubmissionFailure",
      mutationError: {
        message: "A rejected resale submission can't be updated",
        statusCode: 422,
      },
    })
  })

  it("fails for an unknown submission", async () => {
    expect(await update(`{ id: "not-a-stub", packaging: FRAMED }`)).toEqual({
      __typename: "UpdateResaleSubmissionFailure",
      mutationError: {
        message: "Resale submission not found",
        statusCode: 404,
      },
    })
  })

  it("returns a Gravity validation error as a failure", async () => {
    const updateResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(
        new HTTPError("Unprocessable", 422, {
          error: "Packer is not included in the list",
        })
      )
    )

    expect(
      await update(`{ id: ${marketplaceID}, packer: SELLER }`, {
        updateResaleSubmissionLoader,
      })
    ).toMatchObject({
      __typename: "UpdateResaleSubmissionFailure",
      mutationError: { message: "Packer is not included in the list" },
    })
  })
})
