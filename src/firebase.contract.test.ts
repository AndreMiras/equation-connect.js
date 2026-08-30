import { getApps } from "firebase/app";
import { equalTo, orderByChild, query, ref } from "firebase/database";
import { describe, expect, it } from "vitest";
import { createClient } from "./library";
import { FirebaseConfig } from "./types";

describe.each([
  [
    "Equation Connect",
    FirebaseConfig.EquationConnect,
    {
      authDomain: "oem1-elife-cloud-prod.firebaseapp.com",
      databaseURL: "https://oem2-elife-cloud-prod-default-rtdb.firebaseio.com",
      projectId: "oem2-elife-cloud-prod",
    },
  ],
  [
    "Rointe Connect",
    FirebaseConfig.RointeConnect,
    {
      databaseURL: "https://elife-prod.firebaseio.com",
      projectId: "elife-prod",
    },
  ],
])("Firebase SDK contract for %s", (_name, config, expectedOptions) => {
  it("initializes SDK services, constructs queries, and disposes the app", async () => {
    const client = createClient(config);
    const app = client.auth.app;

    try {
      expect(client.database.app).toBe(app);
      expect(app.options).toMatchObject(expectedOptions);

      const deviceReference = ref(client.database, "devices/contract-smoke");
      expect(deviceReference.key).toBe("contract-smoke");

      const installationsQuery = query(
        ref(client.database, "installations2"),
        orderByChild("userid"),
        equalTo("contract-smoke-user"),
      );
      expect(installationsQuery.toString()).toContain("installations2");
    } finally {
      await client.logout();
    }

    expect(getApps()).not.toContain(app);
  });
});
