interface MoneyField {
  amount: number
  currencyCode: string
}

export const moneyFieldToUnit = (moneyField: MoneyField) => {
  // this currently only supports currencies with cents
  // and multiply the major value to 100 to get cent value
  return moneyField.amount * 100
}
