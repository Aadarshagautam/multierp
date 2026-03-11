export { default as CustomerModel } from "./model.js";
export { default as PosCustomerModel } from "./pos-model.js";
export { default as LegacyPosCustomerModel } from "./legacy-pos-model.js";
export { customerRepository } from "./repository.js";
export { sharedCustomerService } from "./service.js";
export {
  createCustomerSchema,
  updateCustomerSchema,
} from "./validation.js";
export {
  CUSTOMER_MODEL_NAME,
  CUSTOMER_TYPES,
  DEFAULT_WALK_IN_NAME,
} from "./constants.js";
export {
  buildCustomerSnapshot,
  buildAddressText,
  computeCustomerTier,
  mapLegacyPosCustomerToShared,
  normalizeCustomerPayload,
  normalizePhoneDigits,
} from "./utils.js";
