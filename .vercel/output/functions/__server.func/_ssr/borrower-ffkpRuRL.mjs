import { J as Joi } from "../_libs/joi.mjs";
const createBorrowerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).pattern(/^[\u0C00-\u0C7Fa-zA-Z\s.\-']+$/).required().messages({
    "string.pattern.base": "Name must contain only Telugu or English characters"
  }),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    "string.pattern.base": "Mobile must be exactly 10 digits (no +91)"
  }),
  area: Joi.string().trim().max(255).pattern(/^[\u0C00-\u0C7Fa-zA-Z0-9\s,.\-/()]+$/).allow("", null).messages({
    "string.pattern.base": "Area must contain only Telugu or English characters"
  }),
  address: Joi.string().trim().max(1e3).allow("", null),
  locationLat: Joi.number().min(-90).max(90).allow(null),
  locationLng: Joi.number().min(-180).max(180).allow(null),
  suretyType: Joi.string().valid("existing_borrower", "owner").default("owner"),
  suretyReferenceId: Joi.string().uuid().when("suretyType", {
    is: "existing_borrower",
    then: Joi.required().messages({
      "any.required": "Surety reference required when type is existing_borrower"
    }),
    otherwise: Joi.allow(null, "")
  }),
  aadhaarPhotoUrl: Joi.string().uri().allow("", null),
  profilePhotoUrl: Joi.string().uri().allow("", null)
});
const updateBorrowerSchema = createBorrowerSchema.fork(
  ["name", "mobile"],
  (schema) => schema.optional()
);
export {
  createBorrowerSchema as c,
  updateBorrowerSchema as u
};
