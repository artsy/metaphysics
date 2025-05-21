export const priceBucketBasedOnPricePreference = (pricePreference: number) => {
  // Price buckets are aligned with the dropdown options on the website's top menu's dropdown
  const priceBuckets = [
    { priceRange: "0-500", min: 0, max: 500, text: "Art Under $500" },
    { priceRange: "500-1000", min: 500, max: 1000, text: "Art Under $1000" },
    { priceRange: "1000-2500", min: 1000, max: 2500, text: "Art Under $2500" },
    { priceRange: "2500-5000", min: 2500, max: 5000, text: "Art Under $5000" },
    {
      priceRange: "5000-10000",
      min: 5000,
      max: 10000,
      text: "Art Under $10000",
    },
    {
      priceRange: "10000-25000",
      min: 10000,
      max: 25000,
      text: "Art Under $25000",
    },
    {
      priceRange: "25000-*",
      min: 25000,
      max: Number.POSITIVE_INFINITY,
      text: "Art Above $25000",
    },
  ]

  if (pricePreference > 25000) return priceBuckets[priceBuckets.length - 1]
  if (pricePreference === 0) return priceBuckets[0]

  const priceBucket = priceBuckets.find(({ min, max }) => {
    return pricePreference > min && pricePreference <= max
  })

  return priceBucket
}
