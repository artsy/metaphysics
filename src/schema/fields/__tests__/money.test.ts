import { amount } from "../money"

describe(amount, () => {
  let amountCents: number
  let args: any
  beforeEach(() => {
    args = { symbol: "$" }
    amountCents = 1234
  })

  const getResult = () => amount(() => amountCents).resolve({}, args)

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
})
