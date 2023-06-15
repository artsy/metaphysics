import gql from "lib/gql"
import { runQuery } from "../test/utils"

describe("verifyAddressQuery", () => {
  it("validates an international address", async () => {
    const query = gql`
      {
        verifyAddress(
          addressLine1: "Lausitzer Str. 46"
          city: "Berlin"
          country: "DE"
          postalCode: "10999"
          region: "Berlin"
        ) {
          verificationStatus
          inputAddress {
            address {
              city
              country
              region
              postal_code
              address_line1
              address_line2
            }
            lines
          }
          suggestedAddresses {
            address {
              city
              country
              region
              postal_code
              address_line_1
              address_line_2
            }
            lines
          }
        }
      }
    `

    const validIntAddress = {
      address_line_1: "Lausitzer Str. 46",
      city: "Berlin",
      country: "DE",
      postal_code: "10999",
      region: "Berlin",
    }

    const mockAddressVerificationResult = {
      verificationStatus: "VERIFIED_WITH_CHANGES",
      inputAddress: {
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
      suggestedAddresses: [
        {
          address: {
            address_line1: "Lausitzer Straße 46",
            address_line2: "Kreuzberg",
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

    const context = {
      verifyAddressLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(mockAddressVerificationResult)),
    }

    const data = await runQuery(query, context, { validIntAddress })
    expect(context.verifyAddressLoader).toHaveBeenCalledWith(validIntAddress)
    expect(data!.verifyAddress).toEqual(mockAddressVerificationResult)
  })

  it("validates a domestic -US- address", async () => {
    const query = gql`
      {
        verifyAddress(
          addressLine1: "1251 John Calvin Drive"
          city: "Harvey"
          country: "US"
          postalCode: "60426"
          region: "Illinois"
        ) {
          verificationStatus
          inputAddress {
            address {
              city
              country
              region
              postal_code
              address_line1
              address_line2
            }
            lines
          }
          suggestedAddresses {
            address {
              city
              country
              region
              postal_code
              address_line_1
              address_line_2
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
      verificationStatus: "VERIFIED_NO_CHANGE",
      inputAddress: {
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
      suggestedAddresses: [
        {
          address: {
            address_line1: "1251 John Calvin Drive",
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

    const context = {
      verifyAddressLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(mockAddressVerificationResult)),
    }

    const data = await runQuery(query, context, { validUSAddress })
    expect(context.verifyAddressLoader).toHaveBeenCalledWith(validUSAddress)
    expect(data!.verifyAddress).toEqual(mockAddressVerificationResult)
  })
})
