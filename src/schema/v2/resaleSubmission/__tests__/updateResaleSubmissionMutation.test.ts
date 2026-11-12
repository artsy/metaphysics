import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { MARKETPLACE_ARTWORK_ID, stubLoaders } from "./fixtures"

const mutation = (input: string) => gql`
  mutation {
    updateResaleSubmission(input: ${input}) {
      resaleSubmissionOrError {
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
  return updateResaleSubmission.resaleSubmissionOrError
}

const id = `stub-${MARKETPLACE_ARTWORK_ID}`

describe("updateResaleSubmission", () => {
  it("saves the asking price and shipping preferences", async () => {
    expect(
      await update(`{
        id: "${id}"
        priceListedMinor: 320000
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
      },
    })
  })

  it("sends only the given fields, in Gravity's names", async () => {
    const updateResaleSubmissionLoader = jest.fn(
      stubLoaders().updateResaleSubmissionLoader
    )

    await update(
      `{ id: "${id}", priceListedMinor: 0, packaging: null, packer: SELLER }`,
      { updateResaleSubmissionLoader }
    )

    expect(updateResaleSubmissionLoader).toHaveBeenCalledWith(id, {
      price_listed_minor: 0,
      packer: "seller",
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
        new HTTPError(
          "Bad Request",
          400,
          JSON.stringify({
            type: "param_error",
            message: "Packer is not included in the list",
          })
        )
      )
    )

    expect(
      await update(`{ id: "${id}", packer: SELLER }`, {
        updateResaleSubmissionLoader,
      })
    ).toEqual({
      __typename: "UpdateResaleSubmissionFailure",
      mutationError: {
        message: "Packer is not included in the list",
        statusCode: 400,
      },
    })
  })
})
