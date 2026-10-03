(() => {
  "use strict";

  const PRESALE_ABI = [
    "function currentPriceUSD8() view returns (uint256)",
    "function quotePaymentForATH(uint256 athAmount) view returns (uint256)",
    "function buyATH(uint256 athAmount,uint256 maxPaymentAmount) returns (uint256)",
    "function paymentToken() view returns (address)",
    "function totalSoldATH() view returns (uint256)",
    "function remainingATH() view returns (uint256)",
    "function SALE_ALLOCATION_ATH() view returns (uint256)",
    "function paused() view returns (bool)",
    "function soldOut() view returns (bool)"
  ];

  const ERC20_ABI = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
  ];

  const $ = id => document.getElementById(id);
  let cfg;
  let readProvider;
  let readPresale;
  let signer;
  let account = "";
  let presale;
  let payment;
  let paymentAddress = "";
  let paymentSymbol = "Stablecoin";
  let paymentDecimals = 18;
  let currentQuote = 0n;
  let currentMaxPayment = 0n;
  let quoteTimer;
  let saleOpen = false;

  function shortAddress(value) {
    if (!value || value.length < 12) return value || "—";
    return value.slice(0, 6) + "…" + value.slice(-4);
  }

  function validAddress(value) {
    try { return Boolean(value && ethers.isAddress(value) && value !== ethers.ZeroAddress); }
    catch { return false; }
  }

  function fmtAth(value, max = 2) {
    const n = Number(ethers.formatEther(value || 0n));
    return n.toLocaleString(undefined, { maximumFractionDigits: max });
  }

  function fmtPayment(value, max = 4) {
    const n = Number(ethers.formatUnits(value || 0n, paymentDecimals));
    return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: max });
  }

  function setStatus(message, error = false) {
    const el = $("presaleActionStatus");
    if (!el) return;
    el.textContent = message;
    el.style.color = error ? "#e98a79" : "";
  }

  function setContractState(ready, label) {
    const badge = $("presaleContractStatus");
    if (!badge) return;
    badge.textContent = label;
    badge.classList.toggle("live", ready);
  }

  async function ensureChain() {
    if (!window.ethereum || !cfg) return;
    const wanted = "0x" + Number(cfg.chainId).toString(16);
    const current = await window.ethereum.request({ method: "eth_chainId" });
    if (current.toLowerCase() === wanted.toLowerCase()) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: wanted }]
      });
    } catch (err) {
      if (err?.code !== 4902) throw err;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: wanted,
          chainName: cfg.chainName,
          nativeCurrency: { name: "BNB", symbol: Number(cfg.chainId) === 97 ? "tBNB" : "BNB", decimals: 18 },
          rpcUrls: [cfg.rpcUrl],
          blockExplorerUrls: [cfg.explorerUrl]
        }]
      });
    }
  }

  async function syncWallet(requestAccounts = false) {
    if (!window.ethereum) {
      account = "";
      signer = null;
      presale = null;
      payment = null;
      setStatus("Open this page in AETHER Wallet or another compatible EVM wallet.", true);
      return false;
    }

    await ensureChain();
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    if (requestAccounts) await browserProvider.send("eth_requestAccounts", []);
    const accounts = await browserProvider.send("eth_accounts", []);
    if (!accounts.length) {
      account = "";
      signer = null;
      presale = null;
      payment = null;
      setStatus("Connect your wallet to buy ATH on-chain.");
      return false;
    }

    signer = await browserProvider.getSigner();
    account = await signer.getAddress();
    presale = new ethers.Contract(cfg.presaleAddress, PRESALE_ABI, signer);
    payment = new ethers.Contract(paymentAddress, ERC20_ABI, signer);
    return true;
  }

  function parseAthInput() {
    const raw = ($("presaleAthAmount")?.value || "").replace(/,/g, "").trim();
    if (!raw || Number(raw) <= 0) throw new Error("Enter an ATH amount greater than zero.");
    return ethers.parseUnits(raw, 18);
  }

  async function loadPaymentMetadata() {
    paymentAddress = await readPresale.paymentToken();
    if (!validAddress(paymentAddress)) throw new Error("Presale payment token is invalid.");

    if (validAddress(cfg.presalePaymentToken) &&
        paymentAddress.toLowerCase() !== cfg.presalePaymentToken.toLowerCase()) {
      throw new Error("Presale payment token does not match runtime configuration.");
    }

    const readPayment = new ethers.Contract(paymentAddress, ERC20_ABI, readProvider);
    const [symbol, decimals] = await Promise.all([readPayment.symbol(), readPayment.decimals()]);
    paymentSymbol = symbol || "Stablecoin";
    paymentDecimals = Number(decimals);
    $("presalePaymentSymbol").textContent = paymentSymbol;
  }

  async function refreshQuote() {
    if (!readPresale || !saleOpen) {
      currentQuote = 0n;
      currentMaxPayment = 0n;
      updateBuyButton();
      return;
    }

    try {
      const amount = parseAthInput();
      const remaining = await readPresale.remainingATH();
      if (amount > remaining) throw new Error("Requested ATH exceeds the remaining Presale allocation.");

      currentQuote = await readPresale.quotePaymentForATH(amount);
      currentMaxPayment = currentQuote + (currentQuote / 100n) + 1n;

      $("presaleQuote").textContent = fmtPayment(currentQuote) + " " + paymentSymbol;
      $("presaleMaxPayment").textContent = fmtPayment(currentMaxPayment) + " " + paymentSymbol + " (1% protection)";
      await refreshWalletState();
    } catch (err) {
      currentQuote = 0n;
      currentMaxPayment = 0n;
      $("presaleQuote").textContent = "—";
      $("presaleMaxPayment").textContent = "—";
      $("presaleAllowance").textContent = "—";
      setStatus(err?.shortMessage || err?.reason || err?.message || "Unable to quote this order.", true);
      updateBuyButton();
    }
  }

  async function refreshWalletState() {
    if (!account || !payment || !currentMaxPayment) {
      $("presaleWalletBalance").textContent = account ? "Wallet balance: loading…" : "Wallet balance: connect wallet";
      $("presaleAllowance").textContent = account ? "—" : "Wallet not connected";
      updateBuyButton();
      return;
    }

    const [balance, allowance] = await Promise.all([
      payment.balanceOf(account),
      payment.allowance(account, cfg.presaleAddress)
    ]);

    $("presaleWalletBalance").textContent = "Wallet balance: " + fmtPayment(balance) + " " + paymentSymbol;
    $("presaleAllowance").textContent = fmtPayment(allowance) + " " + paymentSymbol;
    updateBuyButton(balance, allowance);
  }

  function updateBuyButton(balance, allowance) {
    const btn = $("presaleBuyBtn");
    if (!btn) return;

    const configured = validAddress(cfg?.presaleAddress) && Boolean(readPresale);
    const hasWallet = Boolean(account && signer && presale && payment);
    const hasQuote = currentQuote > 0n;
    const hasBalance = balance === undefined || balance >= currentMaxPayment;

    btn.disabled = !(configured && saleOpen && hasWallet && hasQuote && hasBalance);

    if (!configured) btn.textContent = "Presale Contract Pending";
    else if (!saleOpen) btn.textContent = "Presale Not Available";
    else if (!hasWallet) btn.textContent = "Connect Wallet to Buy";
    else if (!hasBalance) btn.textContent = "Insufficient " + paymentSymbol;
    else if (allowance !== undefined && allowance < currentMaxPayment) btn.textContent = "Approve & Buy ATH";
    else btn.textContent = "Buy ATH On-chain";
  }

  async function refreshPresale() {
    if (!cfg || !validAddress(cfg.presaleAddress)) {
      saleOpen = false;
      setContractState(false, "Contract pending");
      setStatus("Presale storefront is fail-closed until ATH_PRESALE_ADDRESS is configured.");
      $("presaleContractAddress").textContent = "Presale contract: pending";
      updateBuyButton();
      return;
    }

    readProvider = new ethers.JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
    readPresale = new ethers.Contract(cfg.presaleAddress, PRESALE_ABI, readProvider);

    const [price, sold, remaining, allocation, paused, soldOut] = await Promise.all([
      readPresale.currentPriceUSD8(),
      readPresale.totalSoldATH(),
      readPresale.remainingATH(),
      readPresale.SALE_ALLOCATION_ATH(),
      readPresale.paused(),
      readPresale.soldOut()
    ]);

    await loadPaymentMetadata();

    const pct = allocation > 0n ? Number((sold * 10000n) / allocation) / 100 : 0;
    $("presaleCurrentPrice").textContent = "$" + (Number(price) / 1e8).toFixed(3);
    $("presaleSold").textContent = fmtAth(sold, 0) + " ATH";
    $("presaleRemaining").textContent = fmtAth(remaining, 0) + " ATH";
    $("presaleProgressText").textContent = pct.toFixed(2) + "% of 30M ATH";
    $("presaleProgressBar").style.width = Math.min(100, pct) + "%";
    $("presaleContractAddress").textContent = "Presale contract: " + cfg.presaleAddress;

    saleOpen = !paused && !soldOut;
    if (paused) {
      setContractState(false, "Presale paused");
      setStatus("Presale is currently paused by the contract owner.", true);
    } else if (soldOut) {
      setContractState(false, "Sold out");
      setStatus("Presale allocation is sold out.");
    } else {
      setContractState(true, "On-chain ready");
      setStatus(account ? "Review the contract quote, then confirm the transaction in your wallet." : "Connect wallet to purchase ATH directly on-chain.");
    }

    await refreshQuote();
  }

  async function buyOnChain() {
    const btn = $("presaleBuyBtn");
    try {
      btn.disabled = true;

      const connected = await syncWallet(true);
      if (!connected) return;

      const amount = parseAthInput();
      const freshQuote = await presale.quotePaymentForATH(amount);
      const maxPayment = freshQuote + (freshQuote / 100n) + 1n;
      const balance = await payment.balanceOf(account);

      if (balance < maxPayment) throw new Error("Insufficient " + paymentSymbol + " balance.");

      let allowance = await payment.allowance(account, cfg.presaleAddress);
      if (allowance < maxPayment) {
        setStatus("Approve " + paymentSymbol + " in your wallet. Network gas is paid by the holder.");
        const approveTx = await payment.approve(cfg.presaleAddress, maxPayment);
        setStatus("Approval submitted: " + shortAddress(approveTx.hash));
        await approveTx.wait();

        allowance = await payment.allowance(account, cfg.presaleAddress);
        if (allowance < maxPayment) throw new Error("Stablecoin approval is still insufficient.");
      }

      setStatus("Confirm ATH purchase in your wallet. Network gas is paid by the holder.");
      const tx = await presale.buyATH(amount, maxPayment);
      setStatus("Purchase submitted: " + shortAddress(tx.hash));
      await tx.wait();

      setStatus("ATH purchase confirmed on-chain. Purchased ATH was sent directly to your wallet.");
      await refreshPresale();
    } catch (err) {
      setStatus(err?.shortMessage || err?.reason || err?.message || "Presale purchase failed.", true);
    } finally {
      updateBuyButton();
    }
  }

  async function boot() {
    try {
      cfg = await fetch("/config", { cache: "no-store" }).then(r => r.json());

      document.querySelectorAll(".presale-quick button").forEach(button => {
        button.addEventListener("click", () => {
          $("presaleAthAmount").value = button.dataset.ath || "1000";
          clearTimeout(quoteTimer);
          quoteTimer = setTimeout(refreshQuote, 50);
        });
      });

      $("presaleAthAmount")?.addEventListener("input", () => {
        clearTimeout(quoteTimer);
        quoteTimer = setTimeout(refreshQuote, 250);
      });

      $("presaleBuyBtn")?.addEventListener("click", buyOnChain);

      $("connectBtn")?.addEventListener("click", () => setTimeout(async () => {
        try {
          if (validAddress(cfg.presaleAddress)) {
            await syncWallet(false);
            await refreshQuote();
          }
        } catch {}
      }, 300));

      if (window.ethereum) {
        window.ethereum.on?.("accountsChanged", async () => {
          try {
            await syncWallet(false);
            await refreshQuote();
          } catch {}
        });
        window.ethereum.on?.("chainChanged", () => window.location.reload());
      }

      await refreshPresale();

      if (window.ethereum && validAddress(cfg.presaleAddress)) {
        await syncWallet(false).catch(() => false);
        await refreshQuote();
      }
    } catch (err) {
      console.error("Presale boot failed", err);
      setContractState(false, "Unavailable");
      setStatus(err?.message || "Unable to load Presale storefront.", true);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
