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

  it("returns the 500-1000 bucket for 500.9", () => {
    expect(priceBucketBasedOnPricePreference(500.1)).toEqual({
      priceRange: "500-1000",
      min: 500,
      max: 1000,
      text: "Art Under $1,000",
    })
  })

  it("returns the 500-1000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(501)).toEqual({
      priceRange: "500-1000",
      min: 500,
      max: 1000,
      text: "Art Under $1,000",
    })
  })

  it("returns the 500-1000 bucket for the maximum value of the range (1000)", () => {
    expect(priceBucketBasedOnPricePreference(1000)).toEqual({
      priceRange: "500-1000",
      min: 500,
      max: 1000,
      text: "Art Under $1,000",
    })
  })

  it("returns the 1000-2500 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(1000.01)).toEqual({
      priceRange: "1000-2500",
      min: 1000,
      max: 2500,
      text: "Art Under $2,500",
    })
  })

  it("returns the 1000-2500 bucket for the maximum value of the range (2500)", () => {
    expect(priceBucketBasedOnPricePreference(2500)).toEqual({
      priceRange: "1000-2500",
      min: 1000,
      max: 2500,
      text: "Art Under $2,500",
    })
  })

  it("returns the 2500-5000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(3750)).toEqual({
      priceRange: "2500-5000",
      min: 2500,
      max: 5000,
      text: "Art Under $5,000",
    })
  })

  it("returns the 2500-5000 bucket for the maximum value of the range (5000)", () => {
    expect(priceBucketBasedOnPricePreference(5000)).toEqual({
      priceRange: "2500-5000",
      min: 2500,
      max: 5000,
      text: "Art Under $5,000",
    })
  })

  it("returns the 5000-10000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(7500)).toEqual({
      priceRange: "5000-10000",
      min: 5000,
      max: 10000,
      text: "Art Under $10,000",
    })
  })

  it("returns the 5000-10000 bucket for the maximum value of the range (10000)", () => {
    expect(priceBucketBasedOnPricePreference(10000)).toEqual({
      priceRange: "5000-10000",
      min: 5000,
      max: 10000,
      text: "Art Under $10,000",
    })
  })

  it("returns the 10000-25000 bucket for a value within the range", () => {
    expect(priceBucketBasedOnPricePreference(15000)).toEqual({
      priceRange: "10000-25000",
      min: 10000,
      max: 25000,
      text: "Art Under $25,000",
    })
  })

  it("returns the 10000-25000 bucket for the maximum value of the range (25000)", () => {
    expect(priceBucketBasedOnPricePreference(25000)).toEqual({
      priceRange: "10000-25000",
      min: 10000,
      max: 25000,
      text: "Art Under $25,000",
    })
  })

  it("returns the 25000-* bucket for a very large value", () => {
    expect(priceBucketBasedOnPricePreference(1000000)).toEqual({
      priceRange: "25000-*",
      min: 25000,
      max: Number.POSITIVE_INFINITY,
      text: "Art Above $25,000",
    })
  })
})
