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
} from "graphql"
import keyValMap from "graphql/jsutils/keyValMap"

// TODO: Inflect actual Error subclass and pass to ErrorDataFn
type ErrorClass = new (...args: any[]) => Error
type ErrorDataFn = (error: any) => { [key: string]: any }

function thunk<T>(input: Thunk<T>) {
  return input instanceof Function ? input() : input
}

// TODO: Taken from extendSchema
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

export const ErrorInterfaceType = new GraphQLInterfaceType({
  name: "Error",
  fields: {
    message: {
      type: GraphQLString,
    },
  },
})

export interface GraphQLErrorInterfaceTypeConfig<TSource = any, TContext = any>
  extends GraphQLInterfaceTypeConfig<TSource, TContext> {
  extends?: GraphQLErrorInterfaceType[]
}

export class GraphQLErrorInterfaceType extends GraphQLInterfaceType {
  constructor(config: GraphQLErrorInterfaceTypeConfig) {
    const _extends = [...(config.extends || []), ErrorInterfaceType]
    super({
      ...config,
      fields: () => ({
        ...thunk(config.fields),
        ..._extends.reduce(
          (allFields, errorInterface) => ({
            ...allFields,
            ...keyValMap(
              Object.entries(errorInterface.getFields()),
              ([name]) => name,
              ([_name, { isDeprecated, args, ...fieldConfig }]) => ({
                ...fieldConfig,
                args: extendArgs(args),
              })
            ),
          }),
          {}
        ),
      }),
    })
  }
}

export interface GraphQLErrorTypeConfig<TSource = any, TContext = any>
  extends GraphQLObjectTypeConfig<TSource, TContext> {
  errorClass: ErrorClass
  toErrorData: ErrorDataFn
}

export class GraphQLErrorType extends GraphQLObjectType {
  _errorClass: ErrorClass
  _toErrorData: ErrorDataFn

  constructor(config: GraphQLErrorTypeConfig) {
    const interfaces = thunk(config.interfaces) || []
    super({ ...config, interfaces: [...interfaces, ErrorInterfaceType] })
    this._errorClass = config.errorClass
    this._toErrorData = config.toErrorData
  }
}

export function precariousField(
  fieldName: string,
  possibleErrors: GraphQLErrorType[],
  fieldWithError: GraphQLFieldConfig<any, any, any>
): { [key: string]: GraphQLFieldConfig<any, any, any> } {
  if (!fieldWithError.resolve) {
    throw new Error("The given field is expected to have a resolver.")
  }
  const fieldType = assertObjectType(assertNullableType(fieldWithError.type))
  const union = new GraphQLUnionType({
    name: `${fieldType.name}OrError`,
    types: [fieldType, ...possibleErrors],
    resolveType: ({ __errorType }) => (__errorType ? __errorType : fieldType),
  })
  return {
    [fieldName]: {
      ...fieldWithError,
      resolve: (...args) => {
        try {
          return fieldWithError.resolve!(...args)
          // TODO: Limit to the expected error type
        } catch (error) {
          return null
        }
      },
    },
    [`${fieldName}OrError`]: {
      ...fieldWithError,
      type: union,
      resolve: (...args) => {
        try {
          return fieldWithError.resolve!(...args)
        } catch (error) {
          const errorType = possibleErrors.find(
            possibleError => error instanceof possibleError._errorClass
          )
          if (errorType) {
            return { ...errorType._toErrorData(error), __errorType: errorType }
          } else {
            throw error
          }
        }
      },
    },
  }
}
