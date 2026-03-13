import { initializeApp } from "firebase/app";
import {
  child,
  equalTo,
  get,
  getDatabase,
  query,
  orderByChild,
  ref,
  update,
  Database,
} from "firebase/database";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  Auth,
} from "firebase/auth";
import {
  DeviceMode,
  DeviceStatus,
  DeviceType,
  FirebaseConfig,
  InstallationsType,
  InstallationType,
  ZoneOverviewType,
} from "./types";
import { strict as assert } from "assert";

const equationConnectConfig = {
  apiKey: "AIzaSyDfqBq3AfIg1wPjuHse3eiXqeDIxnhvp6U",
  authDomain: "oem1-elife-cloud-prod.firebaseapp.com",
  databaseURL: "https://oem2-elife-cloud-prod-default-rtdb.firebaseio.com",
  projectId: "oem2-elife-cloud-prod",
  storageBucket: "oem2-elife-cloud-prod.appspot.com",
  appId: "1:150904115315:android:03aeef2c831bbda0061a06",
};
const rointeConnectConfig = {
  apiKey: "AIzaSyCoysJDGK-U6EchAqPZcN1lw4itRkXXcTw",
  databaseURL: "https://elife-prod.firebaseio.com",
  projectId: "elife-prod",
  storageBucket: "firebase-elife-prod.appspot.com",
  appId: "1:150904115315:android:03aeef2c831bbda0061a06",
};
const firebaseConfigs = {
  [FirebaseConfig.EquationConnect]: equationConnectConfig,
  [FirebaseConfig.RointeConnect]: rointeConnectConfig,
};

interface FirebaseContext {
  auth: Auth;
  database: Database;
}

// Path helpers (pure functions, no deps needed)

const userByUidPath = (uid: string) => `users/${uid}`;
const installationsPath = "installations2";
const installationByIdPath = (id: string) => `${installationsPath}/${id}`;
const deviceByIdPath = (id: string) => `devices/${id}`;
const deviceDataByIdPath = (id: string) => `${deviceByIdPath(id)}/data`;
const zoneByIdPath = (installationId: string, id: string) =>
  `${installationByIdPath(installationId)}/zones/${id}`;
const installationZonesPath = (installationId: string) =>
  `${installationByIdPath(installationId)}/zones`;

// Firebase-dependent functions

const login = async (
  deps: FirebaseContext,
  email: string,
  password: string
) => {
  const { user } = await signInWithEmailAndPassword(deps.auth, email, password);
  return user;
};

const logout = (deps: FirebaseContext) => signOut(deps.auth);

const getUser = async (deps: FirebaseContext, uid: string) => {
  const path = userByUidPath(uid);
  const snapshot = await get(child(ref(deps.database), path));
  const user = snapshot.val();
  return user;
};

const getInstallations = async (
  deps: FirebaseContext,
  uid: string
): Promise<InstallationsType> => {
  const path = installationsPath;
  const snapshot = await get(
    query(ref(deps.database, path), orderByChild("userid"), equalTo(uid))
  );
  const installations = snapshot.val();
  return installations;
};

const getDevice = async (
  deps: FirebaseContext,
  id: string
): Promise<DeviceType> => {
  const path = deviceByIdPath(id);
  const snapshot = await get(child(ref(deps.database), path));
  const device = snapshot.val();
  return device;
};

const getZone = async (
  deps: FirebaseContext,
  installationId: string,
  id: string
): Promise<ZoneOverviewType> => {
  const path = zoneByIdPath(installationId, id);
  const snapshot = await get(child(ref(deps.database), path));
  const zone = snapshot.val();
  return zone;
};

const getInstallation = async (
  deps: FirebaseContext,
  id: string
): Promise<InstallationType> => {
  const path = installationByIdPath(id);
  const snapshot = await get(child(ref(deps.database), path));
  return snapshot.val();
};

/**
 * Updates device raw `data` property.
 *
 * ```ts
 * const id = '504DC27CB994706DC56BB993';
 * const temp = 20;
 * updateDevice(id, { temp });
 * const power = false;
 * updateDevice(id, { power });
 * ```
 */
const updateDevice = (deps: FirebaseContext, id: string, data: any): void => {
  const path = deviceDataByIdPath(id);
  const reference = child(ref(deps.database), path);
  update(reference, { ...data });
};

const updateZone = (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  data: any
): void => {
  const path = zoneByIdPath(installationId, id);
  const reference = child(ref(deps.database), path);
  update(reference, { ...data });
};

const updateDeviceTemperature = (
  deps: FirebaseContext,
  id: string,
  temp: number
): void => {
  updateDevice(deps, id, { temp });
};

const setDevicePreset = async (
  deps: FirebaseContext,
  id: string,
  status: DeviceStatus
): Promise<void> => {
  const device = await getDevice(deps, id);
  const temp = device.data[status as keyof typeof device.data];
  const data = {
    power: true,
    mode: DeviceMode.Manual,
    temp,
    status,
  };
  updateDevice(deps, id, { ...data });
};

/**
 * Turns radiator on or off.
 *
 * @param power set `true` to turn on and `false` to turn off.
 */
const setDevicePower = (
  deps: FirebaseContext,
  id: string,
  power: boolean
): void => {
  updateDevice(deps, id, { power });
};

/**
 * Turns radiator on.
 */
const setDevicePowerOn = (deps: FirebaseContext, id: string): void => {
  updateDevice(deps, id, { power: true });
};

/**
 * Turns radiator off.
 */
const setDevicePowerOff = (deps: FirebaseContext, id: string): void => {
  updateDevice(deps, id, { power: false });
};

/**
 * Sets device backlight value, the higher the brighter.
 * This backlight also applies when the device is off.
 */
const setDeviceBacklight = (
  deps: FirebaseContext,
  id: string,
  backlight: number
): void => {
  updateDevice(deps, id, { backlight });
};

/**
 * Sets device backlight value, the higher the brighter.
 * This backlight only applies when the device is on.
 */
const setDeviceBacklightOn = (
  deps: FirebaseContext,
  id: string,
  backlight: number
): void => {
  updateDevice(deps, id, { backlight_on: backlight });
};

/**
 * Change radiator nominal power.
 *
 * @param nominal power in watts, e.g. 750, 1250.
 */
const setDeviceNominalPower = (
  deps: FirebaseContext,
  id: string,
  nominal_power: number
): void => {
  updateDevice(deps, id, { nominal_power });
};

/**
 * Returns the preset that's currently matching with the zone data as well as
 * with the devices part of the zone otherwise returns null.
 * This means if the zone has a `DeviceStatus.Comfort`, but only one of the
 * device from the zone has a different value, the function would return null.
 * Note that this would then query every single device of the zone.
 */
const getZonePreset = async (
  deps: FirebaseContext,
  installationId: string,
  id: string
): Promise<DeviceStatus | null> => {
  const zone = await getZone(deps, installationId, id);
  const status = zone.status;
  const deviceIds = zone.devices || {};
  const devices: DeviceType[] = await Promise.all(
    Object.keys(deviceIds).map((deviceId) => getDevice(deps, deviceId))
  );
  const statusList = devices.map((device) => device.data.status);
  const allEqual = statusList.every((val) => val === status);
  return allEqual ? status : null;
};

const setZonePreset = async (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  status: DeviceStatus
): Promise<void> => {
  const zone = await getZone(deps, installationId, id);
  // for some reason `zone.ice` isn't defined in the `installation2` response
  assert(
    status !== DeviceStatus.Ice,
    `The ${DeviceStatus.Ice} isn't available for zones`
  );
  const temp = zone[status as keyof typeof zone];
  const data = {
    power: true,
    mode: DeviceMode.Manual,
    temp,
    status,
  };
  const devices = zone.devices || {};
  await Promise.all(
    Object.keys(devices).map((deviceId) =>
      setDevicePreset(deps, deviceId, status)
    )
  );
  updateZone(deps, installationId, id, { ...data });
};

/**
 * Turns zone on or off.
 *
 * @param power set `true` to turn on and `false` to turn off.
 */
const setZonePower = async (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  power: boolean
): Promise<void> => {
  const zone = await getZone(deps, installationId, id);
  const devices = zone.devices || {};
  Object.keys(devices).forEach((deviceId) =>
    setDevicePower(deps, deviceId, power)
  );
  updateZone(deps, installationId, id, { power });
};

/**
 * Turns zone on.
 */
const setZonePowerOn = (
  deps: FirebaseContext,
  installationId: string,
  id: string
): void => {
  updateZone(deps, installationId, id, { power: true });
};

/**
 * Turns zone off.
 */
const setZonePowerOff = (
  deps: FirebaseContext,
  installationId: string,
  id: string
): void => {
  updateZone(deps, installationId, id, { power: false });
};

/** Sets device timer/boost mode. */
const setDeviceTimer = (
  deps: FirebaseContext,
  id: string,
  timerMode: boolean,
  timerTemp: number,
  timerTime: number
): void => {
  updateDevice(deps, id, {
    timer_mode: timerMode,
    timer_temp: timerTemp,
    timer_time: timerTime,
  });
};

/** Enables or disables window open detection mode. */
const setDeviceWindowOpenMode = (
  deps: FirebaseContext,
  id: string,
  enabled: boolean
): void => {
  updateDevice(deps, id, { windows_open_mode: enabled });
};

/** Enables or disables PIR (presence detection) mode. */
const setDevicePIRMode = (
  deps: FirebaseContext,
  id: string,
  enabled: boolean
): void => {
  updateDevice(deps, id, { pir_mode: enabled });
};

/** Enables or disables ice (anti-frost) mode. */
const setDeviceIceMode = (
  deps: FirebaseContext,
  id: string,
  enabled: boolean
): void => {
  updateDevice(deps, id, { ice_mode: enabled });
};

/** Blocks or unblocks physical button control on the device. */
const setDeviceBlockLocal = (
  deps: FirebaseContext,
  id: string,
  blocked: boolean
): void => {
  updateDevice(deps, id, { block_local: blocked });
};

/** Blocks or unblocks remote control of the device. */
const setDeviceBlockRemote = (
  deps: FirebaseContext,
  id: string,
  blocked: boolean
): void => {
  updateDevice(deps, id, { block_remote: blocked });
};

/** Enables or disables the device buzzer. */
const setDeviceBuzzer = (
  deps: FirebaseContext,
  id: string,
  enabled: boolean
): void => {
  updateDevice(deps, id, { buzzer: enabled });
};

/** Configures user mode (child lock with temperature limits). */
const setDeviceUserMode = (
  deps: FirebaseContext,
  id: string,
  userMode: boolean,
  umMinTemp: number,
  umMaxTemp: number,
  umPassword: string
): void => {
  updateDevice(deps, id, {
    user_mode: userMode,
    um_min_temp: umMinTemp,
    um_max_temp: umMaxTemp,
    um_password: umPassword,
  });
};

/** Enables or disables pilot wire mode. */
const setDevicePilotMode = (
  deps: FirebaseContext,
  id: string,
  enabled: boolean
): void => {
  updateDevice(deps, id, { pilot_mode: enabled });
};

/** Sets the device mode (manual or auto). */
const setDeviceMode = (
  deps: FirebaseContext,
  id: string,
  mode: DeviceMode
): void => {
  updateDevice(deps, id, { mode });
};

/** Sets mode on all devices in zone and updates zone. */
const setZoneMode = async (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  mode: DeviceMode
): Promise<void> => {
  const zone = await getZone(deps, installationId, id);
  const devices = zone.devices || {};
  Object.keys(devices).forEach((deviceId) =>
    setDeviceMode(deps, deviceId, mode)
  );
  updateZone(deps, installationId, id, { mode });
};

/** Sets ice mode on all devices in zone and updates zone. */
const setZoneIceMode = async (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  enabled: boolean
): Promise<void> => {
  const zone = await getZone(deps, installationId, id);
  const devices = zone.devices || {};
  Object.keys(devices).forEach((deviceId) =>
    setDeviceIceMode(deps, deviceId, enabled)
  );
  updateZone(deps, installationId, id, { ice_mode: enabled });
};

/** Sets block_local on all devices in zone and updates zone. */
const setZoneBlockLocal = async (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  blocked: boolean
): Promise<void> => {
  const zone = await getZone(deps, installationId, id);
  const devices = zone.devices || {};
  Object.keys(devices).forEach((deviceId) =>
    setDeviceBlockLocal(deps, deviceId, blocked)
  );
  updateZone(deps, installationId, id, { block_local: blocked });
};

/** Sets block_remote on all devices in zone and updates zone. */
const setZoneBlockRemote = async (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  blocked: boolean
): Promise<void> => {
  const zone = await getZone(deps, installationId, id);
  const devices = zone.devices || {};
  Object.keys(devices).forEach((deviceId) =>
    setDeviceBlockRemote(deps, deviceId, blocked)
  );
  updateZone(deps, installationId, id, { block_remote: blocked });
};

/** Sets buzzer on all devices in zone and updates zone. */
const setZoneBuzzer = async (
  deps: FirebaseContext,
  installationId: string,
  id: string,
  enabled: boolean
): Promise<void> => {
  const zone = await getZone(deps, installationId, id);
  const devices = zone.devices || {};
  Object.keys(devices).forEach((deviceId) =>
    setDeviceBuzzer(deps, deviceId, enabled)
  );
  updateZone(deps, installationId, id, { buzzer: enabled });
};

/**
 * Turns an entire installation on or off.
 * Fans out to all zones and all devices within those zones.
 */
const setInstallationPower = async (
  deps: FirebaseContext,
  installationId: string,
  power: boolean
): Promise<void> => {
  const installation = await getInstallation(deps, installationId);
  const zones = installation.zones || {};
  await Promise.all(
    Object.keys(zones).map((zoneId) =>
      setZonePower(deps, installationId, zoneId, power)
    )
  );
  const path = installationByIdPath(installationId);
  const reference = child(ref(deps.database), path);
  update(reference, { power });
};

// Client factory

const createClient = (
  config: FirebaseConfig = FirebaseConfig.EquationConnect
) => {
  const firebaseConfig = firebaseConfigs[config];
  const app = initializeApp(firebaseConfig);
  const deps: FirebaseContext = {
    auth: getAuth(app),
    database: getDatabase(app),
  };

  return {
    auth: deps.auth,
    database: deps.database,
    login: (email: string, password: string) => login(deps, email, password),
    logout: () => logout(deps),
    getUser: (uid: string) => getUser(deps, uid),
    getInstallations: (uid: string) => getInstallations(deps, uid),
    getDevice: (id: string) => getDevice(deps, id),
    getInstallation: (id: string) => getInstallation(deps, id),
    getZone: (installationId: string, id: string) =>
      getZone(deps, installationId, id),
    getZonePreset: (installationId: string, id: string) =>
      getZonePreset(deps, installationId, id),
    setDeviceBacklight: (id: string, backlight: number) =>
      setDeviceBacklight(deps, id, backlight),
    setDeviceBacklightOn: (id: string, backlight: number) =>
      setDeviceBacklightOn(deps, id, backlight),
    setDeviceNominalPower: (id: string, nominal_power: number) =>
      setDeviceNominalPower(deps, id, nominal_power),
    setDevicePower: (id: string, power: boolean) =>
      setDevicePower(deps, id, power),
    setDevicePowerOff: (id: string) => setDevicePowerOff(deps, id),
    setDevicePowerOn: (id: string) => setDevicePowerOn(deps, id),
    setDevicePreset: (id: string, status: DeviceStatus) =>
      setDevicePreset(deps, id, status),
    setZonePreset: (installationId: string, id: string, status: DeviceStatus) =>
      setZonePreset(deps, installationId, id, status),
    setZonePower: (installationId: string, id: string, power: boolean) =>
      setZonePower(deps, installationId, id, power),
    setZonePowerOff: (installationId: string, id: string) =>
      setZonePowerOff(deps, installationId, id),
    setZonePowerOn: (installationId: string, id: string) =>
      setZonePowerOn(deps, installationId, id),
    setDeviceTimer: (
      id: string,
      timerMode: boolean,
      timerTemp: number,
      timerTime: number
    ) => setDeviceTimer(deps, id, timerMode, timerTemp, timerTime),
    setDeviceWindowOpenMode: (id: string, enabled: boolean) =>
      setDeviceWindowOpenMode(deps, id, enabled),
    setDevicePIRMode: (id: string, enabled: boolean) =>
      setDevicePIRMode(deps, id, enabled),
    setDeviceIceMode: (id: string, enabled: boolean) =>
      setDeviceIceMode(deps, id, enabled),
    setDeviceBlockLocal: (id: string, blocked: boolean) =>
      setDeviceBlockLocal(deps, id, blocked),
    setDeviceBlockRemote: (id: string, blocked: boolean) =>
      setDeviceBlockRemote(deps, id, blocked),
    setDeviceBuzzer: (id: string, enabled: boolean) =>
      setDeviceBuzzer(deps, id, enabled),
    setDeviceUserMode: (
      id: string,
      userMode: boolean,
      umMinTemp: number,
      umMaxTemp: number,
      umPassword: string
    ) =>
      setDeviceUserMode(deps, id, userMode, umMinTemp, umMaxTemp, umPassword),
    setDevicePilotMode: (id: string, enabled: boolean) =>
      setDevicePilotMode(deps, id, enabled),
    setDeviceMode: (id: string, mode: DeviceMode) =>
      setDeviceMode(deps, id, mode),
    setZoneMode: (installationId: string, id: string, mode: DeviceMode) =>
      setZoneMode(deps, installationId, id, mode),
    setZoneIceMode: (installationId: string, id: string, enabled: boolean) =>
      setZoneIceMode(deps, installationId, id, enabled),
    setZoneBlockLocal: (installationId: string, id: string, blocked: boolean) =>
      setZoneBlockLocal(deps, installationId, id, blocked),
    setZoneBlockRemote: (
      installationId: string,
      id: string,
      blocked: boolean
    ) => setZoneBlockRemote(deps, installationId, id, blocked),
    setZoneBuzzer: (installationId: string, id: string, enabled: boolean) =>
      setZoneBuzzer(deps, installationId, id, enabled),
    setInstallationPower: (installationId: string, power: boolean) =>
      setInstallationPower(deps, installationId, power),
    updateDevice: (id: string, data: any) => updateDevice(deps, id, data),
    updateDeviceTemperature: (id: string, temp: number) =>
      updateDeviceTemperature(deps, id, temp),
    updateZone: (installationId: string, id: string, data: any) =>
      updateZone(deps, installationId, id, data),
  };
};

type Client = ReturnType<typeof createClient>;

export {
  createClient,
  userByUidPath,
  installationsPath,
  installationByIdPath,
  installationZonesPath,
  deviceByIdPath,
  deviceDataByIdPath,
  zoneByIdPath,
};
export type { Client };
