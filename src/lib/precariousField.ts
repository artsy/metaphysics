/**
 * TODO:
 * - Class ivars annotated with @internal should be updated when either of these
 *   get implemented:
 *   * https://github.com/Microsoft/TypeScript/issues/321
 *   * https://github.com/Microsoft/TypeScript/issues/5228
 * - Some code taken directly from graphql-js’ extendSchema module, which can be
 *   removed when this gets done https://github.com/graphql/graphql-js/pull/1331
 */

import {
  GraphQLFieldConfig,
  assertNullableType,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLUnionType,
  assertObjectType,
  GraphQLInterfaceType,
  GraphQLInterfaceTypeConfig,
  Thunk,
  GraphQLArgument,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldResolver,
} from "graphql"
import keyValMap from "graphql/jsutils/keyValMap"

export interface GraphQLErrorInterfaceTypeConfig
  extends GraphQLInterfaceTypeConfig<any, any> {
  /**
   * The error interface that this interface extends. This should correlate to
   * a runtime error subclass.
   */
  extendsInterface: GraphQLErrorInterfaceType
}

/**
 * An error interface that corresponds to a runtime error subclass.
 * 
 * Selecting on this interface in your GraphQL documents ensures you’ll always
 * be able to select these properties of an error.
 * 
 * @example
 * 
   ```ts
   class HTTPError extends Error {
     public readonly statusCode: number
 
     constructor(message: string, statusCode: number) {
       super(message)
       this.statusCode = statusCode
       Error.captureStackTrace(this, this.constructor)
     }
   }

   const HTTPErrorInterfaceType = new GraphQLErrorInterfaceType({
     name: "HTTPError",
     extendsInterface: ErrorInterfaceType,
     fields: {
       statusCode: {
         type: GraphQLInt,
       },
     },
   })
   ```
   
   ```graphql
   query {
     artistOrError {
       ... on HTTPError {
         message
         statusCode
       }
     }
   }
   ```
 */
export class GraphQLErrorInterfaceType extends GraphQLInterfaceType {
  /** @internal */
  _extendsInterface: GraphQLErrorInterfaceType

  constructor(config: GraphQLErrorInterfaceTypeConfig) {
    const { extendsInterface, ...superConfig } = config
    super({
      ...superConfig,
      fields: {
        ...resolveThunk(config.fields),
        ...interfaceToConfig(extendsInterface),
      },
    })
    this._extendsInterface = extendsInterface
  }
}

/**
 * The base error interface that all other error interfaces should extend and
 * your error types should implement.
 *
 * Selecting on this interface in your GraphQL documents ensures you’ll always
 * be able to select a `message` field that describes the error in a
 * human-readable form.
 * 
 * @example
 * 
   ```ts
   const ErrorInterfaceType = new GraphQLBaseErrorInterfaceType({
     name: "Error",
     fields: {
       message: {
         type: GraphQLString,
       },
     },
   })
   ```

   ```graphql
   query {
     artistOrError {
       ... on Error {
         message
       }
     }
   }
   ```
 */
export class GraphQLBaseErrorInterfaceType extends GraphQLErrorInterfaceType {
  constructor(config: GraphQLInterfaceTypeConfig<any, any>) {
    super({
      ...config,
      // This is just a hack around the superclass requiring an interface to
      // extend, in this case we just make that to be a copy of `this`, thus
      // when the superclass spreads the copy’s fields onto its fields, the end
      // result is the same as not having supplied a copy.
      extendsInterface: new GraphQLInterfaceType(
        config
      ) as GraphQLErrorInterfaceType,
    })
  }
}

export interface GraphQLErrorTypeConfig<E>
  extends Omit<GraphQLObjectTypeConfig<any, any>, "name"> {
  /**
   * The object type name. Defaults to the name of the `errorClass`.
   */
  name?: string

  /**
   * An error interface type that this concrete type implements.
   */
  errorInterface: GraphQLErrorInterfaceType

  /**
   * The runtime error class that corresponds to this concrete type.
   */
  errorClass: ErrorClass<E>

  /**
   * A callback function that is used to serialize the runtime error object to
   * data that the field resolvers can use.
   */
  toErrorData: ErrorDataFn<E>
}

/**
 * A concrete error type that correspond to a runtime error and implements an
 * error interface and all of its ancestors.
 *
 * @example
 *
   ```ts
   class HTTPWithRequestIDError extends HTTPError {
     public readonly requestID: string
 
     constructor(message: string, statusCode: number, requestID: string) {
       super(message, statusCode)
       this.requestID = requestID
       Error.captureStackTrace(this, this.constructor)
     }
   }
 
   const HTTPWithRequestIDErrorType = new GraphQLErrorType({
     errorClass: HTTPWithRequestIDError,
     errorInterface: HTTPErrorInterfaceType,
     toErrorData: error => ({
       message: error.message,
       statusCode: error.statusCode,
       requestID: error.requestID,
     }),
     fields: {
       message: {
         type: GraphQLString,
       },
       statusCode: {
         type: GraphQLInt,
       },
       requestID: {
         type: GraphQLString,
       },
     },
   })
   ```

   ```graphql
   query {
     artistOrError {
       ... on HTTPWithRequestIDError {
         message
         statusCode
         requestID
       }
     }
   }
   ```
 */
export class GraphQLErrorType<E extends Error> extends GraphQLObjectType {
  /** @internal */
  _errorClass: ErrorClass<E>
  /** @internal */
  _toErrorData: ErrorDataFn<E>

  constructor(config: GraphQLErrorTypeConfig<E>) {
    const {
      errorClass,
      toErrorData,
      errorInterface,
      interfaces,
      ...superConfig
    } = config
    super({
      name: errorClass.name,
      ...superConfig,
      interfaces: [
        errorInterface,
        ...interfaceAncestors(errorInterface),
        ...(resolveThunk(interfaces) || []),
      ],
    })
    this._errorClass = errorClass
    this._toErrorData = toErrorData
  }
}

export interface GraphQLPrecariousFieldConfig {
  /**
   * The name of the nullable field and the prefix of the error union field.
   */
  name: string

  /**
   * The concrete error types and their corresponding runtime errors that are
   * expected to occur and be handled. Any runtime errors that occur and are not
   * in this list will be re-thrown and result in traditional `GraphQLError`s.
   */
  errors: GraphQLErrorType<any>[]

  /**
   * The configuration of the field that will be used for both the nullable
   * field and the error union field.
   */
  field: GraphQLFieldConfig<any, any, any>
}

/**
 * Creates two versions of a field, one that returns `null` when any of the
 * expected errors occurs and another that returns a union of the field’s normal
 * type (the success type) and the various expected error types.
 * 
 * @example
 * 
   ```ts
   const artistFieldWithError: GraphQLFieldConfig<any, any, any> = {
     type: ArtistType,
     resolve: (_source, _args, context) => {
       if (context.succeed) {
         return { name: "picasso" }
       } else {
         if (context.unspecifiedError) {
           throw new Error("What is this?")
         } else {
           throw new HTTPWithRequestIDError("Oh noes", 401, "a-request-id")
         }
       }
     },
   }
 
   const schema = new GraphQLSchema({
     query: new GraphQLObjectType({
       name: "Query",
       fields: {
         ...precariousField({
           name: "artist",
           errors: [HTTPWithRequestIDErrorType],
           field: artistFieldWithError,
         }),
       },
     }),
   })
   ```
   
   ```graphql
   query {
     # Either ArtistType or null
     artist {
       name
     }
     # Either ArtistType or HTTPWithRequestIDErrorType
     artistOrError {
       # Use this to check if the result is a ArtistType
       __typename
       # On success the artist selection will be used
       ... on Artist {
         name
       }
       # On error, and when only interested in the generic fields provided by
       # the base error interface
       ... on Error {
         message
       }
       # On error, and when only interested in the generic fields provided by
       # another error interface
       ... on HTTPError {
         message
         statusCode
       }
       # On error, and when interested in all the fields provided by the
       # concrete error type
       ... on HTTPWithRequestIDError {
         message
         statusCode
         requestID
       }
     }
   }
   ```
 */
export function precariousField(
  config: GraphQLPrecariousFieldConfig
): {
  [key: string]: GraphQLFieldConfig<any, any, any>
} {
  if (!config.field.resolve) {
    throw new Error("The given field is expected to have a resolver.")
  }

  const fieldType = assertObjectType(assertNullableType(config.field.type))

  const union = new GraphQLUnionType({
    name: `${fieldType.name}OrError`,
    types: [fieldType, ...config.errors],
    resolveType: ({ __errorType }) => (__errorType ? __errorType : fieldType),
  })

  const resolver = (
    errorHandler: (error: Error, errorType: GraphQLErrorType<any>) => any
  ): GraphQLFieldResolver<any, any, any> => (...args) => {
    try {
      return config.field.resolve!(...args)
    } catch (error) {
      const errorType = config.errors.find(
        possibleError => error instanceof possibleError._errorClass
      )
      if (errorType) {
        return errorHandler(error, errorType)
      } else {
        throw error
      }
    }
  }

  return {
    [config.name]: {
      ...config.field,
      resolve: resolver(() => null),
    },
    [`${config.name}OrError`]: {
      ...config.field,
      type: union,
      resolve: resolver((error, errorType) => ({
        ...errorType._toErrorData(error),
        __errorType: errorType,
      })),
    },
  }
}

type ErrorClass<E> = new (...args: any[]) => E
type ErrorDataFn<E> = (error: E) => { [key: string]: any }

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

function resolveThunk<T>(input: Thunk<T>) {
  return input instanceof Function ? input() : input
}

function interfaceAncestors(errorInterface: GraphQLErrorInterfaceType) {
  const interfaces: GraphQLErrorInterfaceType[] = []
  let iface = errorInterface
  do {
    iface = iface._extendsInterface
    interfaces.push(iface)
  } while (!(iface instanceof GraphQLBaseErrorInterfaceType))
  return interfaces
}

function extendArgs(
  args: Array<GraphQLArgument>
): GraphQLFieldConfigArgumentMap {
  return keyValMap(
    args,
    arg => arg.name,
    arg => ({
      type: arg.type,
      defaultValue: arg.defaultValue,
      description: arg.description,
      astNode: arg.astNode,
    })
  )
}

function interfaceToConfig(interfaceType: GraphQLInterfaceType) {
  return keyValMap(
    Object.entries(interfaceType.getFields()),
    ([name]) => name,
    ([_name, { isDeprecated, args, ...fieldConfig }]) => ({
      ...fieldConfig,
      args: extendArgs(args),
    })
  )
}
