import { amount } from "../money"

describe(amount, () => {
  let amountCents: number
  let args: any
  let obj: any

  beforeEach(() => {
    obj = {}
    args = { symbol: "$" }
    amountCents = 1234
  })

  const getResult = () => amount(() => amountCents).resolve(obj, args)

  it("formats dollars", () => {
    expect(getResult()).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("formats euros", () => {
    args = { symbol: "€" }
    expect(getResult()).toMatchInlineSnapshot(`"€12.34"`)
  })

  it("formats yen", () => {
    args = { symbol: "¥" }
    expect(getResult()).toMatchInlineSnapshot(`"¥12.34"`)
  })

  it("handles zeroes", () => {
    amountCents = 0
    expect(getResult()).toMatchInlineSnapshot(`"$0.00"`)
  })

  it("handles null/undefined", () => {
    amountCents = null as any
    expect(getResult()).toMatchInlineSnapshot(`null`)
    amountCents = undefined as any
    expect(getResult()).toMatchInlineSnapshot(`null`)
  })

  it("formats from a currencyCode if provided", () => {
    obj = { currencyCode: "GBP" }
    args = {}
    expect(getResult()).toMatchInlineSnapshot(`"£12.34"`)
  })

  it("prefers object symbol over currencyCode", () => {
    obj = { symbol: "$", currencyCode: "GBP" }
    args = {}
    expect(getResult()).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("prefers argument symbol over currencyCode", () => {
    obj = { symbol: "£", currencyCode: "GBP" }
    expect(getResult()).toMatchInlineSnapshot(`"$12.34"`)
  })
})
