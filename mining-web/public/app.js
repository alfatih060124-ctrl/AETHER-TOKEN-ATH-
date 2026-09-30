const $ = (id) => document.getElementById(id);

const ABI = [
  "function buyPower(address referrer) payable",
  "function buyPowerBooster() payable",
  "function buyDoublePowerBooster() payable",
  "function claimDaily()",
  "function claimAllVested()",
  "function powerBoosterPrice() view returns (uint256)",
  "function doublePowerBoosterPrice() view returns (uint256)",
  "function getUserInfo(address account) view returns (bool hasPower,bool miningActive,uint256 startTime,uint256 lastClaimDay,uint256 currentDay,uint256 totalAllocated,uint256 totalClaimed,uint256 pendingVested,uint256 referralCount,uint256 referralBonusBps,uint256 boosterMultiplier,uint256 totalHash,uint256 positionsCount)",
  "function getDailyRewardStatus(address account,uint256 dayId) view returns (uint256 reward,uint256 referralBonusBps,uint256 boosterMultiplier,uint256 claimOpensAt,uint256 claimDeadline,uint8 status)",
  "function getVestingSummary(address account) view returns (uint256 positionsCount,uint256 totalAllocated,uint256 totalClaimed,uint256 totalBurned,uint256 totalStillVesting)",
  "function getVestingDashboard(address account,uint256 index) view returns (uint256 amount,uint256 startTime,uint8 currentCycle,uint256 claimableNow,uint256 unlock30,uint256 unlock60,uint256 unlock90,uint256 cyclePrincipal,uint256 burnedSoFar,uint256 finalPrincipal,uint256 finalDistribution,bool finalSettled)",
  "function getVestingCyclePreview(address account,uint256 index,uint8 cycle) view returns (uint256 incomingAmount,uint256 burnedAmount,uint256 unlock30,uint256 unlock60,uint256 unlock90,uint256 rolloverAmount,uint256 scheduledStart,bool entered)",
  "function previewFinalSettlement(address account,uint256 index) view returns (uint256 principal,uint256 burn60,uint256 distribution40,uint256 scheduledAt,bool settled)",
  "function getCurrentPrice() view returns (uint256 priceInMicroUSD)",
  "function contractBalance() view returns (uint256)"
];

let cfg = null;
let provider = null;
let signer = null;
let account = "";
let contract = null;
let readContract = null;
let userInfo = null;
let dailyRewardInfo = null;
let vestingSummary = null;
let selectedPositionIndex = null;
let powerBoosterPrice = 0n;
let doublePowerBoosterPrice = 0n;
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
    return `${Number(ethers.formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ATH`;
  } catch {
    return "0.000 ATH";
  }
}

function fmtUtc(timestamp) {
  if (!timestamp || Number(timestamp) <= 0) return "—";
  return new Date(Number(timestamp) * 1000).toLocaleString("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }) + " UTC";
}

function rewardStatusLabel(status) {
  return {
    0: "NOT ELIGIBLE",
    1: "CLAIMABLE",
    2: "CLAIMED",
    3: "EXPIRED",
    4: "PENDING 00:05 UTC",
  }[Number(status)] || "UNKNOWN";
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
  const referrals = Number(userInfo?.referralCount || 0n);
  const multiplier = Number(userInfo?.boosterMultiplier || 10000n) / 10000;
  const rewardStatus = Number(dailyRewardInfo?.status || 0);

  $("powerBtn").disabled = !usable || hasPower;
  $("boosterBtn").disabled = !usable || !hasPower || !active || multiplier > 1;
  $("doubleBoosterBtn").disabled = !usable || !hasPower || !active || referrals < 5 || multiplier !== 2;
  $("dailyBtn").disabled = !usable || rewardStatus !== 1;
  $("vestedBtn").disabled = !usable || !hasPower || !Number(userInfo?.positionsCount || 0n);

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
      : multiplier >= 6
        ? "Double Power active"
        : multiplier === 2
          ? "Power Booster active"
          : active
            ? "Ready — 30 day duration"
            : "Mining window inactive";

  $("doubleBoosterState").textContent = !contractReady()
    ? "Contract pending"
    : referrals < 5
      ? `${referrals}/5 referrals — not eligible yet`
      : multiplier >= 6
        ? "Double Power active until Power Booster expires"
        : multiplier === 2
          ? "Eligible — follows current Power Booster expiry"
          : "Activate Power Booster first";

  $("dailyState").textContent = !contractReady()
    ? "Contract pending"
    : !hasPower
      ? "Power required"
      : rewardStatus === 1
        ? `CLAIMABLE · Day ${userInfo.currentDay}/180 · closes 23:59:59 UTC`
        : rewardStatus === 2
          ? "CLAIMED for this UTC day"
          : rewardStatus === 4
            ? "Opens at 00:05 UTC"
            : active
              ? "Not claimable for this UTC day"
              : "Mining window inactive";
}

function paintUser() {
  if (!userInfo) {
    $("dayStat").textContent = "0";
    $("activeStat").textContent = "Not active";
    $("allocatedStat").textContent = "0.000 ATH";
    $("claimedStat").textContent = "0.000 ATH";
    $("pendingStat").textContent = "0.000 ATH";
    $("burnedStat").textContent = "0.000 ATH";
    $("hashStat").textContent = "0";
    $("multiplierStat").textContent = "Reward multiplier 1.00×";
    $("referralCount").textContent = "0";
    $("referralBonus").textContent = "0%";
    $("refBonusPill").textContent = "+0%";
    $("dailyRewardPreview").textContent = "1.00";
    $("dailyRewardMirror").textContent = "1.0000";
    $("rewardStatus").textContent = "Not available";
    $("rewardOnChain").textContent = "0.000 ATH";
    $("rewardFormula").textContent = "1 ATH × referral × booster";
    $("rewardDeadline").textContent = "—";
    updateButtons();
    return;
  }

  $("dayStat").textContent = String(userInfo.currentDay);
  $("activeStat").textContent = userInfo.miningActive ? "Mining active" : "Not active";
  $("allocatedStat").textContent = fmtAth(userInfo.totalAllocated);
  $("claimedStat").textContent = fmtAth(userInfo.totalClaimed);
  $("pendingStat").textContent = fmtAth(userInfo.pendingVested);
  $("burnedStat").textContent = fmtAth(vestingSummary?.totalBurned || 0n);
  $("hashStat").textContent = Number(userInfo.totalHash).toLocaleString();

  const multiplier = Number(userInfo.boosterMultiplier || 10000n) / 10000;
  $("multiplierStat").textContent = `Reward multiplier ${multiplier.toFixed(2)}×`;

  const referrals = Number(userInfo.referralCount);
  const bonusPct = Number(userInfo.referralBonusBps) / 100;
  $("referralCount").textContent = referrals.toLocaleString();
  $("referralBonus").textContent = `${bonusPct.toFixed(0)}%`;
  $("refBonusPill").textContent = `+${bonusPct.toFixed(0)}%`;

  const dailyReward = dailyRewardInfo?.reward || 0n;
  const dailyNumber = Number(ethers.formatEther(dailyReward || 0n));
  $("dailyRewardPreview").textContent = dailyNumber ? dailyNumber.toFixed(2) : "0.00";
  $("dailyRewardMirror").textContent = dailyNumber ? dailyNumber.toFixed(4) : "0.0000";

  if (dailyRewardInfo) {
    const snapshotMultiplier = Number(dailyRewardInfo.boosterMultiplier || 10000n) / 10000;
    const snapshotBonus = Number(dailyRewardInfo.referralBonusBps || 0n) / 100;
    const referralFactor = (1 + snapshotBonus / 100).toFixed(2);
    $("rewardStatus").textContent = rewardStatusLabel(dailyRewardInfo.status);
    $("rewardOnChain").textContent = fmtAth(dailyRewardInfo.reward);
    $("rewardFormula").textContent = snapshotMultiplier >= 6
      ? `1 ATH × ${referralFactor} referral × 2 Power × 3 Double`
      : snapshotMultiplier >= 2
        ? `1 ATH × ${referralFactor} referral × 2 Power`
        : `1 ATH × ${referralFactor} referral`;
    $("rewardDeadline").textContent = fmtUtc(dailyRewardInfo.claimDeadline);
  }

  updateButtons();
}

function clearVestingDetail() {
  $("positionAmount").textContent = "0.000 ATH";
  $("position30").textContent = "0.000 ATH";
  $("position60").textContent = "0.000 ATH";
  $("position90").textContent = "0.000 ATH";
  $("positionCyclePrincipal").textContent = "0.000 ATH";
  $("positionCurrentCycle").textContent = "0 / 12";
  $("positionClaimable").textContent = "0.000 ATH";
  $("positionBurned").textContent = "0.000 ATH";
  $("cycleIncoming").textContent = "0.000 ATH";
  $("cycleBurn").textContent = "0.000 ATH";
  $("cycle30").textContent = "0.000 ATH";
  $("cycle60").textContent = "0.000 ATH";
  $("cycle90").textContent = "0.000 ATH";
  $("cycleRollover").textContent = "0.000 ATH";
  $("cycleStart").textContent = "—";
  $("cycleEntered").textContent = "Not entered";
  $("finalBurn").textContent = "0.000 ATH";
  $("finalDistribution").textContent = "0.000 ATH";
  $("finalSettlementAt").textContent = "—";
}

function syncPositionSelect() {
  const select = $("vestingPositionSelect");
  const count = Number(userInfo?.positionsCount || 0n);

  if (!count) {
    selectedPositionIndex = null;
    select.innerHTML = '<option value="">No positions yet</option>';
    clearVestingDetail();
    return;
  }

  if (selectedPositionIndex === null || selectedPositionIndex >= count) {
    selectedPositionIndex = count - 1;
  }

  select.innerHTML = Array.from({ length: count }, (_, n) => count - 1 - n)
    .map((index) => `<option value="${index}">Claim Position #${index + 1}${index === count - 1 ? " · Latest" : ""}</option>`)
    .join("");
  select.value = String(selectedPositionIndex);
}

async function loadSelectedVesting() {
  if (!readContract || !account || selectedPositionIndex === null) {
    clearVestingDetail();
    return;
  }

  const cycle = Number($("cycleSelect").value || 1);
  const [position, cyclePreview, finalPreview] = await Promise.all([
    readContract.getVestingDashboard(account, selectedPositionIndex),
    readContract.getVestingCyclePreview(account, selectedPositionIndex, cycle),
    readContract.previewFinalSettlement(account, selectedPositionIndex),
  ]);

  $("positionAmount").textContent = fmtAth(position.amount);
  $("position30").textContent = fmtAth(position.unlock30);
  $("position60").textContent = fmtAth(position.unlock60);
  $("position90").textContent = fmtAth(position.unlock90);
  $("positionCyclePrincipal").textContent = fmtAth(position.cyclePrincipal);
  $("positionCurrentCycle").textContent = `${Number(position.currentCycle)} / 12`;
  $("positionClaimable").textContent = fmtAth(position.claimableNow);
  $("positionBurned").textContent = fmtAth(position.burnedSoFar);

  $("cycleIncoming").textContent = fmtAth(cyclePreview.incomingAmount);
  $("cycleBurn").textContent = fmtAth(cyclePreview.burnedAmount);
  $("cycle30").textContent = fmtAth(cyclePreview.unlock30);
  $("cycle60").textContent = fmtAth(cyclePreview.unlock60);
  $("cycle90").textContent = fmtAth(cyclePreview.unlock90);
  $("cycleRollover").textContent = fmtAth(cyclePreview.rolloverAmount);
  $("cycleStart").textContent = fmtUtc(cyclePreview.scheduledStart);
  $("cycleEntered").textContent = cyclePreview.entered ? "ENTERED ON-CHAIN" : "Scheduled / not entered";

  $("finalBurn").textContent = fmtAth(finalPreview.burn60);
  $("finalDistribution").textContent = fmtAth(finalPreview.distribution40);
  $("finalSettlementAt").textContent = fmtUtc(finalPreview.scheduledAt);
}

async function refresh() {
  setSystemStatus();

  if (!contractReady()) {
    readContract = null;
    userInfo = null;
    dailyRewardInfo = null;
    vestingSummary = null;
    selectedPositionIndex = null;
    syncPositionSelect();
    paintUser();
    return;
  }

  try {
    const readProvider = account
      ? provider
      : new ethers.JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
    readContract = new ethers.Contract(cfg.miningAddress, ABI, readProvider);

    const [price, powerPrice, doublePrice] = await Promise.all([
      readContract.getCurrentPrice(),
      readContract.powerBoosterPrice(),
      readContract.doublePowerBoosterPrice(),
    ]);

    powerBoosterPrice = powerPrice;
    doublePowerBoosterPrice = doublePrice;
    $("priceStat").textContent = `$${(Number(price) / 1_000_000).toFixed(3)}`;
    $("powerBoosterPriceText").textContent = `${ethers.formatEther(powerPrice)} BNB`;
    $("doubleBoosterPriceText").textContent = `${ethers.formatEther(doublePrice)} BNB`;

    if (account) {
      const latestBlock = await readProvider.getBlock("latest");
      if (!latestBlock) throw new Error("Unable to read latest block timestamp");
      const dayId = Math.floor(Number(latestBlock.timestamp) / 86400);

      const [u, reward, summary] = await Promise.all([
        readContract.getUserInfo(account),
        readContract.getDailyRewardStatus(account, dayId),
        readContract.getVestingSummary(account),
      ]);

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

      dailyRewardInfo = {
        reward: reward.reward,
        referralBonusBps: reward.referralBonusBps,
        boosterMultiplier: reward.boosterMultiplier,
        claimOpensAt: reward.claimOpensAt,
        claimDeadline: reward.claimDeadline,
        status: reward.status,
      };

      vestingSummary = {
        positionsCount: summary.positionsCount,
        totalAllocated: summary.totalAllocated,
        totalClaimed: summary.totalClaimed,
        totalBurned: summary.totalBurned,
        totalStillVesting: summary.totalStillVesting,
      };

      syncPositionSelect();
      await loadSelectedVesting();
    } else {
      userInfo = null;
      dailyRewardInfo = null;
      vestingSummary = null;
      selectedPositionIndex = null;
      syncPositionSelect();
    }
  } catch (err) {
    console.error(err);
    toast("Unable to read ATH Mining contract. Check network and contract configuration.", true);
    userInfo = null;
    dailyRewardInfo = null;
    vestingSummary = null;
    selectedPositionIndex = null;
    syncPositionSelect();
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
      runTx("Power Booster", () => contract.buyPowerBooster({ value: powerBoosterPrice }))
    );
    $("doubleBoosterBtn").addEventListener("click", () =>
      runTx("Double Power Booster", () => contract.buyDoublePowerBooster({ value: doublePowerBoosterPrice }))
    );
    $("dailyBtn").addEventListener("click", () =>
      runTx("Daily mining", () => contract.claimDaily())
    );
    $("vestedBtn").addEventListener("click", () =>
      runTx("Vested ATH", () => contract.claimAllVested())
    );
    $("vestingPositionSelect").addEventListener("change", async (event) => {
      selectedPositionIndex = event.target.value === "" ? null : Number(event.target.value);
      await loadSelectedVesting();
    });
    $("cycleSelect").addEventListener("change", loadSelectedVesting);

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


const athPublicInfoScript = document.createElement("script");
athPublicInfoScript.src = "/ath-info.js";
athPublicInfoScript.defer = true;
athPublicInfoScript.addEventListener("load", () => {
  const athLuxuryPolish = document.createElement("link");
  athLuxuryPolish.rel = "stylesheet";
  athLuxuryPolish.href = "/luxury-polish.css";
  document.head.appendChild(athLuxuryPolish);
});
document.head.appendChild(athPublicInfoScript);

const aetherAiStyle = document.createElement("link");
aetherAiStyle.rel = "stylesheet";
aetherAiStyle.href = "/aether-ai.css";
document.head.appendChild(aetherAiStyle);

const aetherAiScript = document.createElement("script");
aetherAiScript.src = "/aether-ai.js";
aetherAiScript.defer = true;
document.head.appendChild(aetherAiScript);