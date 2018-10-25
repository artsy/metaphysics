import {
  GraphQLFieldConfig,
  assertNullableType,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLUnionType,
  assertObjectType,
  GraphQLInterfaceType,
  GraphQLString,
  GraphQLInterfaceTypeConfig,
  Thunk,
  GraphQLArgument,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldResolver,
} from "graphql"
import keyValMap from "graphql/jsutils/keyValMap"

function resolveThunk<T>(input: Thunk<T>) {
  return input instanceof Function ? input() : input
}

// TODO: Taken from extendSchema, can all be removed when/if this gets merged:
// https://github.com/graphql/graphql-js/pull/1331
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

export const ErrorInterfaceType = new GraphQLInterfaceType({
  name: "Error",
  fields: {
    message: {
      type: GraphQLString,
    },
  },
})

export interface GraphQLErrorInterfaceTypeConfig
  extends GraphQLInterfaceTypeConfig<any, any> {
  extends?: GraphQLErrorInterfaceType[]
}

export class GraphQLErrorInterfaceType extends GraphQLInterfaceType {
  constructor(config: GraphQLErrorInterfaceTypeConfig) {
    const { extends: _extendsInterfaces, ...superConfig } = config
    const extendsInterfaces = [
      ...(_extendsInterfaces || []),
      ErrorInterfaceType,
    ]
    const fields = extendsInterfaces.reduce(
      (fields, errorInterface) => ({
        ...fields,
        ...interfaceToConfig(errorInterface),
      }),
      resolveThunk(config.fields)
    )
    super({ ...superConfig, fields })
  }
}

type ErrorClass<E> = new (...args: any[]) => E
type ErrorDataFn<E> = (error: E) => { [key: string]: any }

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export interface GraphQLErrorTypeConfig<E>
  extends Omit<GraphQLObjectTypeConfig<any, any>, "name"> {
  name?: string
  errorClass: ErrorClass<E>
  toErrorData: ErrorDataFn<E>
}

export class GraphQLErrorType<E extends Error> extends GraphQLObjectType {
  _errorClass: ErrorClass<E>
  _toErrorData: ErrorDataFn<E>

  constructor(config: GraphQLErrorTypeConfig<E>) {
    const { errorClass, toErrorData, interfaces, ...superConfig } = config
    super({
      name: errorClass.name,
      ...superConfig,
      interfaces: [...(resolveThunk(interfaces) || []), ErrorInterfaceType],
    })
    this._errorClass = errorClass
    this._toErrorData = toErrorData
  }
}

export interface GraphQLPrecariousFieldConfig {
  name: string
  errors: GraphQLErrorType<any>[]
  field: GraphQLFieldConfig<any, any, any>
}

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
