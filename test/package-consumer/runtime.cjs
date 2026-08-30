const assert = require("node:assert/strict");
const equationConnect = require("equation-connect");

assert.equal(typeof equationConnect.createClient, "function");
assert.equal(equationConnect.FirebaseConfig.EquationConnect, 0);
assert.equal(equationConnect.DeviceMode.Auto, "auto");
assert.equal(equationConnect.DeviceStatus.Comfort, "comfort");
assert.equal(equationConnect.deviceByIdPath("device-1"), "devices/device-1");
