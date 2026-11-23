import { resolveBuyerAction } from "../utils/buyerAction"

type Participant = "buyer" | "seller"

const buildOrder = ({
  state = "submitted",
  from = "seller",
  definesTotal = false,
  offerAmountChanged = false,
  ...overrides
}: {
  state?: string
  from?: Participant
  definesTotal?: boolean
  offerAmountChanged?: boolean
  [key: string]: any
} = {}): any => ({
  mode: "offer",
  state,
  buyer_state: "submitted",
  last_submitted_offer: {
    id: "offer-2",
    amount_cents: 100,
    buyer_total_cents: null,
    currency_code: "USD",
    from_participant: from,
    note: null,
    shipping_total_cents: 20,
    tax_total_cents: 5,
    created_at: "2026-01-01T00:00:00Z",
    defines_total: definesTotal,
    offer_amount_changed: offerAmountChanged,
    responds_to_id: "offer-1",
  },
  ...overrides,
})

// Ported from Exchange spec/models/offer_spec.rb "#buyer_offer_action_type".
// Exchange derives defines_total/offer_amount_changed from responds_to; the
// REST JSON hands us the precomputed booleans, so each case sets them directly.
describe("resolveBuyerAction", () => {
  describe("when not responding to a previous offer", () => {
    it("returns null (defines_total and offer_amount_changed are false)", () => {
      const order = buildOrder({
        definesTotal: false,
        offerAmountChanged: false,
      })
      order.last_submitted_offer.responds_to_id = null
      expect(resolveBuyerAction(order)).toBeNull()
    })
  })

  describe("order state is submitted", () => {
    describe("last offer is from seller", () => {
      it("returns OFFER_ACCEPTED_CONFIRM_NEEDED when offer defines total without changing the amount", () => {
        expect(
          resolveBuyerAction(
            buildOrder({ definesTotal: true, offerAmountChanged: false })
          )
        ).toEqual("OFFER_ACCEPTED_CONFIRM_NEEDED")
      })

      it("returns OFFER_RECEIVED_CONFIRM_NEEDED when offer defines total and changes the amount", () => {
        expect(
          resolveBuyerAction(
            buildOrder({ definesTotal: true, offerAmountChanged: true })
          )
        ).toEqual("OFFER_RECEIVED_CONFIRM_NEEDED")
      })

      it("returns null when offer does not define total and does not change the amount", () => {
        expect(
          resolveBuyerAction(
            buildOrder({ definesTotal: false, offerAmountChanged: false })
          )
        ).toBeNull()
      })

      it("returns OFFER_RECEIVED when offer does not define total and changes the amount", () => {
        expect(
          resolveBuyerAction(
            buildOrder({ definesTotal: false, offerAmountChanged: true })
          )
        ).toEqual("OFFER_RECEIVED")
      })
    })

    describe("last offer is from buyer", () => {
      it.each([
        [true, false],
        [true, true],
        [false, false],
        [false, true],
      ])(
        "returns null (defines_total=%s, offer_amount_changed=%s)",
        (definesTotal, offerAmountChanged) => {
          expect(
            resolveBuyerAction(
              buildOrder({ from: "buyer", definesTotal, offerAmountChanged })
            )
          ).toBeNull()
        }
      )
    })
  })

  describe("order state is approved", () => {
    it.each([true, false])(
      "returns OFFER_ACCEPTED when last offer is from the buyer (defines_total=%s)",
      (definesTotal) => {
        expect(
          resolveBuyerAction(
            buildOrder({ state: "approved", from: "buyer", definesTotal })
          )
        ).toEqual("OFFER_ACCEPTED")
      }
    )

    it("returns PROVISIONAL_OFFER_ACCEPTED when last offer is from the seller and defines total", () => {
      expect(
        resolveBuyerAction(
          buildOrder({ state: "approved", from: "seller", definesTotal: true })
        )
      ).toEqual("PROVISIONAL_OFFER_ACCEPTED")
    })

    it("returns OFFER_ACCEPTED when last offer is from the seller and does not define total", () => {
      expect(
        resolveBuyerAction(
          buildOrder({ state: "approved", from: "seller", definesTotal: false })
        )
      ).toEqual("OFFER_ACCEPTED")
    })
  })

  describe("other order states", () => {
    it.each([
      "pending",
      "in_review",
      "processing_approval",
      "fulfilled",
      "canceled",
      "refunded",
    ])("returns null for state %s", (state) => {
      expect(
        resolveBuyerAction(
          buildOrder({ state, definesTotal: true, offerAmountChanged: true })
        )
      ).toBeNull()
    })
  })

  describe("PAYMENT_FAILED", () => {
    it("returns PAYMENT_FAILED when last_transaction_failed is true, regardless of state/offer", () => {
      expect(
        resolveBuyerAction(
          buildOrder({
            state: "approved",
            from: "buyer",
            last_transaction_failed: true,
            buyer_state: "approved",
          })
        )
      ).toEqual("PAYMENT_FAILED")
    })

    it("prefers last_transaction_failed over buyer_state when the key is present", () => {
      expect(
        resolveBuyerAction(
          buildOrder({
            last_transaction_failed: false,
            buyer_state: "payment_failed",
            offerAmountChanged: true,
          })
        )
      ).toEqual("OFFER_RECEIVED")
    })

    it("falls back to buyer_state payment_failed when last_transaction_failed is absent", () => {
      expect(
        resolveBuyerAction(buildOrder({ buyer_state: "payment_failed" }))
      ).toEqual("PAYMENT_FAILED")
    })
  })

  describe("null guards (Exchange returns nil before checking payment)", () => {
    it("returns null for buy mode orders", () => {
      expect(
        resolveBuyerAction(
          buildOrder({ mode: "buy", last_transaction_failed: true })
        )
      ).toBeNull()
    })

    it("returns null when there is no last submitted offer", () => {
      expect(
        resolveBuyerAction(
          buildOrder({
            last_submitted_offer: null,
            last_transaction_failed: true,
          })
        )
      ).toBeNull()
    })

    it("returns null when the order was not fetched as the buyer", () => {
      expect(
        resolveBuyerAction(
          buildOrder({
            buyer_state: undefined,
            seller_state: "offer_received",
            offerAmountChanged: true,
          })
        )
      ).toBeNull()
    })
  })
})
