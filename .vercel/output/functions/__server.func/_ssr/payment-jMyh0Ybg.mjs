import { J as Joi } from "../_libs/joi.mjs";
const markPaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amountPaid: Joi.number().positive().required(),
  paidDate: Joi.date().iso().default(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]),
  paymentMethod: Joi.string().valid("cash", "upi", "bank_transfer", "other").default("cash"),
  notes: Joi.string().max(500).allow("", null)
});
const markWaivedSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  notes: Joi.string().max(500).required().messages({
    "any.required": "Reason for waiver is required"
  })
});
export {
  markWaivedSchema as a,
  markPaymentSchema as m
};
