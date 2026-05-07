import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { date } from "../../fields/date"
import { ResolverContext } from "types/graphql"
import { ErrorsType } from "lib/gravityErrorHandler"

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
  internalID: {
    description: "A type-specific Gravity Mongo Document ID.",
    type: new GraphQLNonNull(GraphQLID),
    resolve: ({ _id }) => _id,
  },
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
      type: new GraphQLNonNull(GraphQLString),
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

export const SmsSecondFactorAttributes = new GraphQLInputObjectType({
  name: "SmsSecondFactorAttributes",
  fields: {
    countryCode: {
      type: GraphQLString,
    },
    phoneNumber: {
      type: GraphQLString,
    },
  },
})

export const AppSecondFactorAttributes = new GraphQLInputObjectType({
  name: "AppSecondFactorAttributes",
  fields: {
    name: {
      type: GraphQLString,
    },
  },
})

export const SmsSecondFactorMutationResponseOrErrorsType = new GraphQLNonNull(
  new GraphQLUnionType({
    name: "SmsSecondFactorOrErrorsUnion",
    types: [SmsSecondFactor, ErrorsType],
    resolveType: (data) => {
      if (data._id) {
        return SmsSecondFactor
      }
      return ErrorsType
    },
  })
)

export const AppSecondFactorMutationResponseOrErrorsType = new GraphQLNonNull(
  new GraphQLUnionType({
    name: "AppSecondFactorOrErrorsUnion",
    types: [AppSecondFactor, ErrorsType],
    resolveType: (data) => {
      if (data._id) {
        return AppSecondFactor
      }
      return ErrorsType
    },
  })
)

export const BackupSecondFactors = new GraphQLObjectType<any, ResolverContext>({
  name: "BackupSecondFactors",
  fields: {
    secondFactors: {
      type: new GraphQLNonNull(
        GraphQLList(new GraphQLNonNull(BackupSecondFactor))
      ),
    },
  },
})

export const BackupSecondFactorsMutationResponseOrErrorsType = new GraphQLNonNull(
  new GraphQLUnionType({
    name: "BackupSecondFactorsOrErrorsUnion",
    types: [BackupSecondFactors, ErrorsType],
    resolveType: (data) => {
      if (data.secondFactors) {
        return BackupSecondFactors
      }
      return ErrorsType
    },
  })
)

export const SecondFactorOrErrorsUnionType = new GraphQLNonNull(
  new GraphQLUnionType({
    name: "SecondFactorOrErrorsUnion",
    types: [AppSecondFactor, SmsSecondFactor, ErrorsType],
    resolveType: (data) => {
      if (data._id) {
        switch (data.type) {
          case "AppSecondFactor":
            return AppSecondFactor
          case "SmsSecondFactor":
            return SmsSecondFactor
        }
      }
      return ErrorsType
    },
  })
)
