import { Array, Record, Number, String, Boolean, Null, Static } from "runtypes"

export const EditionSet = Record({
  id: String,
  size_score: Number.Or(Null),
  forsale: Boolean,
  sold: Boolean,
  price: String,
  price_cents: Array(Number.Or(Null)).Or(Null),
  acquireable: Boolean,
  offerable: Boolean,
  offerable_from_inquiry: Boolean,
  dimensions: Record({ in: String.Or(Null), cm: String.Or(Null) }),
  editions: String,
  display_price_currency: String,
  availability: String,
  availability_hidden: Boolean,
})

export type EditionSet = Static<typeof EditionSet>
