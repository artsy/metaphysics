import { priceBucketBasedOnPricePreference } from "../priceBucketBasedOnPricePreference"

describe("priceBucketBasedOnPricePreference", () => {
  it("returns the 0-500 bucket for minimum value (0)", () => {
    expect(priceBucketBasedOnPricePreference(0)).toEqual({
      priceRange: "0-500",
      min: 0,
      max: 500,
      text: "Art Under $500",
    })
  })

  it("returns the 0-500 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(250)).toEqual({
      priceRange: "0-500",
      min: 0,
      max: 500,
      text: "Art Under $500",
    })
  })

  it("returns the 0-500 bucket for the maximum value of the range (500)", () => {
    expect(priceBucketBasedOnPricePreference(500)).toEqual({
      priceRange: "0-500",
      min: 0,
      max: 500,
      text: "Art Under $500",
    })
  })

  it("returns the 501-1000 bucket for the minimum value of the range (501)", () => {
    expect(priceBucketBasedOnPricePreference(501)).toEqual({
      priceRange: "501-1000",
      min: 501,
      max: 1000,
      text: "Art Under $1000",
    })
  })

  it("returns the 501-1000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(750)).toEqual({
      priceRange: "501-1000",
      min: 501,
      max: 1000,
      text: "Art Under $1000",
    })
  })

  it("returns the 501-1000 bucket for the maximum value of the range (1000)", () => {
    expect(priceBucketBasedOnPricePreference(1000)).toEqual({
      priceRange: "501-1000",
      min: 501,
      max: 1000,
      text: "Art Under $1000",
    })
  })

  it("returns the 1001-2500 bucket for the minimum value of the range (1001)", () => {
    expect(priceBucketBasedOnPricePreference(1001)).toEqual({
      priceRange: "1001-2500",
      min: 1001,
      max: 2500,
      text: "Art Under $2500",
    })
  })

  it("returns the 1001-2500 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(2000)).toEqual({
      priceRange: "1001-2500",
      min: 1001,
      max: 2500,
      text: "Art Under $2500",
    })
  })

  it("returns the 1001-2500 bucket for the maximum value of the range (2500)", () => {
    expect(priceBucketBasedOnPricePreference(2500)).toEqual({
      priceRange: "1001-2500",
      min: 1001,
      max: 2500,
      text: "Art Under $2500",
    })
  })

  it("returns the 2501-5000 bucket for the minimum value of the range (2501)", () => {
    expect(priceBucketBasedOnPricePreference(2501)).toEqual({
      priceRange: "2501-5000",
      min: 2501,
      max: 5000,
      text: "Art Under $5000",
    })
  })

  it("returns the 2501-5000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(3750)).toEqual({
      priceRange: "2501-5000",
      min: 2501,
      max: 5000,
      text: "Art Under $5000",
    })
  })

  it("returns the 2501-5000 bucket for the maximum value of the range (5000)", () => {
    expect(priceBucketBasedOnPricePreference(5000)).toEqual({
      priceRange: "2501-5000",
      min: 2501,
      max: 5000,
      text: "Art Under $5000",
    })
  })

  it("returns the 5001-10000 bucket for the minimum value of the range (5001)", () => {
    expect(priceBucketBasedOnPricePreference(5001)).toEqual({
      priceRange: "5001-10000",
      min: 5001,
      max: 10000,
      text: "Art Under $10000",
    })
  })

  it("returns the 5001-10000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(7500)).toEqual({
      priceRange: "5001-10000",
      min: 5001,
      max: 10000,
      text: "Art Under $10000",
    })
  })

  it("returns the 5001-10000 bucket for the maximum value of the range (10000)", () => {
    expect(priceBucketBasedOnPricePreference(10000)).toEqual({
      priceRange: "5001-10000",
      min: 5001,
      max: 10000,
      text: "Art Under $10000",
    })
  })

  it("returns the 10001-25000 bucket for the minimum value of the range (10001)", () => {
    expect(priceBucketBasedOnPricePreference(10001)).toEqual({
      priceRange: "10001-25000",
      min: 10001,
      max: 25000,
      text: "Art Under $25000",
    })
  })

  it("returns the 10001-25000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(15000)).toEqual({
      priceRange: "10001-25000",
      min: 10001,
      max: 25000,
      text: "Art Under $25000",
    })
  })

  it("returns the 10001-25000 bucket for the maximum value of the range (25000)", () => {
    expect(priceBucketBasedOnPricePreference(25000)).toEqual({
      priceRange: "10001-25000",
      min: 10001,
      max: 25000,
      text: "Art Under $25000",
    })
  })

  it("returns the 25000-* bucket for a value above the minimum value of the range", () => {
    expect(priceBucketBasedOnPricePreference(25001)).toEqual({
      priceRange: "25001-*",
      min: 25001,
      max: Number.POSITIVE_INFINITY,
      text: "Art Above $25000",
    })
  })

  it("returns the 25000-* bucket for a very large value", () => {
    expect(priceBucketBasedOnPricePreference(1000000)).toEqual({
      priceRange: "25001-*",
      min: 25001,
      max: Number.POSITIVE_INFINITY,
      text: "Art Above $25000",
    })
  })
})
