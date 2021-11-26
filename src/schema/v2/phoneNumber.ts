import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  PhoneNumberUtil,
  PhoneNumber as GooglePhoneNumber,
  PhoneNumberFormat,
} from "google-libphonenumber"

interface PhoneNumberTypeSource {
  phoneNumber: string
  parsedPhone?: GooglePhoneNumber
  phoneUtil: PhoneNumberUtil
}

export const PhoneNumberFormats = {
  type: new GraphQLEnumType({
    name: "PhoneNumberFormats",
    values: {
      INTERNATIONAL: {
        value: PhoneNumberFormat.INTERNATIONAL,
      },
      E164: {
        value: PhoneNumberFormat.E164,
      },
      NATIONAL: {
        value: PhoneNumberFormat.NATIONAL,
      },
      RFC3966: {
        value: PhoneNumberFormat.RFC3966,
      },
    },
  }),
}

const PhoneNumberType: GraphQLObjectType<
  PhoneNumberTypeSource,
  ResolverContext
> = new GraphQLObjectType<PhoneNumberTypeSource, ResolverContext>({
  name: "PhoneNumberType",
  fields: {
    isValid: {
      type: GraphQLBoolean,
      resolve: ({ parsedPhone, phoneUtil }) =>
        parsedPhone ? phoneUtil.isValidNumber(parsedPhone) : false,
    },
    errorMessage: {
      type: GraphQLString,
      resolve: ({ parsedPhone, phoneUtil }) => {
        if (parsedPhone) {
          switch (phoneUtil.isPossibleNumberWithReason(parsedPhone)) {
            case PhoneNumberUtil.ValidationResult.TOO_SHORT:
              return "Too short"

            case PhoneNumberUtil.ValidationResult.TOO_LONG:
              return "Too long"

            case PhoneNumberUtil.ValidationResult.INVALID_COUNTRY_CODE:
              return "Invalid country code"
          }

          if (!phoneUtil.isValidNumber(parsedPhone)) {
            return "Invalid number"
          }
        }
      },
    },
    originalNumber: {
      type: GraphQLString,
      resolve: ({ phoneNumber }) => phoneNumber,
    },
    countryCode: {
      type: GraphQLString,
      resolve: ({ parsedPhone }) => parsedPhone?.getCountryCode(),
    },
    regionCode: {
      type: GraphQLString,
      resolve: ({ parsedPhone, phoneUtil }) =>
        parsedPhone && phoneUtil.getRegionCodeForNumber(parsedPhone),
    },
    display: {
      type: GraphQLString,
      args: {
        format: PhoneNumberFormats,
      },
      resolve: ({ parsedPhone, phoneUtil }, { format }) =>
        parsedPhone && phoneUtil.format(parsedPhone, format),
    },
  },
})

export const PhoneNumber: GraphQLFieldConfig<any, ResolverContext> = {
  type: PhoneNumberType,
  description: "Phone number information",
  args: {
    phoneNumber: {
      type: new GraphQLNonNull(GraphQLString),
    },
    regionCode: {
      type: GraphQLString,
    },
  },
  resolve: (_, { phoneNumber, regionCode }) => {
    const phoneUtil = PhoneNumberUtil.getInstance()
    let parsedPhone: GooglePhoneNumber | undefined

    try {
      parsedPhone = phoneUtil.parse(phoneNumber, regionCode || "")
    } catch (e) {
      console.error("Parse phone number error: ", e)
    }

    return {
      phoneNumber,
      parsedPhone,
      phoneUtil,
    }
  },
}
