import {
  GraphQLType,
  isEnumType,
  isInputObjectType,
  isListType,
  isScalarType,
} from "graphql"

export function printType(type: GraphQLType): string {
  if (isScalarType(type)) {
    return type.name
  } else if (isListType(type)) {
    return `[${printType(type.ofType)}]`
  } else if (isEnumType(type) || isInputObjectType(type)) {
    return type.name
  } else {
    throw new Error(`Unknown type: ${JSON.stringify(type)}`)
  }
}
