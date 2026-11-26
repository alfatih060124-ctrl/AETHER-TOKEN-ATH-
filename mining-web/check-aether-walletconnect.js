const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const script = readFileSync(join(__dirname, "public", "aether-walletconnect.js"), "utf8");
const account = "0x0000000000000000000000000000000000000001";

for (const portal of ["staking", "mining"]) {
  test(`${portal} Chrome opens AETHER Wallet and uses the approved BSC account`, async () => {
    const host = `${portal}.aether.boats`;
    const origin = `https://${host}`;
    const elements = new Map();
    const document = {
      getElementById(id) {
        if (!elements.has(id)) {
          elements.set(id, {
            value: "id",
            scrollIntoView() {},
            removeAttribute(name) { delete this[name]; }
          });
        }
        return elements.get(id);
      }
    };
    const walletConnect = new EventEmitter();
    let rejected = true;
    walletConnect.connect = async ({ namespaces }) => {
      assert.deepEqual([...namespaces.eip155.chains], ["eip155:56"]);
      walletConnect.emit("display_uri", "wc:sample@2?symKey=sample");
      const href = elements.get("openAetherWalletApp").href;
      assert.match(href, /^intent:\/\/walletconnect\?uri=wc%3Asample%402/);
      assert.match(href, /#Intent;scheme=aether;package=com\.aether\.wallet;/);
      if (rejected) throw new Error("User rejected");
      walletConnect.session = {
        namespaces: { eip155: { accounts: [`eip155:56:${account}`, `eip155:97:${account}`] } }
      };
    };
    const window = {
      "@walletconnect/universal-provider": {
        UniversalProvider: {
          async init({ metadata }) {
            assert.equal(metadata.url, origin);
            return walletConnect;
          }
        }
      }
    };
    runInNewContext(script, { window, document, location: { hostname: host, origin } });
    let connected = false;
    const onConnected = async wallet => {
      assert.deepEqual([...(await wallet.request({ method: "eth_accounts" }))], [account]);
      assert.equal(await wallet.request({ method: "eth_chainId" }), "0x38");
      connected = true;
      return true;
    };

    await window.connectAetherFromChrome({}, onConnected);
    assert.equal(connected, false);
    assert.match(elements.get("aetherWalletHandoffStatus").textContent, /belum berhasil/);

    rejected = false;
    await window.connectAetherFromChrome({}, onConnected);
    assert.equal(connected, true);
    assert.equal(elements.get("aetherWalletHandoff").hidden, true);
    assert.equal(elements.get("openAetherWalletApp").href, undefined);
    assert.equal(walletConnect.listenerCount("display_uri"), 0);
  });
}
