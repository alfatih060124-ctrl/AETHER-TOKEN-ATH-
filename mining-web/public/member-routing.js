(() => {
  "use strict";
  const validPages = new Set(["home","mining","presale","docs","member","member-staking","member-referrals","member-network","member-lifestyle","member-rank","member-history"]);
  const memberPages = new Set(["member","member-staking","member-referrals","member-network","member-lifestyle","member-rank","member-history"]);
  const memberZones = () => [...document.querySelectorAll('[data-member-only="true"], [data-holder-zone="staking"]')];
  const connectButton = () => document.getElementById("connectBtn");
  function walletLooksConnected() {
    const t = String(connectButton()?.textContent || "").replace(/\s/g,"");
    return /^0x[0-9a-fA-F]{3,}.*[0-9a-fA-F]{3,}$/.test(t) || (t.startsWith("0x") && t.includes("…"));
  }
  function currentPage() {
    const requested = new URLSearchParams(location.search).get("page") || "home";
    return validPages.has(requested) ? requested : "home";
  }
  function setPage(page, {replace=false}={}) {
    if (!validPages.has(page)) page = "home";
    document.body.dataset.pageView = page;
    document.querySelectorAll("[data-page-link]").forEach(a => {
      const active = a.dataset.pageLink === page ||
        (page.startsWith("member-") && a.dataset.pageLink === page);
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
    });
    const route = "/?page=" + encodeURIComponent(page);
    if (replace) history.replaceState({page},"",route); else history.pushState({page},"",route);
    renderMemberGate(page);
    window.dispatchEvent(new CustomEvent("aether-page-change",{detail:{page}}));
  }
  function renderMemberGate(page) {
    const gate = document.getElementById("memberAreaGateMessage");
    const status = document.getElementById("memberAreaStatus");
    const connected = walletLooksConnected();
    const onMember = memberPages.has(page);
    const tabs = document.querySelector(".member-page-tabs");
    const isMainMember = page === "member";
    if (gate) gate.textContent = connected
      ? "Wallet connected. Choose a member page above to view your staking and reward information."
      : "Connect your wallet to open the member area. Member pages stay hidden until a wallet is connected.";
    if (status) status.textContent = connected ? "Wallet connected" : "Wallet verification required";
    if (tabs) tabs.hidden = !onMember;
    memberZones().forEach(el => {
      const shouldShow = onMember && connected && (isMainMember || page === "member-staking" || page === "member-referrals" || page === "member-network" || page === "member-lifestyle" || page === "member-rank" || page === "member-history");
      if (el.matches('[data-holder-zone="staking"]')) {
        el.hidden = !(shouldShow && (isMainMember || page === "member-staking" || page === "member-network" || page === "member-lifestyle" || page === "member-rank"));
      } else if (el.id === "referral") {
        el.hidden = !(shouldShow && (isMainMember || page === "member-referrals"));
      } else if (el.id === "leaderboard") {
        el.hidden = !(shouldShow && (isMainMember || page === "member-history"));
      }
    });
    const mainMember = document.getElementById("member-area-shell");
    if (mainMember) mainMember.style.display = onMember ? "block" : "none";
    if (gate) gate.style.display = onMember && !connected ? "block" : "none";
  }
  function onWalletChange() { renderMemberGate(currentPage()); }
  document.addEventListener("click", event => {
    const a = event.target.closest("a[data-page-link]");
    if (!a) return;
    event.preventDefault();
    setPage(a.dataset.pageLink);
  });
  window.addEventListener("popstate", () => { document.body.dataset.pageView = currentPage(); renderMemberGate(currentPage()); });
  connectButton()?.addEventListener("click", () => setTimeout(onWalletChange, 500));
  window.addEventListener("aether-holder-workspace-change", onWalletChange);
  const observer = new MutationObserver(onWalletChange);
  if (connectButton()) observer.observe(connectButton(), {childList:true,subtree:true,characterData:true});
  document.addEventListener("DOMContentLoaded", () => { setPage(currentPage(),{replace:true}); });
  if (document.readyState !== "loading") setPage(currentPage(),{replace:true});
})();