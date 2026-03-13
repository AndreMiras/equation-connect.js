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
import {
  update,
  child,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

// Vitest hoists these to top of file
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
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

    describe("getUser", () => {
      it("returns user data for given uid", async () => {
        const mockUser = { name: "Test User", email: "test@example.com" };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockUser,
        } as any);
        const result = await client.getUser("uid-123");
        expect(child).toHaveBeenCalledWith(expect.anything(), "users/uid-123");
        expect(result).toEqual(mockUser);
      });
    });

    describe("getDevice", () => {
      it("returns device data for given id", async () => {
        const mockDevice = {
          installation: "inst-1",
          serialnumber: "SN123",
          data: { temp: 21, power: true, status: "comfort" },
        };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockDevice,
        } as any);
        const result = await client.getDevice("dev-1");
        expect(child).toHaveBeenCalledWith(expect.anything(), "devices/dev-1");
        expect(result).toEqual(mockDevice);
      });
    });

    describe("getZone", () => {
      it("returns zone data for given installation and zone id", async () => {
        const mockZone = {
          id: "zone-1",
          name: "Living Room",
          power: true,
          status: "comfort",
        };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockZone,
        } as any);
        const result = await client.getZone("inst-1", "zone-1");
        expect(child).toHaveBeenCalledWith(
          expect.anything(),
          "installations2/inst-1/zones/zone-1"
        );
        expect(result).toEqual(mockZone);
      });
    });

    describe("login", () => {
      it("calls signInWithEmailAndPassword and returns user", async () => {
        const mockUser = { uid: "uid-123", email: "test@example.com" };
        vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
          user: mockUser,
        } as any);
        const result = await client.login("test@example.com", "password123");
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          "test@example.com",
          "password123"
        );
        expect(result).toEqual(mockUser);
      });
    });

    describe("logout", () => {
      it("calls signOut", async () => {
        vi.mocked(signOut).mockResolvedValueOnce(undefined);
        await client.logout();
        expect(signOut).toHaveBeenCalledWith(expect.anything());
      });
    });

    describe("getInstallations", () => {
      it("queries installations filtered by user id", async () => {
        const mockInstallations = {
          "inst-1": {
            name: "Home",
            power: true,
            userid: "uid-123",
            zones: {},
          },
        };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockInstallations,
        } as any);
        const result = await client.getInstallations("uid-123");
        expect(orderByChild).toHaveBeenCalledWith("userid");
        expect(equalTo).toHaveBeenCalledWith("uid-123");
        expect(result).toEqual(mockInstallations);
      });
    });

    describe("setDevicePreset", () => {
      it("reads device and updates with preset temperature", async () => {
        const mockDevice = {
          data: { comfort: 21, eco: 18, ice: 7, status: "eco" },
        };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockDevice,
        } as any);
        await client.setDevicePreset("dev-1", "comfort" as any);
        expect(child).toHaveBeenCalledWith(expect.anything(), "devices/dev-1");
        expect(update).toHaveBeenCalledWith(expect.anything(), {
          power: true,
          mode: "manual",
          temp: 21,
          status: "comfort",
        });
      });
    });

    describe("setZonePower", () => {
      it("sets power on all devices in zone and updates zone", async () => {
        const mockZone = {
          devices: { "dev-1": true, "dev-2": true },
        };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockZone,
        } as any);
        await client.setZonePower("inst-1", "zone-1", true);
        expect(child).toHaveBeenCalledWith(
          expect.anything(),
          "installations2/inst-1/zones/zone-1"
        );
        // 2 device power updates + 1 zone update = 3
        expect(update).toHaveBeenCalledTimes(3);
      });

      it("handles zone with no devices", async () => {
        const mockZone = {};
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockZone,
        } as any);
        await client.setZonePower("inst-1", "zone-1", false);
        // Only zone update, no device updates
        expect(update).toHaveBeenCalledTimes(1);
      });
    });

    describe("getZonePreset", () => {
      it("returns status when all devices match zone status", async () => {
        const mockZone = {
          status: "comfort",
          devices: { "dev-1": true, "dev-2": true },
        };
        const mockDevice1 = { data: { status: "comfort" } };
        const mockDevice2 = { data: { status: "comfort" } };
        vi.mocked(get)
          .mockResolvedValueOnce({ val: () => mockZone } as any)
          .mockResolvedValueOnce({ val: () => mockDevice1 } as any)
          .mockResolvedValueOnce({ val: () => mockDevice2 } as any);
        const result = await client.getZonePreset("inst-1", "zone-1");
        expect(result).toBe("comfort");
      });

      it("returns null when a device has different status", async () => {
        const mockZone = {
          status: "comfort",
          devices: { "dev-1": true, "dev-2": true },
        };
        const mockDevice1 = { data: { status: "comfort" } };
        const mockDevice2 = { data: { status: "eco" } };
        vi.mocked(get)
          .mockResolvedValueOnce({ val: () => mockZone } as any)
          .mockResolvedValueOnce({ val: () => mockDevice1 } as any)
          .mockResolvedValueOnce({ val: () => mockDevice2 } as any);
        const result = await client.getZonePreset("inst-1", "zone-1");
        expect(result).toBeNull();
      });

      it("returns status when zone has no devices", async () => {
        const mockZone = { status: "eco" };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockZone,
        } as any);
        const result = await client.getZonePreset("inst-1", "zone-1");
        expect(result).toBe("eco");
      });
    });

    describe("setZonePreset", () => {
      it("throws when status is ice", async () => {
        const mockZone = { ice: 7 };
        vi.mocked(get).mockResolvedValueOnce({
          val: () => mockZone,
        } as any);
        await expect(
          client.setZonePreset("inst-1", "zone-1", "ice" as any)
        ).rejects.toThrow();
      });

      it("sets preset on all devices and updates zone", async () => {
        const mockZone = {
          comfort: 21,
          devices: { "dev-1": true },
        };
        const mockDevice = {
          data: { comfort: 21, eco: 18 },
        };
        vi.mocked(get)
          .mockResolvedValueOnce({ val: () => mockZone } as any)
          .mockResolvedValueOnce({ val: () => mockDevice } as any);
        await client.setZonePreset("inst-1", "zone-1", "comfort" as any);
        // device preset update + zone update = 2
        expect(update).toHaveBeenCalledTimes(2);
      });
    });
  });
});
