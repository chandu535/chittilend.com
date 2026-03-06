import { d as createSsrRpc } from "./router-CLGnVP9u.mjs";
import { c as createLoanSchema } from "./loan-Dc_xM90c.mjs";
import { D as DEFAULTS } from "./constants-DFV23y0t.mjs";
import { c as createServerFn } from "./index.mjs";
const listLoans = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const d = data;
  return {
    page: d.page || 1,
    limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
    status: d.status || "",
    borrowerId: d.borrowerId || "",
    dateFrom: d.dateFrom || "",
    dateTo: d.dateTo || "",
    search: d.search || ""
  };
}).handler(createSsrRpc("c6aac2c5f1e616252a1cd37b59ff41c6b3ed900ab92cbd85e8c5b69b6725aef3"));
const getLoanById = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const id = data.id;
  if (!id) throw new Error("Loan ID is required");
  return {
    id
  };
}).handler(createSsrRpc("598abfe0b55db0d95b1f41e6294dee2fb9697115d41bec08c40a6a51475a1790"));
const createLoan = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = createLoanSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    const messages = error.details.map((d) => d.message).join(", ");
    throw new Error(messages);
  }
  return value;
}).handler(createSsrRpc("dc465117bc796bf617a74a59b0b3cf5a9a299261996da1e1500aafb78575d145"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  if (!d.id) throw new Error("Loan ID is required");
  if (d.status && !["active", "completed", "defaulted", "extended"].includes(d.status)) {
    throw new Error("Invalid status");
  }
  return d;
}).handler(createSsrRpc("deaca83f8752c79c3c1dda0649870988e1cf3c42f1baffc248e4cdec82929de1"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  if (!d.id) throw new Error("Loan ID is required");
  if (!d.newTenureMonths || d.newTenureMonths < 1) {
    throw new Error("New tenure must be at least 1 month");
  }
  return d;
}).handler(createSsrRpc("30b913d22c4bf7659f9f140cd86dc966712ef404a269811cd4222e03d847627f"));
export {
  createLoan as c,
  getLoanById as g,
  listLoans as l
};
