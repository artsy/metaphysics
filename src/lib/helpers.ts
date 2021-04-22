import { ConnectionArguments } from "graphql-relay"
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
  pick,
  reject,
  trim,
} from "lodash"
import moment, { LocaleSpecification } from "moment"
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

const HTML_ENTITIES = {
  "&amp;": "&",
  "&#38;": "&",
  "&lt;": "<",
  "&#60;": "<",
  "&gt;": ">",
  "&#62;": ">",
  "&apos;": "'",
  "&#39;": "'",
  "&quot;": '"',
  "&#34;": '"',
}

const HTML_ENTITIES_REGEX = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g

export const unescapeEntities = (str?: string) => {
  if (str === undefined) return ""
  return str.replace(HTML_ENTITIES_REGEX, (x) => HTML_ENTITIES[x])
}

export const markdownToText = (str: string) => {
  return stripTags(formatMarkdownValue(str, "html")).trim()
}

export const markdownToPlainText = (str: string) => {
  return unescapeEntities(markdownToText(str))
}

/**
 * Here we always return both a `page` and an `offset` — while either can (and are)
 * passed to Gravity. In this case `page` will take precedence and the `offset`
 * value can (and is) be  used as the `sliceStart` param for `connectionFromArraySlice`.
 */
export const convertConnectionArgsToGravityArgs = <T extends CursorPageable>(
  options: T
): {
  size: any
  page: number
  offset: number
} & Record<string, any> => {
  const { limit, offset } = getPagingParameters(options)

  const gravityArgs = omit(options, ["first", "after", "last", "before"])

  const size = Number.isInteger(limit) ? limit : gravityArgs.size

  if ("page" in options && typeof options.page === "number") {
    return {
      ...gravityArgs,
      size,
      page: options.page,
      offset: (options.page - 1) * size,
    }
  }

  // If a size of 0 explicitly requested, it doesn't really matter what
  // the page is.
  const page = size ? Math.round((size + offset) / size) : 1

  return {
    ...gravityArgs,
    size,
    page,
    offset,
  }
}

export const convertGravityToConnectionArgs = <
  T extends { page?: number; size?: number; offset?: number } & Partial<
    ConnectionArguments
  >
>(
  options: T
): ConnectionArguments => {
  if (!options.first && !options.last && options.size !== undefined) {
    return { first: options.size, ...pick(options, ["before", "after"]) }
  }

  return pick(options, ["first", "after", "last", "before"])
}

export const removeNulls = (object) => {
  Object.keys(object).forEach(
    (key) => object[key] == null && delete object[key]
  ) // eslint-disable-line eqeqeq, no-param-reassign, max-len
}

export const removeEmptyValues = (object) => {
  Object.keys(object).forEach(
    (key) =>
      (object[key] == null ||
        (Array.isArray(object[key]) && isEmpty(object[key]))) &&
      delete object[key]
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

/**
 * Uses `moment.defineLocale` to define a new locale, but it makes sure we revert to the locale we were before.
 * `defineLocale` normally activates the new locale, so we need to make sure we set it back to what it was.
 */
export const defineCustomLocale = (
  uniqueName: string,
  localeSpec: LocaleSpecification
) => {
  const currentLocale = moment.locale()
  moment.updateLocale(uniqueName, localeSpec)
  moment.locale(currentLocale)
}
