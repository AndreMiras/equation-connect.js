import { strict as assert } from "assert";
import { initializeApp, deleteApp, getApp, FirebaseApp } from "firebase/app";
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
} from "./types";

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
var app: FirebaseApp | null = null;
var auth: Auth | null = null;
var database: Database | null = null;

/**
 * Initializes the firebase app then set and returns both `app` and `auth` global variables.
 */
const init = (
  config: FirebaseConfig = FirebaseConfig.EquationConnect
): { app: FirebaseApp; auth: Auth; database: Database } => {
  const firebaseConfig = firebaseConfigs[config];
  if (app?.options?.projectId === firebaseConfig.projectId)
    return { app, auth: getAuth(app), database: getDatabase(app) };
  if (app !== null) deleteApp(getApp());
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  return { app, auth, database };
};
// TODO: do not init at import time, but at first usage e.g. with a singleton
({ app, auth, database } = init());

const userByUidPath = (uid: string) => `users/${uid}`;
const installationsPath = "installations2";
const deviceByIdPath = (id: string) => `devices/${id}`;
const deviceDataByIdPath = (id: string) => `${deviceByIdPath(id)}/data`;

const login = async (email: string, password: string) => {
  assert(auth);
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

const logout = () => signOut(getAuth());

const getUser = async (uid: string) => {
  const path = userByUidPath(uid);
  assert(database);
  const snapshot = await get(child(ref(database), path));
  const user = snapshot.val();
  return user;
};

const getInstallations = async (uid: string): Promise<InstallationsType> => {
  assert(database);
  const path = installationsPath;
  const snapshot = await get(
    query(ref(database, path), orderByChild("userid"), equalTo(uid))
  );
  const installations = snapshot.val();
  return installations;
};

const getDevice = async (id: string): Promise<DeviceType> => {
  assert(database);
  const path = deviceByIdPath(id);
  const snapshot = await get(child(ref(database), path));
  const device = snapshot.val();
  return device;
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
const updateDevice = (id: string, data: any): void => {
  assert(database);
  const path = deviceDataByIdPath(id);
  const reference = child(ref(database), path);
  update(reference, { ...data });
};

const updateDeviceTemperature = (id: string, temp: number): void => {
  updateDevice(id, { temp });
};

const setDevicePreset = async (
  id: string,
  status: DeviceStatus
): Promise<void> => {
  const device = await getDevice(id);
  const temp = device.data[status];
  const data = {
    power: true,
    mode: DeviceMode.Manual,
    temp,
    status,
  };
  updateDevice(id, { ...data });
};

/**
 * Turns radiator on or off.
 *
 * @param power set `true` to turn on and `false` to turn off.
 */
const setDevicePower = (id: string, power: boolean): void => {
  updateDevice(id, { power });
};

/**
 * Turns radiator on.
 */
const setDevicePowerOn = (id: string): void => {
  updateDevice(id, { power: true });
};

/**
 * Turns radiator off.
 */
const setDevicePowerOff = (id: string): void => {
  updateDevice(id, { power: false });
};

/**
 * Sets device backlight value, the higher the brighter.
 * This backlight also applies when the device is off.
 */
const setDeviceBacklight = (id: string, backlight: number): void => {
  updateDevice(id, { backlight });
};

/**
 * Sets device backlight value, the higher the brighter.
 * This backlight only applies when the device is on.
 */
const setDeviceBacklightOn = (id: string, backlight: number): void => {
  updateDevice(id, { backlight_on: backlight });
};

export {
  auth,
  database,
  deviceByIdPath,
  deviceDataByIdPath,
  init,
  installationsPath,
  login,
  logout,
  getInstallations,
  getUser,
  getDevice,
  setDeviceBacklight,
  setDeviceBacklightOn,
  setDevicePower,
  setDevicePowerOff,
  setDevicePowerOn,
  setDevicePreset,
  updateDevice,
  updateDeviceTemperature,
  userByUidPath,
};
