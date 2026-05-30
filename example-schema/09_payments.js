const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * PAYMENTS — Transactions, subscriptions & mentor payouts
 *
 * Covers three flows:
 *  1. Student pays for a session / subscription (paymentType: "session" | "subscription")
 *  2. Platform settles earned amount to mentor (paymentType: "mentor_payout")
 *  3. Refunds when session is cancelled (paymentType: "refund")
 *
 * Design decisions:
 * - amountInPaise (smallest currency unit) avoids floating-point errors
 * - platformFeePercent + platformFeeAmount captured at transaction time
 *   (fee structure may change; don't rely on current config at query time)
 * - gateway sub-doc stores raw provider IDs for reconciliation
 * - statusHistory is append-only for full audit trail of payment transitions
 * - refund sub-doc links back to the original payment for traceability
 */

// ── Sub-schema: Gateway Details ───────────────────────────────────────────────
const GatewayDetailsSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["razorpay", "stripe", "paytm", "upi_manual", "internal"],
      required: true,
    },
    orderId: { type: String, default: null },        // Gateway order ID
    paymentId: { type: String, default: null },      // Gateway payment/txn ID
    payoutId: { type: String, default: null },       // For mentor payouts
    signature: { type: String, default: null, select: false }, // Webhook signature
    rawResponse: { type: Schema.Types.Mixed, default: null, select: false },
  },
  { _id: false }
);

// ── Sub-schema: Status History ────────────────────────────────────────────────
const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, maxlength: 300, default: null },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = system/webhook
    },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const PaymentSchema = new Schema(
  {
    // ─── Parties ──────────────────────────────────────────────────────────────
    payer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for platform-initiated payouts
      index: true,
    },
    payee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for student payments to platform
      index: true,
    },

    // ─── Payment Type ─────────────────────────────────────────────────────────
    paymentType: {
      type: String,
      required: true,
      enum: ["session", "subscription", "mentor_payout", "refund", "credit_purchase"],
      index: true,
    },

    // ─── Linked Entities ──────────────────────────────────────────────────────
    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      default: null,
      index: true,
    },
    doubtRequest: {
      type: Schema.Types.ObjectId,
      ref: "DoubtRequest",
      default: null,
    },

    // For refunds — points back to original payment
    originalPayment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // ─── Amount (always in smallest currency unit, e.g. paise for INR) ───────
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      match: [/^[A-Z]{3}$/, "Must be a valid ISO 4217 currency code"],
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },

    // Platform fee snapshot (captured at transaction time)
    platformFeePercent: { type: Number, default: 10, min: 0, max: 100 },
    platformFeeInPaise: { type: Number, default: 0, min: 0 },
    mentorEarningsInPaise: { type: Number, default: 0, min: 0 },

    // GST / tax breakdown (for Indian compliance)
    taxBreakdown: {
      gstPercent: { type: Number, default: 18 },
      gstAmountInPaise: { type: Number, default: 0 },
      tdsPercent: { type: Number, default: 0 },
      tdsAmountInPaise: { type: Number, default: 0 },
    },

    // ─── Subscription Details (if paymentType = subscription) ────────────────
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "pro", "enterprise", null],
        default: null,
      },
      periodStart: { type: Date, default: null },
      periodEnd: { type: Date, default: null },
      isRenewal: { type: Boolean, default: false },
    },

    // ─── Status ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        "initiated",
        "pending",
        "success",
        "failed",
        "refunded",
        "partially_refunded",
        "disputed",
        "cancelled",
      ],
      default: "initiated",
      index: true,
    },
    statusHistory: [StatusHistorySchema],

    // ─── Gateway Details ──────────────────────────────────────────────────────
    gateway: { type: GatewayDetailsSchema, default: null },

    // ─── Payout Details (mentor_payout type) ─────────────────────────────────
    payoutMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "wallet", null],
      default: null,
    },
    payoutInitiatedAt: { type: Date, default: null },
    payoutSettledAt: { type: Date, default: null },

    // ─── Notes ────────────────────────────────────────────────────────────────
    description: { type: String, maxlength: 500, default: "" },
    internalNote: { type: String, maxlength: 500, default: null, select: false },

    // ─── Invoice ──────────────────────────────────────────────────────────────
    invoiceNumber: { type: String, unique: true, sparse: true, default: null },
    invoiceUrl: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
PaymentSchema.index({ payer: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ payee: 1, paymentType: 1, status: 1 });
PaymentSchema.index({ session: 1, paymentType: 1 });
PaymentSchema.index({ status: 1, paymentType: 1, createdAt: -1 }); // Admin dashboard
PaymentSchema.index({ "gateway.paymentId": 1 }, { sparse: true });  // Webhook lookup
PaymentSchema.index({ invoiceNumber: 1 }, { sparse: true });

// ─── Virtual: amount in rupees (human-readable) ───────────────────────────────
PaymentSchema.virtual("amountInRupees").get(function () {
  return (this.amountInPaise / 100).toFixed(2);
});

// ─── Pre-save: append status to history ──────────────────────────────────────
PaymentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

module.exports = mongoose.model("Payment", PaymentSchema);
