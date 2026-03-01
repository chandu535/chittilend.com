import Joi from 'joi';

export const markPaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amountPaid: Joi.number().positive().required(),
  paidDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  paymentMethod: Joi.string().valid('cash', 'upi', 'bank_transfer', 'other').default('cash'),
  notes: Joi.string().max(500).allow('', null),
});

export const markWaivedSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  notes: Joi.string().max(500).required().messages({
    'any.required': 'Reason for waiver is required',
  }),
});
