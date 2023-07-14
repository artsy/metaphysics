import gql from "lib/gql"
import { runAuthenticatedQuery } from "../test/utils"

describe("verifyAddressQuery", () => {
  it("works with an international address", async () => {
    const query = gql`
      {
        verifyAddress(
          address: {
            addressLine1: "Lausitzer Str. 46"
            city: "Berlin"
            country: "DE"
            postalCode: "10999"
            region: "Berlin"
          }
        ) {
          verificationStatus
          inputAddress {
            address {
              city
              country
              region
              postalCode
              addressLine1
              addressLine2
            }
            lines
          }
          suggestedAddresses {
            address {
              city
              country
              region
              postalCode
              addressLine1
              addressLine2
            }
            lines
          }
        }
      }
    `

    const expectedArgs = {
      address_line_1: "Lausitzer Str. 46",
      city: "Berlin",
      country: "DE",
      postal_code: "10999",
      region: "Berlin",
    }

    const mockAddressVerificationResult = {
      verification_status: "VERIFIED_WITH_CHANGES",
      input_address: {
        address: {
          address_line_1: "Lausitzer Straße 46",
          city: "Berlin",
          region: "Berlin",
          postal_code: "10999",
          country: "DE",
        },
        lines: [
          "Lausitzer Str. 46",
          "Hinterhaus",
          "Berlin Berlin 10999",
          "Germany",
        ],
      },
      suggested_addresses: [
        {
          address: {
            address_line_1: "Lausitzer Straße 46",
            address_line_2: "Kreuzberg",
            city: "Berlin",
            region: "Berlin",
            postal_code: "10999",
            country: "DE",
          },
          lines: [
            "Lausitzer Str. 46",
            "Hinterhaus",
            "Berlin Berlin 10999",
            "Germany",
          ],
        },
      ],
    }

    const verifyAddressLoader = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockAddressVerificationResult))

    await runAuthenticatedQuery(query, {
      verifyAddressLoader,
    })
    expect(verifyAddressLoader).toHaveBeenCalledWith(expectedArgs)
  })

  it("works with a domestic -US- address", async () => {
    const query = gql`
      {
        verifyAddress(
          address: {
            addressLine1: "1251 John Calvin Drive"
            city: "Harvey"
            country: "US"
            postalCode: "60426"
            region: "Illinois"
          }
        ) {
          verificationStatus
          inputAddress {
            address {
              city
              country
              region
              postalCode
              addressLine1
              addressLine2
            }
            lines
          }
          suggestedAddresses {
            address {
              city
              country
              region
              postalCode
              addressLine1
              addressLine2
            }
            lines
          }
        }
      }
    `

    const validUSAddress = {
      address_line_1: "1251 John Calvin Drive",
      city: "Harvey",
      country: "US",
      postal_code: "60426",
      region: "Illinois",
    }

    const mockAddressVerificationResult = {
      verification_status: "VERIFIED_WITH_CHANGES",
      input_address: {
        address: {
          address_line_1: "1251 John Calvin Dr",
          city: "Harvey",
          region: "Illinois",
          postal_code: "60426",
          country: "US",
        },
        lines: [
          "1251 John Calvin Dr",
          "Havery Illinois 60426",
          "United States",
        ],
      },
      suggested_addresses: [
        {
          address: {
            address_line_1: "1251 John Calvin Drive",
            city: "Harvey",
            region: "Illinois",
            postal_code: "60426",
            country: "US",
          },
          lines: [
            "1251 John Calvin Drive",
            "Havery Illinois 60426",
            "United States",
          ],
        },
      ],
    }

    const verifyAddressLoader = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockAddressVerificationResult))

    const response = await runAuthenticatedQuery(query, { verifyAddressLoader })

    expect(response).toEqual({
      verifyAddress: {
        inputAddress: {
          address: {
            addressLine1: "1251 John Calvin Dr",
            addressLine2: null,
            city: "Harvey",
            country: "US",
            postalCode: "60426",
            region: "Illinois",
          },
          lines: [
            "1251 John Calvin Dr",
            "Havery Illinois 60426",
            "United States",
          ],
        },
        suggestedAddresses: [
          {
            address: {
              addressLine1: "1251 John Calvin Drive",
              addressLine2: null,
              city: "Harvey",
              country: "US",
              postalCode: "60426",
              region: "Illinois",
            },
            lines: [
              "1251 John Calvin Drive",
              "Havery Illinois 60426",
              "United States",
            ],
          },
        ],
        verificationStatus: "VERIFIED_WITH_CHANGES",
      },
    })
    expect(verifyAddressLoader).toHaveBeenCalledWith(validUSAddress)
  })
})
