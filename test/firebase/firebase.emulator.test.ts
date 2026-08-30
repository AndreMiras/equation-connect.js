import { randomUUID } from "node:crypto";
import { getApps } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  connectDatabaseEmulator,
  get,
  ref,
  set,
  update,
} from "firebase/database";
import { expect, it } from "vitest";
import { createClient, FirebaseConfig } from "../../src";

const requireEmulatorHost = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} must be set by Firebase Emulator Suite; refusing to run against a remote service`,
    );
  }

  const separator = value.lastIndexOf(":");
  const rawHostname = value.slice(0, separator);
  const port = Number(value.slice(separator + 1));
  if (
    separator < 1 ||
    !rawHostname ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535
  ) {
    throw new Error(
      `${name} must use a valid host:port value; received ${value}`,
    );
  }

  return {
    hostname: rawHostname.replace(/^\[(.*)\]$/, "$1"),
    port,
  };
};

const authHost = requireEmulatorHost("FIREBASE_AUTH_EMULATOR_HOST");
const databaseHost = requireEmulatorHost("FIREBASE_DATABASE_EMULATOR_HOST");

it("authenticates and operates on devices and zones through Firebase emulators", async () => {
  const client = createClient(FirebaseConfig.EquationConnect);
  const app = client.auth.app;
  const authHostname = authHost.hostname.includes(":")
    ? `[${authHost.hostname}]`
    : authHost.hostname;

  connectAuthEmulator(client.auth, `http://${authHostname}:${authHost.port}`, {
    disableWarnings: true,
  });
  connectDatabaseEmulator(
    client.database,
    databaseHost.hostname,
    databaseHost.port,
  );

  try {
    const email = `equation-connect-${randomUUID()}@example.com`;
    const password = `emulator-${randomUUID()}`;
    const credential = await createUserWithEmailAndPassword(
      client.auth,
      email,
      password,
    );
    const uid = credential.user.uid;

    await signOut(client.auth);
    await set(ref(client.database), null);
    await set(ref(client.database), {
      installations2: {
        "installation-1": {
          userid: uid,
          name: "Emulator Home",
          power: false,
          zones: {
            "zone-1": {
              id: "zone-1",
              name: "Living Room",
              power: false,
              devices: { "device-1": true, "device-2": true },
            },
          },
        },
        "installation-unrelated": {
          userid: "another-user",
          name: "Unrelated Home",
        },
      },
      devices: {
        "device-1": {
          installation: "installation-1",
          serialnumber: "emulator-device-1",
          data: { power: false, status: "eco", temp: 18 },
        },
        "device-2": {
          installation: "installation-1",
          serialnumber: "emulator-device-2",
          data: { power: false, status: "eco", temp: 18 },
        },
      },
    });

    const user = await client.login(email, password);
    expect(user.uid).toBe(uid);

    const installations = await client.getInstallations(uid);
    expect(Object.keys(installations)).toEqual(["installation-1"]);
    expect(installations["installation-1"]).toMatchObject({
      name: "Emulator Home",
      userid: uid,
    });

    const device = await client.getDevice("device-1");
    expect(device).toMatchObject({
      serialnumber: "emulator-device-1",
      data: { power: false, temp: 18 },
    });

    client.setDevicePower("device-1", true);
    await expect
      .poll(
        async () =>
          (
            await get(ref(client.database, "devices/device-1/data/power"))
          ).val(),
        { interval: 25, timeout: 5_000 },
      )
      .toBe(true);

    await update(ref(client.database, "devices/device-1/data"), {
      power: false,
    });
    await client.setZonePower("installation-1", "zone-1", true);

    await expect
      .poll(
        async () => {
          const state = (await get(ref(client.database))).val();
          return {
            device1: state.devices["device-1"].data.power,
            device2: state.devices["device-2"].data.power,
            zone: state.installations2["installation-1"].zones["zone-1"].power,
          };
        },
        { interval: 25, timeout: 5_000 },
      )
      .toEqual({ device1: true, device2: true, zone: true });
  } finally {
    await client.logout();
  }

  expect(getApps()).not.toContain(app);
});
