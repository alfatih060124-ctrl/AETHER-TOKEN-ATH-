const $ = (id) => document.getElementById(id);

const ABI = [
  "function buyPower(address referrer) payable",
  "function buyBooster() payable",
  "function claimDaily()",
  "function claimAllVested()",
  "function getUserInfo(address account) view returns (bool hasPower,bool miningActive,uint256 startTime,uint256 lastClaimDay,uint256 currentDay,uint256 totalAllocated,uint256 totalClaimed,uint256 pendingVested,uint256 referralCount,uint256 referralBonusBps,uint256 boosterMultiplier,uint256 totalHash,uint256 positionsCount)",
  "function getCurrentPrice() view returns (uint256 priceInMicroUSD)",
  "function contractBalance() view returns (uint256)"
];

let cfg = null;
let provider = null;
let signer = null;
let account = "";
let contract = null;
let userInfo = null;
let toastTimer = null;

function toast(message, isError = false) {
  const el = $("toast");
  el.textContent = message;
  el.classList.toggle("error", isError);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3600);
}

function shortAddress(value) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "";
}

function fmtAth(value) {
  try {
    return `${Number(ethers.formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: 3 })} ATH`;
  } catch {
    return "0.000 ATH";
  }
}

function contractReady() {
  return Boolean(cfg?.miningAddress && ethers.isAddress(cfg.miningAddress));
}

function setSystemStatus() {
  const ready = contractReady();
  $("networkBadge").textContent = `◆ ${cfg?.chainName || "BSC Testnet"} ⌄`;
  $("networkBadge").className = `network-select ${ready ? "network-good" : "network-warn"}`;
  $("contractDot").classList.toggle("live", ready);

  if (!ready) {
    $("systemStatus").textContent = "Testnet contract pending";
    $("contractStatus").textContent = "Interface is live; transaction controls remain locked until the verified MiningAirdrop address is configured.";
  } else {
    $("systemStatus").textContent = "Mining contract connected";
    $("contractStatus").textContent = shortAddress(cfg.miningAddress);
  }

  if (cfg?.mainnetEnabled) {
    $("safetyCopy").textContent = "Mainnet flag is enabled in runtime configuration. Verify audit, multisig and liquidity-lock gates before any production transaction.";
  }
}

async function ensureChain() {
  if (!window.ethereum || !cfg) return;
  const wanted = `0x${Number(cfg.chainId).toString(16)}`;
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current.toLowerCase() === wanted.toLowerCase()) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: wanted }],
    });
  } catch (err) {
    if (err?.code !== 4902) throw err;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: wanted,
        chainName: cfg.chainName,
        nativeCurrency: { name: "BNB", symbol: "tBNB", decimals: 18 },
        rpcUrls: [cfg.rpcUrl],
        blockExplorerUrls: [cfg.explorerUrl],
      }],
    });
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    toast("No EVM wallet detected. Open this page in AETHER Wallet, MetaMask, or another compatible wallet.", true);
    return;
  }

  try {
    await ensureChain();
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    $("connectBtn").textContent = shortAddress(account);

    if (contractReady()) {
      contract = new ethers.Contract(cfg.miningAddress, ABI, signer);
    }
    await refresh();
    toast("Wallet connected.");
  } catch (err) {
    toast(err?.shortMessage || err?.message || "Wallet connection failed.", true);
  }
}

function updateButtons() {
  const usable = Boolean(account && contractReady() && contract);
  const hasPower = Boolean(userInfo?.hasPower);
  const active = Boolean(userInfo?.miningActive);

  $("powerBtn").disabled = !usable || hasPower;
  $("boosterBtn").disabled = !usable || !hasPower || !active;
  $("dailyBtn").disabled = !usable || !hasPower || !active;
  $("vestedBtn").disabled = !usable || !hasPower;

  $("powerState").textContent = !account
    ? "Wallet not connected"
    : !contractReady()
      ? "Waiting for verified Testnet contract"
      : hasPower
        ? "Power active"
        : "Ready to activate";

  $("boosterState").textContent = !contractReady()
    ? "Contract pending"
    : !hasPower
      ? "Power required"
      : active
        ? "Ready"
        : "Mining window inactive";

  $("dailyState").textContent = !contractReady()
    ? "Contract pending"
    : !hasPower
      ? "Power required"
      : active
        ? `Mining day ${userInfo.currentDay} of 180`
        : "Mining window inactive";
}

function paintUser() {
  if (!userInfo) {
    $("dayStat").textContent = "0";
    $("activeStat").textContent = "Not active";
    $("allocatedStat").textContent = "0.000 ATH";
    $("claimedStat").textContent = "0.000 ATH";
    $("pendingStat").textContent = "0.000 ATH";
    $("hashStat").textContent = "0";
    $("multiplierStat").textContent = "Reward multiplier 1.00×";
    $("referralCount").textContent = "0";
    $("referralBonus").textContent = "0%";
    $("refBonusPill").textContent = "+0%";
    $("dailyRewardPreview").textContent = "1.00";
    updateButtons();
    return;
  }

  $("dayStat").textContent = String(userInfo.currentDay);
  $("activeStat").textContent = userInfo.miningActive ? "Mining active" : "Not active";
  $("allocatedStat").textContent = fmtAth(userInfo.totalAllocated);
  $("claimedStat").textContent = fmtAth(userInfo.totalClaimed);
  $("pendingStat").textContent = fmtAth(userInfo.pendingVested);
  $("hashStat").textContent = Number(userInfo.totalHash).toLocaleString();

  const multiplier = Number(userInfo.boosterMultiplier || 10000n) / 10000;
  $("multiplierStat").textContent = `Reward multiplier ${multiplier.toFixed(2)}×`;

  const referrals = Number(userInfo.referralCount);
  const bonusPct = Number(userInfo.referralBonusBps) / 100;
  $("referralCount").textContent = referrals.toLocaleString();
  $("referralBonus").textContent = `${bonusPct.toFixed(0)}%`;
  $("refBonusPill").textContent = `+${bonusPct.toFixed(0)}%`;

  const daily = 1 * (1 + bonusPct / 100) * multiplier;
  $("dailyRewardPreview").textContent = daily.toFixed(2);
  updateButtons();
}

async function refresh() {
  setSystemStatus();

  if (!contractReady()) {
    userInfo = null;
    paintUser();
    return;
  }

  try {
    const readProvider = account
      ? provider
      : new ethers.JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
    const readContract = new ethers.Contract(cfg.miningAddress, ABI, readProvider);

    const price = await readContract.getCurrentPrice();
    $("priceStat").textContent = `$${(Number(price) / 1_000_000).toFixed(3)}`;

    if (account) {
      const u = await readContract.getUserInfo(account);
      userInfo = {
        hasPower: u.hasPower,
        miningActive: u.miningActive,
        startTime: u.startTime,
        lastClaimDay: u.lastClaimDay,
        currentDay: u.currentDay,
        totalAllocated: u.totalAllocated,
        totalClaimed: u.totalClaimed,
        pendingVested: u.pendingVested,
        referralCount: u.referralCount,
        referralBonusBps: u.referralBonusBps,
        boosterMultiplier: u.boosterMultiplier,
        totalHash: u.totalHash,
        positionsCount: u.positionsCount,
      };
    } else {
      userInfo = null;
    }
  } catch (err) {
    console.error(err);
    toast("Unable to read ATH Mining contract. Check network and contract configuration.", true);
    userInfo = null;
  }

  paintUser();
}

async function runTx(label, fn) {
  if (!contract) return;
  try {
    toast(`${label}: confirm the transaction in your wallet.`);
    const tx = await fn();
    toast(`${label}: submitted ${shortAddress(tx.hash)}`);
    await tx.wait();
    toast(`${label}: confirmed.`);
    await refresh();
  } catch (err) {
    toast(err?.shortMessage || err?.reason || err?.message || `${label} failed.`, true);
  }
}

async function buyPower() {
  const raw = $("referrer").value.trim();
  let referrer = ethers.ZeroAddress;
  if (raw) {
    if (!ethers.isAddress(raw)) return toast("Sponsor wallet is not a valid EVM address.", true);
    if (raw.toLowerCase() === account.toLowerCase()) return toast("Self-referral is not allowed.", true);
    referrer = raw;
  }
  await runTx("Power", () => contract.buyPower(referrer, { value: ethers.parseEther(cfg.powerPriceBnb) }));
}

async function boot() {
  try {
    cfg = await fetch("/config", { cache: "no-store" }).then((r) => r.json());
    setSystemStatus();
    paintUser();

    $("connectBtn").addEventListener("click", connectWallet);
    $("powerBtn").addEventListener("click", buyPower);
    $("boosterBtn").addEventListener("click", () =>
      runTx("Booster", () => contract.buyBooster({ value: ethers.parseEther(cfg.boosterPriceBnb) }))
    );
    $("dailyBtn").addEventListener("click", () =>
      runTx("Daily mining", () => contract.claimDaily())
    );
    $("vestedBtn").addEventListener("click", () =>
      runTx("Vested ATH", () => contract.claimAllVested())
    );

    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", async (accounts) => {
        if (!accounts?.length) {
          account = "";
          signer = null;
          contract = null;
          $("connectBtn").textContent = "Connect Wallet";
          await refresh();
          return;
        }
        await connectWallet();
      });
      window.ethereum.on?.("chainChanged", () => window.location.reload());
    }

    await refresh();
  } catch (err) {
    console.error(err);
    toast("Unable to load mining application configuration.", true);
  }
}

boot();
