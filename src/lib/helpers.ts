import {
  assign,
  camelCase,
  compact,
  flow,
  includes,
  isEmpty,
  isObject,
  isString,
  omit,
  reject,
  trim,
} from "lodash"
import now from "performance-now"
import { stringify } from "qs"
import { getPagingParameters, CursorPageable } from "relay-cursor-paging"
import { formatMarkdownValue } from "schema/v1/fields/markdown"

const loadNs = now()
const loadMs = Date.now()

export function timestamp() {
  return Math.round((loadMs + now() - loadNs) * 100000) / 100000
}

export function enhance(xs = [], source = {}) {
  return xs.map((x) => assign({}, source, x))
}

export const isExisty = (x) => {
  // Return false on empty Objects
  if (isObject(x) && isEmpty(x)) return false

  // Return false on empty Strings
  if (isString(x) && isEmpty(trim(x, " \n"))) return false

  // Intentional use of loose equality operator (Fogus)
  return x != null // eslint-disable-line eqeqeq
}

// Coerce a usable value or nothing at all
export const existyValue = (x) => {
  if (isExisty(x)) return x
}

export const capitalizeFirstCharacter = (x) =>
  x.charAt(0).toUpperCase() + x.slice(1)

export const classify = flow(camelCase, capitalizeFirstCharacter)

export const join = (by, xs) => compact(xs).join(by)

export const truncate = (string, length, append = "…") => {
  const x = string + ""
  const limit = ~~length
  return x.length > limit ? x.slice(0, limit) + append : x
}
export const toQueryString = (options = {}) =>
  /**
   * In the case of batched requests we want to explicitly _not_ sort the
   * params because the order matters to dataloader
   */
  // @ts-ignore
  options.batched
    ? stringify(options, {
        arrayFormat: "brackets",
      })
    : stringify(options, {
        arrayFormat: "brackets",
        sort: (a, b) => a.localeCompare(b),
      })
export const toKey = (path, options = {}) => `${path}?${toQueryString(options)}`
export const exclude = (values?: any[], property?: any) => (xs) =>
  reject(xs, (x) => includes(values, x[property]))
export const stripTags = (str?: string) => {
  if (!str) return ""
  return String(str).replace(/<\/?[^>]+>/g, "")
}
export const markdownToText = (str) => {
  return stripTags(formatMarkdownValue(str, "html"))
}

export const convertConnectionArgsToGravityArgs = <T extends CursorPageable>(
  options: T
): { page: number; size: number; offset: number } & T => {
  const { limit: size, offset } = getPagingParameters(options)
  // If a size of 0 explicitly requested, it doesn't really matter what
  // the page is.
  const page = size ? Math.round((size + offset) / size) : 1
  const gravityArgs = omit(options, ["first", "after", "last", "before"])
  return {
    ...gravityArgs,
    size: Number.isInteger(size) ? size : gravityArgs.size,
    page,
    offset,
  } as any
}

export const removeNulls = (object) => {
  Object.keys(object).forEach(
    (key) => object[key] == null && delete object[key]
  ) // eslint-disable-line eqeqeq, no-param-reassign, max-len
}
export const resolveBlueGreen = (
  resolveBlue: string,
  resolveGreen?: string,
  percentResolveGreen?: number
) => {
  if (resolveGreen && percentResolveGreen) {
    if (Math.random() <= percentResolveGreen / 100) {
      return resolveGreen
    }
  }
  return resolveBlue
}
