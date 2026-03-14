#!/usr/bin/env node
import { Command } from "commander";

import { version } from "../package.json";
import { createClient } from "./library";
import { DeviceMode, DeviceStatus, FirebaseConfig } from "./types";

const addAuthOptions = (command: Command): Command =>
  command
    .requiredOption("-e, --email <email>", "Account email")
    .requiredOption("-p, --password <password>", "Account password");

const addConfigOption = (command: Command): Command =>
  command.option(
    "-c, --config <config>",
    "Firebase config (equation or rointe)",
    "equation",
  );

const addDeviceIdOption = (command: Command): Command =>
  command.requiredOption("-d, --device-id <deviceId>", "Device ID");

const addInstallationIdOption = (command: Command): Command =>
  command.requiredOption(
    "-i, --installation-id <installationId>",
    "Installation ID",
  );

const addZoneIdOption = (command: Command): Command =>
  command.requiredOption("-z, --zone-id <zoneId>", "Zone ID");

const parseConfig = (config: string): FirebaseConfig =>
  config === "rointe"
    ? FirebaseConfig.RointeConnect
    : FirebaseConfig.EquationConnect;

const initializeCommand = async (options: {
  email: string;
  password: string;
  config: string;
}) => {
  const client = createClient(parseConfig(options.config));
  const user = await client.login(options.email, options.password);
  return { client, user };
};

const createProgram = (): Command => {
  const program = new Command();
  program
    .name("equation-connect")
    .description("CLI tool for controlling Equation/Rointe WiFi radiators")
    .version(version);

  // Command: login
  addConfigOption(
    addAuthOptions(
      program.command("login").description("Sign in and retrieve user info"),
    ),
  ).action(async (options) => {
    const { client, user } = await initializeCommand(options);
    const userInfo = await client.getUser(user.uid);
    console.log(JSON.stringify({ uid: user.uid, ...userInfo }, null, 2));
    await client.logout();
  });

  // Getter commands that only need auth
  [
    {
      commandName: "getInstallations",
      description: "List all installations for the authenticated user",
      getter: async (client: ReturnType<typeof createClient>, uid: string) =>
        client.getInstallations(uid),
    },
  ].forEach(({ commandName, description, getter }) => {
    addConfigOption(
      addAuthOptions(program.command(commandName).description(description)),
    ).action(async (options) => {
      const { client, user } = await initializeCommand(options);
      const result = await getter(client, user.uid);
      console.log(JSON.stringify(result, null, 2));
      await client.logout();
    });
  });

  // Getter commands that need a device ID
  [
    {
      commandName: "getDevice",
      description: "Retrieve device information",
      getter: (client: ReturnType<typeof createClient>, deviceId: string) =>
        client.getDevice(deviceId),
    },
  ].forEach(({ commandName, description, getter }) => {
    addConfigOption(
      addDeviceIdOption(
        addAuthOptions(program.command(commandName).description(description)),
      ),
    ).action(async (options) => {
      const { client } = await initializeCommand(options);
      const result = await getter(client, options.deviceId);
      console.log(JSON.stringify(result, null, 2));
      await client.logout();
    });
  });

  // Getter commands that need installation + zone IDs
  [
    {
      commandName: "getZone",
      description: "Retrieve zone information",
      getter: (
        client: ReturnType<typeof createClient>,
        installationId: string,
        zoneId: string,
      ) => client.getZone(installationId, zoneId),
    },
    {
      commandName: "getZonePreset",
      description: "Retrieve the current zone preset",
      getter: (
        client: ReturnType<typeof createClient>,
        installationId: string,
        zoneId: string,
      ) => client.getZonePreset(installationId, zoneId),
    },
  ].forEach(({ commandName, description, getter }) => {
    addConfigOption(
      addZoneIdOption(
        addInstallationIdOption(
          addAuthOptions(program.command(commandName).description(description)),
        ),
      ),
    ).action(async (options) => {
      const { client } = await initializeCommand(options);
      const result = await getter(
        client,
        options.installationId,
        options.zoneId,
      );
      console.log(JSON.stringify(result, null, 2));
      await client.logout();
    });
  });

  // Command: setDevicePower
  addConfigOption(
    addDeviceIdOption(
      addAuthOptions(
        program.command("setDevicePower").description("Turn device on or off"),
      ).requiredOption("-v, --value <boolean>", "Power state (true or false)"),
    ),
  ).action(async (options) => {
    const { client } = await initializeCommand(options);
    const power = options.value === "true";
    client.setDevicePower(options.deviceId, power);
    console.log(JSON.stringify({ power }, null, 2));
    await client.logout();
  });

  // Command: setDevicePreset
  addConfigOption(
    addDeviceIdOption(
      addAuthOptions(
        program
          .command("setDevicePreset")
          .description("Set device preset (comfort, eco, ice)"),
      ).requiredOption("-v, --value <preset>", "Preset (comfort, eco, ice)"),
    ),
  ).action(async (options) => {
    const { client } = await initializeCommand(options);
    const status = options.value as DeviceStatus;
    await client.setDevicePreset(options.deviceId, status);
    console.log(JSON.stringify({ status }, null, 2));
    await client.logout();
  });

  // Command: setDeviceTemperature
  addConfigOption(
    addDeviceIdOption(
      addAuthOptions(
        program
          .command("setDeviceTemperature")
          .description("Set device target temperature"),
      ).requiredOption(
        "-v, --value <number>",
        "Temperature in degrees",
        parseFloat,
      ),
    ),
  ).action(async (options) => {
    const { client } = await initializeCommand(options);
    client.updateDeviceTemperature(options.deviceId, options.value);
    console.log(JSON.stringify({ temp: options.value }, null, 2));
    await client.logout();
  });

  // Command: setDeviceMode
  addConfigOption(
    addDeviceIdOption(
      addAuthOptions(
        program
          .command("setDeviceMode")
          .description("Set device mode (manual or auto)"),
      ).requiredOption("-v, --value <mode>", "Mode (manual or auto)"),
    ),
  ).action(async (options) => {
    const { client } = await initializeCommand(options);
    const mode = options.value as DeviceMode;
    client.setDeviceMode(options.deviceId, mode);
    console.log(JSON.stringify({ mode }, null, 2));
    await client.logout();
  });

  return program;
};

const main = (): void => {
  const program = createProgram();
  program.parse(process.argv);
};

if (require.main === module) {
  main();
}

export { createProgram, main };
