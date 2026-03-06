import { d as createSsrRpc } from "./router-CLGnVP9u.mjs";
import { c as createBorrowerSchema, u as updateBorrowerSchema } from "./borrower-C6HD2kfy.mjs";
import { D as DEFAULTS } from "./constants-DFV23y0t.mjs";
import { c as createServerFn } from "./index.mjs";
const listBorrowers = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const d = data;
  return {
    page: d.page || 1,
    limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
    area: d.area || "",
    search: d.search || ""
  };
}).handler(createSsrRpc("2b1febee5c8352ad582297cea76d90d23bf6ab8bb6f7abdcc2d6b34723e07067"));
const getBorrowerById = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const id = data.id;
  if (!id) throw new Error("Borrower ID is required");
  return {
    id
  };
}).handler(createSsrRpc("f8fa8e37fb95dcb732a5664237572af025802fa7026aa5bb268ecb5b3db6efa8"));
const createBorrower = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = createBorrowerSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    const messages = error.details.map((d) => d.message).join(", ");
    throw new Error(messages);
  }
  return value;
}).handler(createSsrRpc("9224c6c400432973e2a31c14018e45cd63e0a8de4b5ec9883bb6ff7b28501648"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  const {
    id,
    ...rest
  } = d;
  if (!id) throw new Error("Borrower ID is required");
  const {
    error,
    value
  } = updateBorrowerSchema.validate(rest, {
    abortEarly: false
  });
  if (error) {
    const messages = error.details.map((d2) => d2.message).join(", ");
    throw new Error(messages);
  }
  return {
    id,
    ...value
  };
}).handler(createSsrRpc("b7a4cf04ffd8a5b15f834ee95339c99b18115fde677512f72a588f58ff6d4387"));
const generateNewMagicLink = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const id = data.id;
  if (!id) throw new Error("Borrower ID is required");
  return {
    id
  };
}).handler(createSsrRpc("17d267557b2ea379c4700e1419c007e8de89febce492c7fade7b8b457a61f2f7"));
const searchBorrowers = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const query = data.query;
  if (!query || query.length < 1) throw new Error("Search query required");
  return {
    query
  };
}).handler(createSsrRpc("89ade9f6e5ddc3ac6b5567266dc044c9dcdeb1bae24e7d378d558882950d24b1"));
const listAreas = createServerFn({
  method: "GET"
}).handler(createSsrRpc("faf23032f626d47cf6b4fdfa73ba96d0e74bb314fefc6c764d95b0f7bacf768d"));
export {
  listBorrowers as a,
  generateNewMagicLink as b,
  createBorrower as c,
  getBorrowerById as g,
  listAreas as l,
  searchBorrowers as s
};
