/**
 *
 * @param number
 * @param decimalPlaces
 * @returns the number formatted with the specified decimal places
 * @example formatLargeNumber(123456, 2) => "123.46k"
 * @example formatLargeNumber(123456, 0) => "123k"
 */
export function formatLargeNumber(number: number, decimalPlaces = 0) {
  if (number < 1000) {
    return number.toString()
  } else if (number < 1000000) {
    return `${(number / 1000).toFixed(decimalPlaces)}k`
  } else if (number < 1000000000) {
    return `${(number / 1000000).toFixed(decimalPlaces)}M`
  } else {
    return `${(number / 1000000000).toFixed(decimalPlaces)}B`
  }
}
