import { describe, it, expect } from "vitest";
import {
  userByUidPath,
  installationsPath,
  installationByIdPath,
  deviceByIdPath,
  deviceDataByIdPath,
  zoneByIdPath,
} from "./library";

describe("library", () => {
  describe("userByUidPath", () => {
    it("returns user path for given uid", () => {
      expect(userByUidPath("abc123")).toBe("users/abc123");
    });
  });

  describe("installationsPath", () => {
    it("is the installations2 constant", () => {
      expect(installationsPath).toBe("installations2");
    });
  });

  describe("installationByIdPath", () => {
    it("returns installation path for given id", () => {
      expect(installationByIdPath("inst-1")).toBe("installations2/inst-1");
    });
  });

  describe("deviceByIdPath", () => {
    it("returns device path for given id", () => {
      expect(deviceByIdPath("dev-1")).toBe("devices/dev-1");
    });
  });

  describe("deviceDataByIdPath", () => {
    it("returns device data path for given id", () => {
      expect(deviceDataByIdPath("dev-1")).toBe("devices/dev-1/data");
    });
  });

  describe("zoneByIdPath", () => {
    it("returns zone path for given installation and zone id", () => {
      expect(zoneByIdPath("inst-1", "zone-1")).toBe(
        "installations2/inst-1/zones/zone-1"
      );
    });
  });
});
