import { e as createSsrRpc } from "./router-_jeUSzJ6.mjs";
import { m as markPaymentSchema, a as markWaivedSchema } from "./payment-jMyh0Ybg.mjs";
import { c as createServerFn } from "./index.mjs";
createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const loanId = data.loanId;
  if (!loanId) throw new Error("Loan ID is required");
  return {
    loanId
  };
}).handler(createSsrRpc("ddff522c8bb9ccb79a21689bc8a037e0bc5c0b03976bfad9aea68f21c22e49e0"));
const markPaymentPaid = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = markPaymentSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(", "));
  }
  return value;
}).handler(createSsrRpc("59c15f949d8dc113c6350ef01cf363752f956a68f708bdf6f58805fda162f915"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = markPaymentSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(", "));
  }
  return value;
}).handler(createSsrRpc("8f1f91b5598343ef977b6533acc047b67e13f3f1a85847038c59286ffbae29bf"));
const markPaymentWaived = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = markWaivedSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(", "));
  }
  return value;
}).handler(createSsrRpc("24c97fbfdfdea218d73ce4fe6aa689f5ada68672778a74aac52cdfdc7f376115"));
const listUpcomingPayments = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const days = data.days || 7;
  return {
    days
  };
}).handler(createSsrRpc("27af284ac630b437bdbda95142b0abfbefc64d0f0ff24c5f855347ceaec795df"));
const listOverduePayments = createServerFn({
  method: "GET"
}).handler(createSsrRpc("eb9a0a8f9fbcc6d36f47887494e1861a79a993fc0634c5fab13f0bfadff2181f"));
const listRecentPayments = createServerFn({
  method: "GET"
}).handler(createSsrRpc("467a4add2f8162dd6e91ae88288e840b44a1533c7629bd97404f41a8e480e67b"));
const revertPayment = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  if (!d.paymentId) throw new Error("Payment ID is required");
  return {
    paymentId: d.paymentId,
    reason: d.reason || ""
  };
}).handler(createSsrRpc("1b7c1f44b08991f3daafb4a2ca8a6a97cedb276718c2c33042cf5e1c0dda0be9"));
const bulkUpdateOverdueStatus = createServerFn({
  method: "POST"
}).handler(createSsrRpc("ee8c6974c87a15c3f851649bc5854dcd90080d025f99584e051c0187379c58b5"));
export {
  listOverduePayments as a,
  bulkUpdateOverdueStatus as b,
  listRecentPayments as c,
  markPaymentWaived as d,
  listUpcomingPayments as l,
  markPaymentPaid as m,
  revertPayment as r
};
