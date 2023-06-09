import gql from "lib/gql"
import { runQuery } from "../test/utils"

describe("verifyAddressQuery", () => {
  it("validates an international address", async () => {
    const query = gql`
      query(
        $addressLine1: String!
        $addressLine2: String
        $city: String!
        $country: String!
        $postalCode: String!
        $region: String!
      ) {
        verifyAddress(
          addressLine1: $addressLine1
          addressLine2: $addressLine2
          city: $city
          country: $country
          postalCode: $postalCode
          region: $region
        ) {
          verificationStatus
          suggestedAddresses {
            address {
              addressLine1
            }
          }
          inputAddress {
            city
            country
            region
            postal_code
            address_line_1
            address_line_2
          }
        }
      }
    `

    const validIntAddress = {
      addressLine1: "Lausitzer Str. 46",
      addressLine2: "Kreuzberg",
      city: "Berlin",
      country: "Germany",
      name: "home",
      postalCode: "10999",
      region: "Berlin",
    }

    const mockAddressVerificationResult = {
      verificationStatus: "VERIFIED_WITH_CHANGES",
      inputAddress: validIntAddress,
      suggestedAddresses: [
        {
          address: validIntAddress,
          lines: ["Lausitzer Straße 46", "Kreuzberg", "10999 Berlin"],
        },
      ],
    }

    const context = {
      verifyAddressLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(mockAddressVerificationResult)),
    }

    const data = await runQuery(query, context, { validIntAddress })

    expect(context.verifyAddressLoader).toHaveBeenCalledWith({
      input: validIntAddress,
    })

    expect(data!.verifyAddress).toEqual(mockAddressVerificationResult)
  })

  it("validates a US address", async () => {
    const query = gql`
      query(
        $addressLine1: String!
        $addressLine2: String
        $city: String!
        $country: String!
        $postalCode: String!
        $region: String!
      ) {
        verifyAddress(
          addressLine1: $addressLine1
          addressLine2: $addressLine2
          city: $city
          country: $country
          postalCode: $postalCode
          region: $region
        ) {
          verificationStatus
          suggestedAddresses {
            address {
              addressLine1
            }
          }
          inputAddress {
            city
            country
            region
            postal_code
            address_line_1
            address_line_2
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
      verificationStatus: "VERIFIED_WITH_CHANGES",
      inputAddress: validUsAddress,
      suggestedAddresses: [
        {
          address: validUsAddress,
          lines: ["Lausitzer Straße 46", "Kreuzberg", "10999 Berlin"],
        },
      ],
    }

    const context = {
      verifyAddressLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(mockAddressVerificationResult)),
    }

    const data = await runQuery(query, context, { validUsAddress })

    expect(context.verifyAddressLoader).toHaveBeenCalledWith({
      input: validUsAddress,
    })

    expect(data!.verifyAddress).toEqual(mockAddressVerificationResult)
  })
})
