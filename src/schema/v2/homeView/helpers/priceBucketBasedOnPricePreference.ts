export const priceBucketBasedOnPricePreference = (pricePreference: number) => {
  // Price buckets are aligned with the dropdown options on the website's top menu's dropdown
  const priceBuckets = [
    { priceRange: "0-500", min: 0, max: 500, text: "Art Under $500" },
    { priceRange: "501-1000", min: 501, max: 1000, text: "Art Under $1000" },
    { priceRange: "1001-2500", min: 1001, max: 2500, text: "Art Under $2500" },
    { priceRange: "2501-5000", min: 2501, max: 5000, text: "Art Under $5000" },
    {
      priceRange: "5001-10000",
      min: 5001,
      max: 10000,
      text: "Art Under $10000",
    },
    {
      priceRange: "10001-25000",
      min: 10001,
      max: 25000,
      text: "Art Under $25000",
    },
    {
      priceRange: "25001-*",
      min: 25001,
      max: Number.POSITIVE_INFINITY,
      text: "Art Above $25000",
    },
  ]

  if (pricePreference > 25000) return priceBuckets[priceBuckets.length - 1]

  const priceBucket = priceBuckets.find(({ min, max }) => {
    return pricePreference >= min && pricePreference <= max
  })

  return priceBucket
}
