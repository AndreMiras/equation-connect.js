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

const login = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

const logout = () => signOut(auth);

const getUser = async (uid: string) => {
  const path = `users/${uid}`;
  const snapshot = await get(child(ref(database), path));
  const user = snapshot.val();
  return user;
};

const getInstallations = async (uid: string): Promise<InstallationsType> => {
  const path = "installations2";
  const snapshot = await get(
    query(ref(database, path), orderByChild("userid"), equalTo(uid))
  );
  const installations = snapshot.val();
  return installations;
};

const getDevice = async (id: string): Promise<DeviceType> => {
  const path = `devices/${id}`;
  const snapshot = await get(child(ref(database), path));
  const device = snapshot.val();
  return device;
};

const updateDevice = (id: string, data: any): void => {
  const path = `devices/${id}/data`;
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

export {
  auth,
  login,
  logout,
  getInstallations,
  getUser,
  getDevice,
  updateDeviceTemperature,
  setDevicePower,
  setDevicePowerOff,
  setDevicePowerOn,
  setDevicePreset,
};
