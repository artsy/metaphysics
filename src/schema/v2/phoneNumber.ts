import {
  GraphQLBoolean,
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
    internationalFormat: {
      type: GraphQLString,
      resolve: ({ parsedPhone, phoneUtil }) =>
        parsedPhone &&
        phoneUtil.format(parsedPhone, PhoneNumberFormat.INTERNATIONAL),
    },
    nationalFormat: {
      type: GraphQLString,
      resolve: ({ parsedPhone, phoneUtil }) =>
        parsedPhone &&
        phoneUtil.format(parsedPhone, PhoneNumberFormat.NATIONAL),
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

    /*
      Trying to parse phone number. If region code empty tries to parse phone
      number as a number already with region code, then tries to parse using
      most expectable regions.
    */
    for (const code of regionCode ? [regionCode] : ["", "us", "gb"]) {
      try {
        parsedPhone = phoneUtil.parse(phoneNumber, code)

        if (parsedPhone && phoneUtil.isValidNumber(parsedPhone)) {
          break
        } else if (!regionCode) {
          parsedPhone = undefined
        }
      } catch (e) {
        console.error("Parse phone number error: ", e)
      }
    }

    return {
      phoneNumber,
      parsedPhone,
      phoneUtil,
    }
  },
}
