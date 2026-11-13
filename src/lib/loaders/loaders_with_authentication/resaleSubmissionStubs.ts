import { HTTPError } from "lib/HTTPError"

// Stand-ins for Gravity's ResaleSubmission endpoints, which don't exist yet.
// They keep no state: each record is rebuilt from the artwork ID it was made for.

export type ResaleSubmissionChannel = "marketplace" | "auction"

export type ResaleSubmissionRequirement =
  | "price_listed_minor"
  | "packaging"
  | "packer"
  | "courier_handoff"

export interface ResaleSubmissionRecord {
  id: string
  user_id: string
  submitted_artwork_id: string
  state: "accepted" | "listed" | "auction_review" | "canceled" | "rejected"
  channel: ResaleSubmissionChannel | null
  rejection_reasons: string[]
  price_currency_code: string
  recommended_price_min_minor: number | null
  recommended_price_max_minor: number | null
  price_listed_minor: number | null
  packaging: string | null
  packer: string | null
  courier_handoff: string | null
  missing_requirements: ResaleSubmissionRequirement[]
  ready_to_list: boolean
  created_at: string
  updated_at: string
  canceled_at: string | null
  _submitted_artwork?: any
}

export type ResaleSubmissionUpdate = Partial<
  Pick<
    ResaleSubmissionRecord,
    "price_listed_minor" | "packaging" | "packer" | "courier_handoff"
  >
>

const STUB_ID_PREFIX = "stub-"
const STUB_TIMESTAMP = "2026-11-01T00:00:00.000Z"
const MARKETPLACE_PRICE_RANGE_MINOR = { min: 280000, max: 360000 }

const REQUIREMENTS_BY_CHANNEL: Record<
  ResaleSubmissionChannel,
  ResaleSubmissionRequirement[]
> = {
  marketplace: ["price_listed_minor", "packaging", "packer", "courier_handoff"],
  auction: [],
}

const UPDATABLE_FIELDS: (keyof ResaleSubmissionUpdate)[] = [
  "price_listed_minor",
  "packaging",
  "packer",
  "courier_handoff",
]

const isEvenHexDigit = (digit: string) => parseInt(digit, 16) % 2 === 0

// Mirror Eigen's placeholders (isWorkSellable, getSellChannel) so both sides agree.
const isSellable = (artworkID: string) => isEvenHexDigit(artworkID.slice(-1))
const isMarketplace = (artworkID: string) =>
  isEvenHexDigit(artworkID.slice(-2, -1))

const withRequirements = (
  record: ResaleSubmissionRecord
): ResaleSubmissionRecord => {
  const required = record.channel ? REQUIREMENTS_BY_CHANNEL[record.channel] : []
  const missing = required.filter((field) => record[field] == null)

  return {
    ...record,
    missing_requirements: missing,
    ready_to_list: record.channel === "marketplace" && missing.length === 0,
  }
}

export const buildResaleSubmission = (
  artworkID: string,
  userID: string
): ResaleSubmissionRecord => {
  const sellable = isSellable(artworkID)
  const channel: ResaleSubmissionChannel | null = !sellable
    ? null
    : isMarketplace(artworkID)
    ? "marketplace"
    : "auction"
  const hasRange = channel === "marketplace"

  return withRequirements({
    id: `${STUB_ID_PREFIX}${artworkID}`,
    user_id: userID,
    submitted_artwork_id: artworkID,
    state: sellable ? "accepted" : "rejected",
    channel,
    rejection_reasons: sellable ? [] : ["outside_us"],
    price_currency_code: "USD",
    recommended_price_min_minor: hasRange
      ? MARKETPLACE_PRICE_RANGE_MINOR.min
      : null,
    recommended_price_max_minor: hasRange
      ? MARKETPLACE_PRICE_RANGE_MINOR.max
      : null,
    price_listed_minor: null,
    packaging: null,
    packer: null,
    courier_handoff: null,
    missing_requirements: [],
    ready_to_list: false,
    created_at: STUB_TIMESTAMP,
    updated_at: STUB_TIMESTAMP,
    canceled_at: null,
  })
}

const findResaleSubmission = (id: string, userID: string) => {
  if (!id.startsWith(STUB_ID_PREFIX)) {
    return Promise.reject(
      new HTTPError("Resale submission not found", 404, {
        error: "Resale submission not found",
      })
    )
  }

  return Promise.resolve(
    buildResaleSubmission(id.slice(STUB_ID_PREFIX.length), userID)
  )
}

export const createResaleSubmissionStubLoaders = (
  userID: string,
  myCollectionArtworksLoader: (
    options: Record<string, unknown>
  ) => Promise<{ body: any[]; headers: Record<string, string> }>
) => ({
  // TODO: gravityLoader((id) => `resale_submission/${id}`)
  resaleSubmissionLoader: (id: string) => findResaleSubmission(id, userID),

  // TODO: gravityLoader("resale_submission", {}, { method: "POST" })
  createResaleSubmissionLoader: ({ artwork_id }: { artwork_id: string }) =>
    Promise.resolve(buildResaleSubmission(artwork_id, userID)),

  // TODO: gravityLoader((id) => `resale_submission/${id}`, {}, { method: "PUT" })
  updateResaleSubmissionLoader: async (
    id: string,
    update: ResaleSubmissionUpdate
  ) => {
    const record = await findResaleSubmission(id, userID)

    if (record.state === "rejected") {
      throw new HTTPError(
        "A rejected resale submission can't be updated",
        422,
        {
          error: "A rejected resale submission can't be updated",
        }
      )
    }

    const changes: ResaleSubmissionUpdate = {}
    UPDATABLE_FIELDS.forEach((field) => {
      if (update[field] !== undefined) {
        ;(changes as Record<string, unknown>)[field] = update[field]
      }
    })

    return withRequirements({ ...record, ...changes })
  },

  // TODO: gravityLoader("me/resale_submissions", {}, { headers: true })
  resaleSubmissionsLoader: async (options: {
    page: number
    size: number
    offset: number
    total_count?: boolean
  }) => {
    const { body, headers } = await myCollectionArtworksLoader({
      ...options,
      user_id: userID,
      private: true,
      all: true,
      sort: "-position",
    })

    return {
      body: body.map((artwork) => ({
        ...buildResaleSubmission(artwork._id, userID),
        _submitted_artwork: artwork,
      })),
      headers,
    }
  },
})
