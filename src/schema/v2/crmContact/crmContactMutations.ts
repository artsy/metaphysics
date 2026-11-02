import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMContactType, CRMContactTypeEnum } from "./crmContact"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const CRMContactEmailInputType = new GraphQLInputObjectType({
  name: "CRMContactEmailInput",
  fields: {
    address: { type: new GraphQLNonNull(GraphQLString) },
    isPrimary: {
      type: GraphQLBoolean,
      description: "At most one email may be primary",
    },
  },
})

const CRMContactLocationInputType = new GraphQLInputObjectType({
  name: "CRMContactLocationInput",
  fields: {
    countryCode: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ISO 3166-1 alpha-2 country code",
    },
    cityName: {
      type: GraphQLString,
      description: "Omit for a country-level location",
    },
    isPrimary: {
      type: GraphQLBoolean,
      description:
        "At most one location may be primary. The first one is primary by default.",
    },
  },
})

// Fields shared by create and update. Gravity ignores anything left out, so
// only what the client sent is forwarded.
const contactFields = {
  firstName: { type: GraphQLString },
  lastName: { type: GraphQLString },
  company: { type: GraphQLString },
  phone: {
    type: GraphQLString,
    description:
      "Stored as entered. Only numbers starting with `+` or `00` get a normalized phone.",
  },
  categories: {
    type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
    description:
      "Replaces the whole list on update. Unknown values are rejected.",
  },
  notes: { type: GraphQLString },
  assignedToUserID: {
    type: GraphQLString,
    description: "Must be a user who belongs to the contact's partner",
  },
}

const toGravityContactParams = (input: any) => ({
  first_name: input.firstName,
  last_name: input.lastName,
  company: input.company,
  phone: input.phone,
  categories: input.categories,
  notes: input.notes,
  assigned_to_user_id: input.assignedToUserID,
})

const CreateResponseOrErrorType = responseOrErrorType({
  name: "CreateCRMContact",
  payloadField: "crmContact",
  payloadType: CRMContactType,
})

export const createCRMContactMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateCRMContact",
  description:
    "Create a CRM contact. It needs at least one of firstName, lastName, company or an email. Creation is all-or-nothing: a failing email or location creates nothing.",
  inputFields: {
    partnerID: { type: new GraphQLNonNull(GraphQLString) },
    contactType: { type: new GraphQLNonNull(CRMContactTypeEnum) },
    ...contactFields,
    emails: {
      type: new GraphQLList(new GraphQLNonNull(CRMContactEmailInputType)),
    },
    locations: {
      type: new GraphQLList(new GraphQLNonNull(CRMContactLocationInputType)),
    },
  },
  outputFields: {
    crmContactOrError: {
      type: CreateResponseOrErrorType,
      description: "On success: the created contact",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, { createCrmContactLoader }) => {
    if (!createCrmContactLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      createCrmContactLoader({
        partner_id: input.partnerID,
        contact_type: input.contactType,
        ...toGravityContactParams(input),
        emails: input.emails?.map((email) => ({
          address: email.address,
          is_primary: email.isPrimary,
        })),
        locations: input.locations?.map((location) => ({
          country_code: location.countryCode,
          city_name: location.cityName,
          is_primary: location.isPrimary,
        })),
      })
    )
  },
})

const UpdateResponseOrErrorType = responseOrErrorType({
  name: "UpdateCRMContact",
  payloadField: "crmContact",
  payloadType: CRMContactType,
})

export const updateCRMContactMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCRMContact",
  description:
    "Update a CRM contact's own fields. Emails and locations have their own mutations, and a contact can't change partner.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the contact",
    },
    contactType: { type: CRMContactTypeEnum },
    ...contactFields,
  },
  outputFields: {
    crmContactOrError: {
      type: UpdateResponseOrErrorType,
      description: "On success: the updated contact",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, { updateCrmContactLoader }) => {
    if (!updateCrmContactLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmContactLoader(input.id, {
        contact_type: input.contactType,
        ...toGravityContactParams(input),
        // The request is serialized as a query string first, which drops empty
        // arrays. Send null so that an empty list actually clears categories.
        categories: input.categories?.length === 0 ? null : input.categories,
      })
    )
  },
})

const ArchiveResponseOrErrorType = responseOrErrorType({
  name: "ArchiveCRMContact",
  payloadField: "crmContact",
  payloadType: CRMContactType,
})

export const archiveCRMContactMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "ArchiveCRMContact",
  description:
    "Archive a CRM contact. Contacts can't be deleted, and an archived contact keeps its email addresses, so they can't be reused.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the contact",
    },
  },
  outputFields: {
    crmContactOrError: {
      type: ArchiveResponseOrErrorType,
      description: "On success: the archived contact",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { archiveCrmContactLoader }) => {
    if (!archiveCrmContactLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => archiveCrmContactLoader(id))
  },
})

const UnarchiveResponseOrErrorType = responseOrErrorType({
  name: "UnarchiveCRMContact",
  payloadField: "crmContact",
  payloadType: CRMContactType,
})

export const unarchiveCRMContactMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UnarchiveCRMContact",
  description: "Make an archived CRM contact active again",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the contact",
    },
  },
  outputFields: {
    crmContactOrError: {
      type: UnarchiveResponseOrErrorType,
      description: "On success: the unarchived contact",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { unarchiveCrmContactLoader }) => {
    if (!unarchiveCrmContactLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => unarchiveCrmContactLoader(id))
  },
})
