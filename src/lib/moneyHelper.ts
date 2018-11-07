interface MoneyField {
  amount: number
  currencyCode: String
}

export const moneyFieldToUnit = (moneyField: MoneyField) => {
  switch (moneyField.currencyCode) {
    case "USD":
      return moneyField.amount * 100
    default:
      return moneyField.amount
  }
}
