import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { client, createClient } = vi.hoisted(() => {
  const client = {
    login: vi.fn(),
    logout: vi.fn(),
    getInstallations: vi.fn(),
    getDevice: vi.fn(),
    setDevicePower: vi.fn(),
    setDevicePreset: vi.fn(),
    updateDeviceTemperature: vi.fn(),
    setDeviceMode: vi.fn(),
  };

  return { client, createClient: vi.fn(() => client) };
});

vi.mock("./library", () => ({ createClient }));

import { version } from "../package.json";
import { createProgram } from "./cli";
import { DeviceMode, DeviceStatus, FirebaseConfig } from "./types";

const run = (...args: string[]) =>
  createProgram().parseAsync(["node", "equation-connect", ...args]);

beforeEach(() => {
  vi.clearAllMocks();
  client.login.mockResolvedValue({ uid: "uid-123" });
  client.logout.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CLI program", () => {
  it("defines the published program metadata and commands", () => {
    const program = createProgram();

    expect(program.name()).toBe("equation-connect");
    expect(program.description()).toBe(
      "CLI tool for controlling Equation/Rointe WiFi radiators",
    );
    expect(program.version()).toBe(version);
    expect(program.commands.map((command) => command.name())).toEqual([
      "login",
      "getInstallations",
      "getDevice",
      "getZone",
      "getZonePreset",
      "setDevicePower",
      "setDevicePreset",
      "setDeviceTemperature",
      "setDeviceMode",
    ]);
  });

  it("renders help for the executable and representative commands", () => {
    const help = createProgram().helpInformation();

    expect(help).toContain("Usage: equation-connect");
    expect(help).toContain("login");
    expect(help).toContain("getDevice");
    expect(help).toContain("setDeviceTemperature");
  });

  it("validates required options before creating a client", async () => {
    const program = createProgram();
    const command = program.commands.find(
      (command) => command.name() === "getDevice",
    )!;
    const writeErr = vi.fn();
    command.exitOverride();
    command.configureOutput({ writeErr });

    await expect(
      program.parseAsync(["node", "equation-connect", "getDevice"]),
    ).rejects.toMatchObject({
      code: "commander.missingMandatoryOptionValue",
    });
    expect(writeErr).toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("CLI actions", () => {
  it("gets installations using the default Equation config", async () => {
    const installations = {
      "installation-1": { name: "Home" },
    };
    client.getInstallations.mockResolvedValue(installations);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await run(
      "getInstallations",
      "--email",
      "user@example.com",
      "--password",
      "secret",
    );

    expect(createClient).toHaveBeenCalledWith(FirebaseConfig.EquationConnect);
    expect(client.login).toHaveBeenCalledWith("user@example.com", "secret");
    expect(client.getInstallations).toHaveBeenCalledWith("uid-123");
    expect(log).toHaveBeenCalledWith(JSON.stringify(installations, null, 2));
    expect(client.logout).toHaveBeenCalledWith("uid-123");
  });

  it("gets a device using the explicit Rointe config", async () => {
    const device = { serialnumber: "serial-1" };
    client.getDevice.mockResolvedValue(device);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await run(
      "getDevice",
      "--email",
      "user@example.com",
      "--password",
      "secret",
      "--config",
      "rointe",
      "--device-id",
      "device-1",
    );

    expect(createClient).toHaveBeenCalledWith(FirebaseConfig.RointeConnect);
    expect(client.login).toHaveBeenCalledWith("user@example.com", "secret");
    expect(client.getDevice).toHaveBeenCalledWith("device-1");
    expect(log).toHaveBeenCalledWith(JSON.stringify(device, null, 2));
    expect(client.logout).toHaveBeenCalledWith("uid-123");
  });

  it("maps a false power value to a boolean", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await run(
      "setDevicePower",
      "--email",
      "user@example.com",
      "--password",
      "secret",
      "--device-id",
      "device-1",
      "--value",
      "false",
    );

    expect(client.login).toHaveBeenCalledWith("user@example.com", "secret");
    expect(client.setDevicePower).toHaveBeenCalledWith("device-1", false);
    expect(log).toHaveBeenCalledWith(JSON.stringify({ power: false }, null, 2));
    expect(client.logout).toHaveBeenCalledWith("uid-123");
  });

  it("parses a temperature value as a number", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await run(
      "setDeviceTemperature",
      "--email",
      "user@example.com",
      "--password",
      "secret",
      "--device-id",
      "device-1",
      "--value",
      "21.5",
    );

    expect(client.login).toHaveBeenCalledWith("user@example.com", "secret");
    expect(client.updateDeviceTemperature).toHaveBeenCalledWith(
      "device-1",
      21.5,
    );
    expect(log).toHaveBeenCalledWith(JSON.stringify({ temp: 21.5 }, null, 2));
    expect(client.logout).toHaveBeenCalledWith("uid-123");
  });

  it("maps an eco preset to DeviceStatus", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await run(
      "setDevicePreset",
      "--email",
      "user@example.com",
      "--password",
      "secret",
      "--device-id",
      "device-1",
      "--value",
      "eco",
    );

    expect(client.login).toHaveBeenCalledWith("user@example.com", "secret");
    expect(client.setDevicePreset).toHaveBeenCalledWith(
      "device-1",
      DeviceStatus.Eco,
    );
    expect(log).toHaveBeenCalledWith(
      JSON.stringify({ status: "eco" }, null, 2),
    );
    expect(client.logout).toHaveBeenCalledWith("uid-123");
  });

  it("maps auto mode to DeviceMode", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await run(
      "setDeviceMode",
      "--email",
      "user@example.com",
      "--password",
      "secret",
      "--device-id",
      "device-1",
      "--value",
      "auto",
    );

    expect(client.login).toHaveBeenCalledWith("user@example.com", "secret");
    expect(client.setDeviceMode).toHaveBeenCalledWith(
      "device-1",
      DeviceMode.Auto,
    );
    expect(log).toHaveBeenCalledWith(JSON.stringify({ mode: "auto" }, null, 2));
    expect(client.logout).toHaveBeenCalledWith("uid-123");
  });
});
