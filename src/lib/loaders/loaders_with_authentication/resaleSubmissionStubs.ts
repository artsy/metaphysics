import { HTTPError } from "lib/HTTPError"

// The stubs keep no state: each record is rebuilt from the artwork ID it was made for.

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

export const createResaleSubmissionStubLoaders = (userID: string) => ({
  // TODO: gravityLoader((id) => `me/resale_submission/${id}`)
  resaleSubmissionLoader: (id: string) => findResaleSubmission(id, userID),

  // TODO: gravityLoader("me/resale_submissions", {}, { headers: true })
  resaleSubmissionsLoader: (_options: {
    page: number
    size: number
    offset: number
    total_count: boolean
  }) =>
    Promise.resolve({
      body: [] as ResaleSubmissionRecord[],
      headers: { "x-total-count": "0" },
    }),
})
