interface MoneyField {
  amount: number
  currencyCode: string
}

export const moneyFieldToUnit = (moneyField: MoneyField) => {
  return convertToCents(moneyField.amount)
}

export const convertToCents = (value: number) => {
  // this currently only supports currencies with cents
  // and multiply the major value to 100 to get cent value
  return value * 100
}

export const parsePriceRangeValues = (
  priceRange?: string
): Array<number | undefined> => {
  if (!priceRange) return []

  return priceRange.split("-").map((x) => {
    const val = Number(x)
    return x === "*" || isNaN(val) ? undefined : convertToCents(val)
  })
}
