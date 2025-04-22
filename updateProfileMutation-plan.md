# Plan for Implementing `updateProfileMutation`

## Overview

The task is to implement an `updateProfileMutation` for updating a profile via GraphQL. Based on the REST endpoint documentation in `profiles_endpoint.txt`, we need to create a mutation that will allow users to update profile information such as handle, bio, website, etc.

## Implementation Details

### 1. File Structure

We'll create a new file at `/src/schema/v2/profile/updateProfileMutation.ts` (need to create the directory if it doesn't exist).

### 2. Required Loaders

- We need to implement an `updateProfileLoader` in the loaders_with_authentication/gravity.ts file similar to other update loaders.

### 3. Mutation Implementation

Based on the patterns seen in other mutations like `updatePartnerMutation.ts`:

1. Define the input interface with the fields from the endpoint documentation
2. Create success and failure types
3. Implement the mutation using `mutationWithClientMutationId`
4. Add proper error handling via `formatGravityError`

### 4. Testing

Create a test file at `/src/schema/v2/profile/__tests__/updateProfileMutation.test.ts`

## Implementation Steps

### Step 1: Add updateProfileLoader to gravity.ts

Add the following to the loaders_with_authentication/gravity.ts file:

```typescript
updateProfileLoader: gravityLoader(
  (id) => `profile/${id}`,
  {},
  { method: "PUT" }
),
```

### Step 2: Create updateProfileMutation.ts

Create the file with the following structure:

```typescript
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Profile from "../profile"
import { ResolverContext } from "types/graphql"

interface UpdateProfileMutationInputProps {
  id: string
  handle?: string | null
  bio?: string | null
  fullBio?: string | null
  website?: string | null
  location?: string | null
  isPrivate?: boolean | null
  menuColorClass?: string | null
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateProfileSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    profile: {
      type: Profile.type,
      resolve: (profile) => profile,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateProfileFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateProfileResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateProfileMutation = mutationWithClientMutationId<
  UpdateProfileMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateProfileMutation",
  description: "Updates a profile.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the profile to update.",
    },
    handle: {
      type: GraphQLString,
      description: "Unique handle.",
    },
    bio: {
      type: GraphQLString,
      description: "Short bio (275 character max).",
    },
    fullBio: {
      type: GraphQLString,
      description: "Full bio (800 character max).",
    },
    website: {
      type: GraphQLString,
      description: "Website.",
    },
    location: {
      type: GraphQLString,
      description: "Location.",
    },
    isPrivate: {
      type: GraphQLBoolean,
      description: "Private profiles hide certain features for non admins.",
    },
    menuColorClass: {
      type: GraphQLString,
      description: "Menu color class.",
    },
  },
  outputFields: {
    profileOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated profile. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      handle,
      bio,
      fullBio,
      website,
      location,
      isPrivate,
      menuColorClass,
    },
    { updateProfileLoader }
  ) => {
    if (!updateProfileLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const profileData = {
        handle,
        bio,
        full_bio: fullBio,
        website,
        location,
        private: isPrivate,
        menu_color_class: menuColorClass,
      }

      const response = await updateProfileLoader(id, profileData)
      return response
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
```

### Step 3: Create Test File

Create a test file with the following structure:

```typescript
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("updateProfileMutation", () => {
  it("updates a profile", async () => {
    const context = {
      updateProfileLoader: jest.fn().mockResolvedValue({
        _id: "profile123",
        id: "profile123",
        handle: "new-handle",
        bio: "New bio",
      }),
    }

    const mutation = gql`
      mutation {
        updateProfile(
          input: {
            id: "profile123"
            handle: "new-handle"
            bio: "New bio"
            fullBio: "Full biography text here"
            website: "http://example.com"
            location: "New York"
            isPrivate: true
            menuColorClass: "black"
          }
        ) {
          profileOrError {
            ... on UpdateProfileSuccess {
              profile {
                id
                handle
                bio
              }
            }
            ... on UpdateProfileFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(mutation, context)
    expect(context.updateProfileLoader).toHaveBeenCalledWith("profile123", {
      handle: "new-handle",
      bio: "New bio",
      full_bio: "Full biography text here",
      website: "http://example.com",
      location: "New York",
      private: true,
      menu_color_class: "black",
    })

    expect(data.updateProfile.profileOrError.profile.id).toBe("profile123")
    expect(data.updateProfile.profileOrError.profile.handle).toBe("new-handle")
    expect(data.updateProfile.profileOrError.profile.bio).toBe("New bio")
  })

  it("returns an error if the mutation fails", async () => {
    const context = {
      updateProfileLoader: jest.fn().mockRejectedValue(
        new Error(
          JSON.stringify({
            type: "param_error",
            message: "Handle already taken",
            detail: "The handle is already in use by another profile",
          })
        )
      ),
    }

    const mutation = gql`
      mutation {
        updateProfile(
          input: {
            id: "profile123"
            handle: "existing-handle"
          }
        ) {
          profileOrError {
            ... on UpdateProfileSuccess {
              profile {
                id
              }
            }
            ... on UpdateProfileFailure {
              mutationError {
                message
                type
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data.updateProfile.profileOrError.mutationError.type).toBe("param_error")
    expect(data.updateProfile.profileOrError.mutationError.message).toBe("Handle already taken")
  })
})
```

### Step 4: Export the Mutation

After implementing the mutation, make sure it's properly exported and available in the schema:

1. Add an export in the profile/index.ts file (create it if it doesn't exist):

```typescript
export { updateProfileMutation } from "./updateProfileMutation"
```

2. Add the mutation to the schema.ts file in the mutations section:

```typescript
// In src/schema/v2/schema.ts
import { updateProfileMutation } from "./profile"

// Add to the mutation fields:
updateProfile: updateProfileMutation,
```

### Step 5: Update the Schema Definition

Once the mutation is implemented and added to the schema, you need to update the schema definition file by running:

```bash
yarn dump:local
```

This generates the updated schema definition file with the new mutation included, ensuring that clients can discover and use the new mutation.

### Step 6: Create a Commit and PR

After implementing and testing the mutation, create a commit and PR following the project conventions:

1. Rename the current branch to include your GitHub username prefix:
```bash
git branch -m jonallured/chore-add-mutation-to-update-profiles
```

2. Verify the branch name is correct:
```bash
git branch
```

3. Stage your changes:
```bash
git add .
```

4. Create a commit with a descriptive message following the conventional commit format:
```bash
git commit -m "chore: Add mutation to update profiles"
```

5. Push your branch to the upstream GitHub repository:
```bash
git push -u upstream jonallured/chore-add-mutation-to-update-profiles
```

6. Create a PR on GitHub with:
   - Title: "chore: Add mutation to update profiles"
   - Description: Explain that this PR adds a new mutation to update profile records in the API, based on the REST endpoint documented in profiles_endpoint.txt
   - Request review from the appropriate team members: @artsy/amber-devs
   - Base branch: `main` in the artsy/metaphysics repository

## Conclusion

This implementation follows the pattern observed in the referenced PRs and existing code:

1. We add a loader function in gravity.ts
2. Create a mutation file with input types, success/failure handling
3. Add tests for the mutation
4. Export and add to the schema
5. Update the schema definition file with yarn dump:local
6. Create a commit with conventional commit format (chore: prefix)
7. Create a PR with appropriate title, description, and reviewers

The mutation will allow users to update profile fields as specified in the profiles_endpoint.txt document, using camelCase for input fields to match the project's conventions.