import {
  createClient,
  deviceDataByIdPath,
  DeviceMode,
  DeviceStatus,
  FirebaseConfig,
  type Client,
  type DeviceType,
} from "equation-connect";

const factory: (config?: FirebaseConfig) => Client = createClient;
const devicePath: string = deviceDataByIdPath("device-1");
const mode: DeviceMode = DeviceMode.Auto;
const status: DeviceStatus = DeviceStatus.Comfort;
declare const client: Client;
const device: Promise<DeviceType> = client.getDevice("device-1");

void [factory, devicePath, mode, status, device];
