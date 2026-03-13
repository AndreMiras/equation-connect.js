// Types
export type {
  DeviceDataType,
  ZoneOverviewType,
  ZonesOverviewType,
  InstallationType,
  InstallationsType,
} from "./types";

// Enums
export { DeviceMode, DeviceStatus, DeviceType, FirebaseConfig } from "./types";

// Client factory + type
export { createClient } from "./library";
export type { Client } from "./library";

// Pure path helpers (no Firebase dependency)
export {
  userByUidPath,
  installationsPath,
  installationByIdPath,
  deviceByIdPath,
  deviceDataByIdPath,
  zoneByIdPath,
} from "./library";
