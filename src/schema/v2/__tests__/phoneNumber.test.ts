import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Phone number", () => {
  it.each(["+1 415 555-0132", "+44 207 111 1111", "+375 29 222 22 22"])(
    "check valid phone number: %s",
    async (phone) => {
      const query = gql`
        {
          phoneNumber(phoneNumber: "${phone}") {
            isValid
          }
        }
      `
      const data = await runQuery(query)

      expect(data).toEqual({
        phoneNumber: {
          isValid: true,
        },
      })
    }
  )

  it("returns US phone number information", async () => {
    const query = gql`
      {
        phoneNumber(phoneNumber: "+1 415 555-0132") {
          isValid
          countryCode
          regionCode
          originalNumber
          nationalFormat: display(format: NATIONAL)
          internationalFormat: display(format: INTERNATIONAL)
        }
      }
    `
    const data = await runQuery(query)

    expect(data).toEqual({
      phoneNumber: {
        isValid: true,
        countryCode: "1",
        regionCode: "us",
        originalNumber: "+1 415 555-0132",
        nationalFormat: "(415) 555-0132",
        internationalFormat: "+1 415-555-0132",
      },
    })
  })

  it("returns phone number information for local number when regionCode is known", async () => {
    const query = gql`
      {
        phoneNumber(phoneNumber: "90 1234 1234", regionCode: "jp") {
          isValid
          countryCode
          regionCode
          originalNumber
          nationalFormat: display(format: NATIONAL)
          internationalFormat: display(format: INTERNATIONAL)
        }
      }
    `
    const data = await runQuery(query)

    expect(data).toEqual({
      phoneNumber: {
        isValid: true,
        countryCode: "81",
        regionCode: "jp",
        originalNumber: "90 1234 1234",
        nationalFormat: "090-1234-1234",
        internationalFormat: "+81 90-1234-1234",
      },
    })
  })

  it.each(["+1 415 555", "415 555"])(
    "validates short phone numbers: %s",
    async (phone) => {
      const query = gql`
        {
          phoneNumber(phoneNumber: "${phone}", regionCode: "us") {
            isValid
            error
          }
        }
      `
      const data = await runQuery(query)

      expect(data).toEqual({
        phoneNumber: {
          isValid: false,
          error: "TOO_SHORT",
        },
      })
    }
  )

  it.each(["+1 415 555-0132 2222", "415 555 0132 2222"])(
    "validates long phone number: %s",
    async (phone) => {
      const query = gql`
        {
          phoneNumber(phoneNumber: "${phone}", regionCode: "us") {
            isValid
            error
          }
        }
      `
      const data = await runQuery(query)

      expect(data).toEqual({
        phoneNumber: {
          isValid: false,
          error: "TOO_LONG",
        },
      })
    }
  )

  it("validates invalid number: %s", async () => {
    const query = gql`
      {
        phoneNumber(phoneNumber: "999 555 1232", regionCode: "us") {
          isValid
          error
        }
      }
    `
    const data = await runQuery(query)

    expect(data).toEqual({
      phoneNumber: {
        isValid: false,
        error: "INVALID_NUMBER",
      },
    })
  })
})
