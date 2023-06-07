import gql from "lib/gql"
import { runQuery } from "../test/utils"

describe("verifyAddressMutation", () => {
  it("validates an international address", async () => {
    const mutation = gql`
      mutation verifyAddress($input: verifyAddressMutationInput!) {
        verifyAddress(input: $input) {
          successOrError {
            __typename
          }
        }
      }
    `

    const validIntAddress = {
      addressLine1: "Lausitzer Str. 46",
      addressLine2: "Hinterhaus",
      city: "Berlin",
      country: "Germany",
      name: "home",
      postalCode: "10999",
      region: "Berlin",
    }

    const mockAddressVerificationResult = {
      verificationStatus: "VERIFIED_NO_CHANGE",
      inputAddress: validIntAddress,
      suggestedAddresses: [],
    }

    const context = {
      verifyAddressLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(mockAddressVerificationResult)),
    }

    const data = await runQuery(mutation, context, { validIntAddress })

    expect(context.verifyAddressLoader).toHaveBeenCalledWith({
      input: validIntAddress,
    })

    expect(
      data!.VerifyAddressMutationSuccessOrError.successOrError
        .VerifyAddressMutationSuccess
    ).toEqual(mockAddressVerificationResult)
  })

  it("validates a domestic -us- address", async () => {
    const mutation = gql`
      mutation verifyAddress($input: verifyAddressMutationInput!) {
        verifyAddress(input: $input) {
          successOrError {
            __typename
          }
        }
      }
    `

    const validUsAddress = {
      addressLine1: "1405 Randolph Street",
      addressLine2: "2nd floor",
      city: "Fall River",
      country: "US",
      name: "home",
      postalCode: "02720",
      region: "Massachusetts",
    }

    const mockAddressVerificationResult = {
      verificationStatus: "VERIFIED_NO_CHANGE",
      inputAddress: validUsAddress,
      suggestedAddresses: [],
    }

    const context = {
      verifyAddressLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(mockAddressVerificationResult)),
    }

    const data = await runQuery(mutation, context, { validUsAddress })

    expect(context.verifyAddressLoader).toHaveBeenCalledWith({
      input: validUsAddress,
    })

    expect(
      data!.VerifyAddressMutationSuccessOrError.successOrError
        .VerifyAddressMutationSuccess
    ).toEqual(mockAddressVerificationResult)
  })
})
