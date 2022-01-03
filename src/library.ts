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
} from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  DeviceMode,
  DeviceStatus,
  DeviceType,
  InstallationsType,
} from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyDfqBq3AfIg1wPjuHse3eiXqeDIxnhvp6U",
  authDomain: "oem1-elife-cloud-prod.firebaseapp.com",
  databaseURL: "https://oem2-elife-cloud-prod-default-rtdb.firebaseio.com",
  projectId: "oem2-elife-cloud-prod",
  storageBucket: "oem2-elife-cloud-prod.appspot.com",
  appId: "1:150904115315:android:03aeef2c831bbda0061a06",
};

// TODO: do not init at import time, but at first usage e.g. with a singleton
const app = initializeApp(firebaseConfig);
const database = getDatabase();
const auth = getAuth(app);

const userByUidPath = (uid: string) => `users/${uid}`;
const installationsPath = "installations2";
const deviceByIdPath = (id: string) => `devices/${id}`;
const deviceDataByIdPath = (id: string) => `${deviceByIdPath(id)}/data`;

const login = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

const logout = () => signOut(auth);

const getUser = async (uid: string) => {
  const path = userByUidPath(uid);
  const snapshot = await get(child(ref(database), path));
  const user = snapshot.val();
  return user;
};

const getInstallations = async (uid: string): Promise<InstallationsType> => {
  const path = installationsPath;
  const snapshot = await get(
    query(ref(database, path), orderByChild("userid"), equalTo(uid))
  );
  const installations = snapshot.val();
  return installations;
};

const getDevice = async (id: string): Promise<DeviceType> => {
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
