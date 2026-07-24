const resolveEventStreamSerdeConfig = (input) => Object.assign(input, {
  eventStreamMarshaller: input.eventStreamSerdeProvider(input)
});
export {
  resolveEventStreamSerdeConfig as r
};
