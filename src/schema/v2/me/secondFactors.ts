import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { GravityIDFields } from "../object_identification"
import { date } from "../fields/date"

export const SecondFactorKind = new GraphQLEnumType({
  name: "SecondFactorKind",
  values: {
    app: {
      value: "app",
    },
    backup: {
      value: "backup",
    },
    sms: {
      value: "sms",
    },
  },
})

interface SharedGravityJSONFields {
  enabled_at: string
  disabled_at: string
  type: string
  _id: string
}
const sharedFields = {
  ...GravityIDFields,
  enabled: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: ({ enabled_at }) => !!enabled_at,
  },
  enabledAt: date(({ enabled_at }: { enabled_at: string }) => enabled_at),
  disabledAt: date(({ disabled_at }: { disabled_at: string }) => disabled_at),
  kind: {
    type: new GraphQLNonNull(SecondFactorKind),
    resolve: ({ type }) => {
      switch (type) {
        case "AppSecondFactor":
          return "app"
        case "SmsSecondFactor":
          return "sms"
        case "BackupSecondFactor":
          return "backup"
      }
    },
  },
}

export const SecondFactorInterface = new GraphQLInterfaceType({
  name: "SecondFactor",
  fields: sharedFields,
  resolveType: (value) => {
    return value.type
  },
})

interface AppSecondFactorGravityJSONFields extends SharedGravityJSONFields {
  otp_provisioning_uri: string
  otp_secret: string
  name: string
}
export const AppSecondFactor = new GraphQLObjectType<
  AppSecondFactorGravityJSONFields
>({
  interfaces: [SecondFactorInterface],
  name: "AppSecondFactor",
  fields: {
    ...sharedFields,
    name: {
      type: GraphQLString,
    },
    otpProvisioningURI: {
      type: GraphQLString,
      resolve: ({ otp_provisioning_uri }) => otp_provisioning_uri,
    },
    otpSecret: {
      type: GraphQLString,
      resolve: ({ otp_secret }) => otp_secret,
    },
  },
})

interface BackupSecondFactorGravityJSONFields extends SharedGravityJSONFields {
  code: string
}
export const BackupSecondFactor = new GraphQLObjectType<
  BackupSecondFactorGravityJSONFields
>({
  interfaces: [SecondFactorInterface],
  name: "BackupSecondFactor",
  fields: {
    ...sharedFields,
    code: {
      type: GraphQLString,
    },
  },
})

interface SmsSecondFactorGravityJSONFields extends SharedGravityJSONFields {
  country_code: string
  formatted_phone_number: string
  phone_number: string
}
export const SmsSecondFactor = new GraphQLObjectType<
  SmsSecondFactorGravityJSONFields
>({
  interfaces: [SecondFactorInterface],
  name: "SmsSecondFactor",
  fields: {
    ...sharedFields,
    countryCode: {
      type: GraphQLString,
      resolve: ({ country_code }) => country_code,
    },
    formattedPhoneNumber: {
      type: GraphQLString,
      resolve: ({ formatted_phone_number }) => formatted_phone_number,
    },
    phoneNumber: {
      type: GraphQLString,
      resolve: ({ phone_number }) => phone_number,
    },
  },
})
