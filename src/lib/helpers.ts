import { ConnectionArguments } from "graphql-relay"
import {
  assign,
  camelCase,
  compact,
  flow,
  includes,
  isArray,
  isEmpty,
  isObject,
  isString,
  mapKeys,
  omit,
  pick,
  reject,
  snakeCase,
  trim,
  values,
} from "lodash"
import moment, { LocaleSpecification } from "moment"
import { performance } from "perf_hooks"
import { stringify } from "qs"
import { CursorPageable, getPagingParameters } from "relay-cursor-paging"
import { formatMarkdownValue } from "schema/v2/fields/markdown"
import { emptyConnection } from "schema/v2/fields/pagination"

// These default values are only necessary due to caching issues in Gravity.
// Normally Gravity should always send values for these preferences.
export const DEFAULT_CURRENCY_PREFERENCE = "USD"
export const DEFAULT_LENGTH_UNIT_PREFERENCE = "in"

const loadNs = performance.now()
const loadMs = Date.now()

export function timestamp() {
  return Math.round((loadMs + performance.now() - loadNs) * 100000) / 100000
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
export const existyValue = <T>(x: T): T | undefined => {
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

export const toQueryString = (options = {}) => {
  const optionsIncludeArray = values(options).some(
    (value) => isArray(value) && !isEmpty(value)
  )

  /**
   * In the case of batched requests or if the params include an array
   * we want to explicitly _not_ sort the
   * params because the order matters to dataloader
   */
  // @ts-ignore
  return options.batched || optionsIncludeArray
    ? stringify(options, {
        arrayFormat: "indices",
      })
    : stringify(options, {
        arrayFormat: "indices",
        sort: (a, b) => a.localeCompare(b),
      })
}

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
      offset: (options.page - 1) * size || 0,
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

/**
 * Extracts nodes from a GraphQL connection.
 */
export const extractNodes = <Node extends Record<string, unknown>, T = Node>(
  connection:
    | {
        readonly edges?: ReadonlyArray<{
          readonly node?: Node | null
        } | null> | null
      }
    | undefined
    | null,
  mapper?: (node?: Node | null) => T
): T[] => {
  return (
    connection?.edges
      ?.map((edge) => (mapper ? (mapper(edge?.node) as any) : edge?.node))
      .filter((x) => x != null) ?? []
  )
}

export const isInteger = (str: string) => {
  const num = parseInt(str, 10)
  return !isNaN(num) && str.trim() === num.toString() && Number.isInteger(num)
}

// For some users with no favourites, Gravity can return a 404 (which reflects the
// `saved-artwork` collection doesn't exist). In this case we'll return an empty list.
// Otherwise, re-throw the error.
export const CatchCollectionNotFoundException = (error) => {
  if (error.statusCode === 404) return emptyConnection

  throw error
}

/**
 * Converts all keys in an object to camel case.
 * @param object — The object to convert.
 * @return — Returns the object with converted keys.
 */
export const camelCaseKeys = (
  obj: Record<string, any>
): Record<string, any> => {
  return mapKeys(obj, (_, key) => {
    // Special case for ID to not be converted to I_D
    if (key.includes("_id")) {
      return camelCase(key.replace(/id/g, "ID"))
    }

    return camelCase(key)
  })
}

/**
 * Converts all object keys to snake case.
 * @param object — The object to convert.
 * @return — Returns the object with converted keys.
 */
export const snakeCaseKeys = (
  obj: Record<string, any>
): Record<string, any> => {
  return mapKeys(obj, (_, key) => {
    // Special case for ID to not be converted to I_D
    if (key.includes("ID")) {
      return snakeCase(key.replace(/ID/g, "_id"))
    }

    return snakeCase(key)
  })
}
