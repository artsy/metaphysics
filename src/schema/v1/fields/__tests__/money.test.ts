import { amount } from "../money"

describe("amount", () => {
  const getResult = ({
    obj = {},
    args = { symbol: "$" } as Record<string, unknown>,
    amountCents = 1234 as any,
  }) => amount(() => amountCents).resolve(obj, args)

  it("formats dollars", () => {
    expect(getResult({})).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("formats euros", () => {
    expect(getResult({ args: { symbol: "€" } })).toMatchInlineSnapshot(
      `"€12.34"`
    )
  })

  it("formats yen", () => {
    expect(getResult({ args: { symbol: "¥" } })).toMatchInlineSnapshot(
      `"¥12.34"`
    )
  })

  it("handles zeroes", () => {
    expect(getResult({ amountCents: 0 })).toMatchInlineSnapshot(`"$0.00"`)
  })

  it("handles null/undefined", () => {
    expect(getResult({ amountCents: null })).toMatchInlineSnapshot(`null`)

    // custom handling since undefined won't override a default argument
    expect(amount(() => undefined).resolve({}, {})).toMatchInlineSnapshot(
      `null`
    )
  })

  it("formats from a currencyCode if provided", () => {
    expect(
      getResult({
        obj: { currencyCode: "GBP" },
        args: {},
      })
    ).toMatchInlineSnapshot(`"£12.34"`)
  })

  it("prefers object symbol over currencyCode", () => {
    expect(
      getResult({
        obj: { symbol: "$", currencyCode: "GBP" },
        args: {},
      })
    ).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("prefers argument symbol over currencyCode", () => {
    expect(
      getResult({
        obj: { symbol: "£", currencyCode: "GBP" },
      })
    ).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("doesn't break when it can't find a currencyCode", () => {
    expect(getResult({ obj: { currencyCode: "BLAH" } })).toMatchInlineSnapshot(
      `"$12.34"`
    )
  })
})
