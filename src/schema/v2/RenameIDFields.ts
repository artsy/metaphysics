import { isNullableType } from "graphql"
import {
  GravityIDFields,
  InternalIDFields,
  NullableIDField,
} from "../object_identification"
import { RenameFields } from "./RenameFields"

export class RenameIDFields extends RenameFields {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    allowedGravityTypesWithNullableIDField: string[],
    allowedNonGravityTypesWithNullableIDField: string[],
    stitchedTypePrefixes: string[],
    filterIDFieldFromTypes: string[]
  ) {
    const allowedTypesWithNullableIDField = [
      ...allowedGravityTypesWithNullableIDField,
      ...allowedNonGravityTypesWithNullableIDField,
    ]
    super((type, field) => {
      if (field.name === "id") {
        if (filterIDFieldFromTypes.includes(type.name)) {
          return null
        } else {
          if (
            isNullableType(field.type) &&
            !allowedTypesWithNullableIDField.includes(type.name)
          ) {
            throw new Error(`Do not add new nullable id fields (${type.name})`)
          } else {
            if (
              field.description === GravityIDFields.id.description ||
              (field.description === NullableIDField.id.description &&
                allowedGravityTypesWithNullableIDField.includes(type.name))
            ) {
              return "gravityID"
            } else if (
              field.description === InternalIDFields.id.description ||
              (field.description === NullableIDField.id.description &&
                allowedNonGravityTypesWithNullableIDField.includes(
                  type.name
                )) ||
              stitchedTypePrefixes.some(prefix => type.name.startsWith(prefix))
            ) {
              return "internalID"
            } else {
              throw new Error(`Do not add new id fields (${type.name})`)
            }
          }
        }
      } else if (field.name === "_id") {
        return "internalID"
      } else if (field.name === "__id") {
        return "id"
      }
      return undefined
    })
  }
}
