/**
 * Studio Registration Module
 * Export all public components and hooks
 */

export { StudioRegistrationDialog } from './StudioRegistrationDialog';
export { StudioRegistrationProvider, StudioRegistrationContext } from './StudioRegistrationContext';
export { useStudioRegistration } from './hooks/useStudioRegistration';
export type { StudioRegistrationState } from './StudioRegistrationContext';
export type {
  BasicInfoFormData,
  AddressFormData,
  ContactFormData,
  CompleteRegistrationData,
} from './validation/studioSchemas';
