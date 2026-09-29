(() => {
  const state = { open: false, busy: false };

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function stripTags(value = "") {
    const tmp = document.createElement("div");
    tmp.innerHTML = String(value);
    return (tmp.textContent || tmp.innerText || "").trim();
  }

  function addMessage(role, text, mode = "") {
    const list = document.getElementById("aetherAiMessages");
    if (!list) return;
    const wrap = el("div", `aether-ai-msg ${role}`);
    const bubble = el("div", "aether-ai-bubble");
    bubble.textContent = stripTags(text);
    wrap.appendChild(bubble);
    if (mode && role === "assistant") {
      wrap.appendChild(el("small", "aether-ai-mode", mode === "ai" ? "AETHER AI" : "AETHER Knowledge"));
    }
    list.appendChild(wrap);
    list.scrollTop = list.scrollHeight;
  }

  async function ask(question) {
    const input = document.getElementById("aetherAiInput");
    const sendBtn = document.getElementById("aetherAiSend");
    const q = String(question || input?.value || "").trim();
    if (!q || state.busy) return;

    state.busy = true;
    if (input) input.value = "";
    if (sendBtn) sendBtn.disabled = true;
    addMessage("user", q);

    const typing = el("div", "aether-ai-msg assistant");
    typing.id = "aetherAiTyping";
    typing.appendChild(el("div", "aether-ai-bubble typing", "AETHER AI is checking the best guidance…"));
    document.getElementById("aetherAiMessages")?.appendChild(typing);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await response.json();
      document.getElementById("aetherAiTyping")?.remove();
      if (!response.ok || !data.ok) {
        addMessage("assistant", data.error || "AETHER AI is temporarily unavailable.");
      } else {
        addMessage("assistant", data.answer, data.mode);
      }
    } catch (error) {
      document.getElementById("aetherAiTyping")?.remove();
      addMessage("assistant", "I could not reach the assistant service. You can still use the official links below.");
    } finally {
      state.busy = false;
      if (sendBtn) sendBtn.disabled = false;
      input?.focus();
    }
  }

  function build() {
    if (document.getElementById("aetherAiLauncher")) return;

    const launcher = el("button", "aether-ai-launcher");
    launcher.id = "aetherAiLauncher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open AETHER AI");
    launcher.innerHTML = '<span class="aether-ai-orb">A</span><span class="aether-ai-launch-text"><b>AETHER AI</b><small>Holder Assistant</small></span>';

    const panel = el("section", "aether-ai-panel");
    panel.id = "aetherAiPanel";
    panel.setAttribute("aria-label", "AETHER AI Holder Assistant");

    const head = el("div", "aether-ai-head");
    head.innerHTML = '<div><strong>AETHER AI</strong><span>Holder Guidance Center</span></div><button type="button" id="aetherAiClose" aria-label="Close">×</button>';

    const intro = el("div", "aether-ai-intro");
    intro.innerHTML = '<b>Ask about AETHER.</b><span>Mining, Wallet, ATH, referral, staking, DApps, network/RPC, security and ecosystem navigation.</span>';

    const quick = el("div", "aether-ai-quick");
    [
      ["How do I start mining?", "Start Mining"],
      ["What can AETHER Wallet do?", "Wallet Features"],
      ["How do ATH referrals work?", "Referral"],
      ["How do I stay safe?", "Security"],
      ["How does Swap / DEX work?", "Swap / DEX"],
      ["How do I connect a wallet?", "Connect Wallet"],
    ].forEach(([q, label]) => {
      const b = el("button", "aether-ai-chip", label);
      b.type = "button";
      b.addEventListener("click", () => ask(q));
      quick.appendChild(b);
    });

    const messages = el("div", "aether-ai-messages");
    messages.id = "aetherAiMessages";

    const links = el("div", "aether-ai-links");
    links.innerHTML = [
      '<a href="https://wallet.aether.boats/" target="_blank" rel="noopener">AETHER Wallet</a>',
      '<a href="https://mining.aether.boats/" target="_blank" rel="noopener">ATH Mining</a>',
      '<a href="https://aether.boats/" target="_blank" rel="noopener">AETHER</a>',
      '<a href="https://t.me/Aetther_bot" target="_blank" rel="noopener">Telegram Bot</a>',
    ].join("");

    const form = el("form", "aether-ai-form");
    form.innerHTML = '<textarea id="aetherAiInput" maxlength="800" rows="2" placeholder="Ask AETHER AI…"></textarea><button id="aetherAiSend" type="submit">Send</button>';
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      ask();
    });

    const safety = el("div", "aether-ai-safety", "Never share a seed phrase, private key, mnemonic, password, or recovery words.");

    panel.append(head, intro, quick, messages, links, form, safety);
    document.body.append(launcher, panel);

    addMessage(
      "assistant",
      "Welcome to AETHER AI. Tell me what you want to do and I will guide you through the relevant AETHER service. I never need your seed phrase or private key.",
      "knowledge"
    );

    const toggle = (open) => {
      state.open = open;
      panel.classList.toggle("open", open);
      launcher.classList.toggle("hidden", open);
      if (open) setTimeout(() => document.getElementById("aetherAiInput")?.focus(), 120);
    };

    launcher.addEventListener("click", () => toggle(true));
    document.getElementById("aetherAiClose")?.addEventListener("click", () => toggle(false));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build, { once: true });
  } else {
    build();
  }
})();