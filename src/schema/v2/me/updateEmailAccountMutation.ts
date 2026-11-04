import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { EmailAccountType } from "./emailAccount"

interface Input {
  id: string
  syncEnabled?: boolean
  shareContentWithPartner?: boolean
  captureSentMail?: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateEmailAccountSuccess",
  fields: () => ({
    emailAccount: {
      type: EmailAccountType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateEmailAccountFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateEmailAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "UpdateEmailAccountFailure"
    }
    return "UpdateEmailAccountSuccess"
  },
})

export const updateEmailAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdateEmailAccount",
  description: "Update the settings of a connected email account",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email account to update",
    },
    syncEnabled: {
      type: GraphQLBoolean,
      description: "Pause or resume syncing without disconnecting",
    },
    shareContentWithPartner: {
      type: GraphQLBoolean,
      description: "Let colleagues at the partner read message content",
    },
    captureSentMail: {
      type: GraphQLBoolean,
      description: "Also store mail sent from this mailbox",
    },
  },
  outputFields: {
    emailAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated email account",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, syncEnabled, shareContentWithPartner, captureSentMail },
    { updateEmailAccountLoader }
  ) => {
    if (!updateEmailAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // Gravity requires at least one setting and treats omitted ones as
    // unchanged, so explicit nulls are dropped too
    const settings: Record<string, boolean | undefined> = {
      sync_enabled: syncEnabled,
      share_content_with_partner: shareContentWithPartner,
      capture_sent_mail: captureSentMail,
    }
    const body = Object.fromEntries(
      Object.entries(settings).filter(([, value]) => value != null)
    )

    try {
      return await updateEmailAccountLoader(id, body)
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
