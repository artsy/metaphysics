// @ts-check

import { stringify } from "qs"
import { formatMarkdownValue } from "schema/fields/markdown"
import { getPagingParameters } from "relay-cursor-paging"

import {
  assign,
  camelCase,
  compact,
  difference,
  flow,
  flatMap,
  includes,
  isEmpty,
  isObject,
  isString,
  trim,
  reject,
  omit,
  map,
} from "lodash"

import now from "performance-now"

const loadNs = now()
const loadMs = Date.now()

export function timestamp() {
  return Math.round((loadMs + now() - loadNs) * 100000) / 100000
}

export function enhance(xs = [], source = {}) {
  return xs.map(x => assign({}, source, x))
}

export const isExisty = x => {
  // Return false on empty Objects
  if (isObject(x) && isEmpty(x)) return false

  // Return false on empty Strings
  if (isString(x) && isEmpty(trim(x, " \n"))) return false

  // Intentional use of loose equality operator (Fogus)
  return x != null // eslint-disable-line eqeqeq
}

// Coerce a usable value or nothing at all
export const existyValue = x => {
  if (isExisty(x)) return x
}

export const capitalizeFirstCharacter = x => x.charAt(0).toUpperCase() + x.slice(1)

export const classify = flow(camelCase, capitalizeFirstCharacter)

export const join = (by, xs) => compact(xs).join(by)

export const truncate = (string, length, append = "…") => {
  const x = string + ""
  const limit = ~~length
  return x.length > limit ? x.slice(0, limit) + append : x
}
export const toQueryString = (options = {}) =>
  stringify(options, {
    arrayFormat: "brackets",
    sort: (a, b) => a.localeCompare(b),
  })
export const toKey = (path, options = {}) => `${path}?${toQueryString(options)}`
export const exclude = (values, property) => xs => reject(xs, x => includes(values, x[property]))
export const stripTags = str => {
  if (!str) return ""
  return String(str).replace(/<\/?[^>]+>/g, "")
}
export const markdownToText = str => {
  return stripTags(formatMarkdownValue(str, "html"))
}
export const parseFieldASTsIntoArray = fieldASTs => {
  return map(flatMap(fieldASTs, "selectionSet.selections"), "name.value")
}
export const queriedForFieldsOtherThanBlacklisted = (fieldASTs, blacklistedFields) => {
  if (!fieldASTs) return true
  const queriedFields = parseFieldASTsIntoArray(fieldASTs)
  return difference(queriedFields, blacklistedFields).length > 0
}
export const queryContainsField = (fieldASTs, soughtField) => {
  return parseFieldASTsIntoArray(fieldASTs).includes(soughtField)
}
export const parseRelayOptions = options => {
  const { limit: size, offset } = getPagingParameters(options)
  const page = (size + offset) / size
  const gravityArgs = omit(options, ["first", "after", "last", "before"])
  return Object.assign({}, { page, size, offset }, gravityArgs)
}
