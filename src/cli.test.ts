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
