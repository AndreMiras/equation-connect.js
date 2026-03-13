import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  userByUidPath,
  installationsPath,
  installationByIdPath,
  deviceByIdPath,
  deviceDataByIdPath,
  zoneByIdPath,
  createClient,
} from "./library";
import { update, child } from "firebase/database";

// Vitest hoists these to top of file
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
}));

vi.mock("firebase/database", () => {
  const mockRef = {};
  const mockChild = vi.fn((_ref, path) => ({ path }));
  return {
    getDatabase: vi.fn(() => ({})),
    ref: vi.fn(() => mockRef),
    child: mockChild,
    update: vi.fn(),
    get: vi.fn(),
    query: vi.fn(),
    orderByChild: vi.fn(),
    equalTo: vi.fn(),
  };
});

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

  describe("createClient", () => {
    let client: ReturnType<typeof createClient>;

    beforeEach(() => {
      vi.clearAllMocks();
      client = createClient();
    });

    describe("updateDevice", () => {
      it("calls update with device data path and spread data", () => {
        client.updateDevice("dev-1", { temp: 20, power: true });
        expect(child).toHaveBeenCalledWith(
          expect.anything(),
          "devices/dev-1/data"
        );
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          temp: 20,
          power: true,
        });
      });
    });

    describe("updateDeviceTemperature", () => {
      it("updates device with temp payload", () => {
        client.updateDeviceTemperature("dev-1", 22);
        expect(child).toHaveBeenCalledWith(
          expect.anything(),
          "devices/dev-1/data"
        );
        expect(update).toHaveBeenCalledWith(expect.anything(), { temp: 22 });
      });
    });

    describe("setDevicePower", () => {
      it("updates device with power payload", () => {
        client.setDevicePower("dev-1", true);
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: true,
        });
      });

      it("updates device with power false", () => {
        client.setDevicePower("dev-1", false);
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: false,
        });
      });
    });

    describe("setDevicePowerOn", () => {
      it("updates device with power true", () => {
        client.setDevicePowerOn("dev-1");
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: true,
        });
      });
    });

    describe("setDevicePowerOff", () => {
      it("updates device with power false", () => {
        client.setDevicePowerOff("dev-1");
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: false,
        });
      });
    });

    describe("setDeviceBacklight", () => {
      it("updates device with backlight payload", () => {
        client.setDeviceBacklight("dev-1", 5);
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          backlight: 5,
        });
      });
    });

    describe("setDeviceBacklightOn", () => {
      it("updates device with backlight_on payload", () => {
        client.setDeviceBacklightOn("dev-1", 8);
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          backlight_on: 8,
        });
      });
    });

    describe("setDeviceNominalPower", () => {
      it("updates device with nominal_power payload", () => {
        client.setDeviceNominalPower("dev-1", 1250);
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          nominal_power: 1250,
        });
      });
    });

    describe("updateZone", () => {
      it("calls update with zone path and spread data", () => {
        client.updateZone("inst-1", "zone-1", { power: true });
        expect(child).toHaveBeenCalledWith(
          expect.anything(),
          "installations2/inst-1/zones/zone-1"
        );
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: true,
        });
      });
    });

    describe("setZonePowerOn", () => {
      it("updates zone with power true", () => {
        client.setZonePowerOn("inst-1", "zone-1");
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: true,
        });
      });
    });

    describe("setZonePowerOff", () => {
      it("updates zone with power false", () => {
        client.setZonePowerOff("inst-1", "zone-1");
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: false,
        });
      });
    });
  });
});
