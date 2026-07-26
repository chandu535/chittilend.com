import Joi from 'joi';

export const createLoanSchema = Joi.object({
  borrowerId: Joi.string().uuid().required(),
  dateGiven: Joi.date().iso().required().messages({
    'date.format': 'Date must be in YYYY-MM-DD format',
  }),
  primaryAmount: Joi.number().positive().min(1000).max(10000000).required().messages({
    'number.min': 'Minimum loan amount is ₹1,000',
    'number.max': 'Maximum loan amount is ₹1,00,00,000',
  }),
  tenureMonths: Joi.number().integer().min(1).max(60).default(5).messages({
    'number.min': 'Tenure must be at least 1 month',
    'number.max': 'Tenure cannot exceed 60 months',
  }),
  paymentFrequency: Joi.string().valid('monthly', 'weekly').default('monthly'),
  serviceChargePercent: Joi.number().min(0).max(10).default(1),
  markupPercent: Joi.number().min(0).max(100).default(25),
  notes: Joi.string().max(2000).allow('', null),
});
