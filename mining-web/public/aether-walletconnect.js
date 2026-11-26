(() => {
  const handoff = document.getElementById("aetherWalletHandoff");
  const status = document.getElementById("aetherWalletHandoffStatus");
  const openApp = document.getElementById("openAetherWalletApp");
  const chain = "eip155:56";
  let providerPromise;
  let walletAdapter;
  let pairing = false;

  async function loadProvider(config) {
    if (!window["@walletconnect/universal-provider"]) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/vendor/walletconnect-2.26.0.js";
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error("WalletConnect bundle unavailable"));
        };
        document.head.append(script);
      });
    }
    const sdk = window["@walletconnect/universal-provider"];
    const UniversalProvider = sdk?.UniversalProvider ?? sdk?.default;
    return UniversalProvider.init({
      projectId: config.walletConnectProjectId,
      metadata: {
        name: location.hostname.startsWith("staking.") ? "AETHER Staking" : "AETHER Mining",
        description: "Connect your wallet to AETHER",
        url: location.origin,
        icons: []
      },
      storageOptions: {customStoragePrefix: "aether-ath-chrome"}
    });
  }

  function accountAddresses(provider) {
    return Object.values(provider.session?.namespaces ?? {})
      .flatMap(namespace => namespace.accounts ?? [])
      .filter(account => /^eip155:56:0x[a-f0-9]{40}$/i.test(account))
      .map(account => account.split(":")[2]);
  }

  function makeWalletAdapter(provider) {
    return {
      on(event, listener) {
        provider.on(event, value => listener(
          event === "chainChanged" && String(value).startsWith("eip155:")
            ? Number(value.split(":")[1])
            : value
        ));
        if (event === "accountsChanged") provider.on("session_update", listener);
      },
      async request(request) {
        if (request.method === "eth_accounts") return accountAddresses(provider);
        if (request.method === "eth_chainId") return "0x38";
        return provider.request(request, chain);
      }
    };
  }

  window.connectAetherFromChrome = async (config, onConnected) => {
    if (pairing) return;
    pairing = true;
    const id = document.getElementById("aetherLangSelect")?.value === "id";
    handoff.hidden = false;
    openApp.hidden = true;
    status.textContent = id ? "Menyiapkan koneksi AETHER Wallet…" : "Preparing AETHER Wallet connection…";
    let provider;
    const displayUri = uri => {
      const fallback = encodeURIComponent("https://wallet.aether.boats/");
      openApp.href = "intent://walletconnect?uri=" + encodeURIComponent(uri) +
        "#Intent;scheme=aether;package=com.aether.wallet;S.browser_fallback_url=" + fallback + ";end";
      openApp.textContent = id ? "Buka AETHER Wallet" : "Open AETHER Wallet";
      openApp.hidden = false;
      status.textContent = id
        ? "Buka APK, setujui koneksi, lalu kembali ke tab Chrome ini."
        : "Open the app, approve the connection, then return to this Chrome tab.";
      handoff.scrollIntoView({block:"nearest"});
    };
    try {
      providerPromise ??= loadProvider(config).catch(error => {
        providerPromise = null;
        throw error;
      });
      provider = await providerPromise;
      provider.on("display_uri", displayUri);
      if (!provider.session) {
        await provider.connect({
          namespaces: {
            eip155: {
              chains: [chain],
              methods: ["eth_sendTransaction"],
              events: ["accountsChanged", "chainChanged"],
              rpcMap: {56: config.rpcUrl}
            }
          }
        });
      }
      if (!accountAddresses(provider).length) {
        await provider.disconnect();
        throw new Error("Missing BNB Smart Chain account");
      }
      walletAdapter ??= makeWalletAdapter(provider);
      if (!await onConnected(walletAdapter)) throw new Error("Wallet is not connected");
      handoff.hidden = true;
    } catch {
      status.textContent = id
        ? "Koneksi AETHER Wallet belum berhasil. Coba lagi dari tombol Connect AETHER Wallet."
        : "AETHER Wallet connection failed. Retry from Connect AETHER Wallet.";
    } finally {
      provider?.removeListener("display_uri", displayUri);
      openApp.removeAttribute("href");
      openApp.hidden = true;
      pairing = false;
    }
  };
})();
