(() => {
  const site = document.body.dataset.publicSite;
  if (site !== "mining" && site !== "staking") return;
  const title = document.querySelector("head title");
  const description = document.querySelector('meta[name="description"]');
  const heroTitle = document.querySelector(".hero-copy h2");
  const heroCopy = document.querySelector(".hero-copy p");
  const heroButtons = document.querySelector(".hero-buttons");
  const brand = document.querySelector(".brand");

  if (site === "mining") {
    if (title) title.textContent = "AETHER ATH Mining — Official Mining Portal";
    if (description) description.content = "Official AETHER ATH Mining portal for mining power, boosters, rewards, referrals and vesting.";
    if (heroTitle) heroTitle.textContent = "Mine. Earn. Grow with AETHER.";
    if (heroCopy) heroCopy.textContent = "Enter the dedicated AETHER ATH Mining portal to manage mining power, boosters, daily rewards, referrals and vesting.";
    if (brand) brand.setAttribute("aria-label", "AETHER ATH Mining");
  } else {
    if (title) title.textContent = "AETHER ATH Staking — Official Staking Portal";
    if (description) description.content = "Official AETHER ATH Staking portal for staking positions, rewards, referrals, network ranks, Lifestyle Bonus and rank salary.";
    if (heroTitle) heroTitle.textContent = "Stake. Build. Grow Together.";
    if (heroCopy) heroCopy.textContent = "Use the dedicated AETHER ATH Staking portal to manage stake positions, daily rewards, direct referrals, network ranks, Lifestyle Bonus and rank salary.";
    if (brand) brand.setAttribute("aria-label", "AETHER ATH Staking");
    if (heroButtons) heroButtons.innerHTML = '<a class="btn btn-gold btn-large" href="#staking" data-staking-cta="dashboard">Open Staking Dashboard →</a><a class="btn btn-dark btn-large" href="#docs" data-staking-cta="notes">Read Protocol Notes</a>';
    const localized = {
      en: ["Stake. Build. Grow Together.", "Use the dedicated AETHER ATH Staking portal to manage stake positions, daily rewards, direct referrals, network ranks, Lifestyle Bonus and rank salary.", "Open Staking Dashboard →", "Read Protocol Notes"],
      id: ["Staking. Bangun Jaringan. Tumbuh Bersama.", "Kelola posisi staking ATH, reward harian, referral langsung, peringkat jaringan, Lifestyle Bonus, dan gaji peringkat melalui portal AETHER Staking.", "Buka Dasbor Staking →", "Baca Informasi Protokol"],
      zh: ["质押、共建、共同成长。", "通过 AETHER ATH 质押门户管理质押仓位、每日奖励、直接推荐、网络等级、Lifestyle Bonus 和等级薪酬。", "打开质押仪表板 →", "阅读协议说明"],
      es: ["Haz staking. Construye. Crezcamos juntos.", "Gestiona posiciones de staking ATH, recompensas diarias, referidos directos, rangos de red, Lifestyle Bonus y salarios por rango.", "Abrir panel de staking →", "Leer notas del protocolo"],
      ar: ["خزّن. ابنِ. انمُ معاً.", "أدر مراكز تخزين ATH والمكافآت اليومية والإحالات المباشرة ورتب الشبكة ومكافأة Lifestyle Bonus ورواتب الرتب.", "افتح لوحة التخزين ←", "اقرأ ملاحظات البروتوكول"],
      ru: ["Стейкинг. Развитие. Рост вместе.", "Управляйте позициями ATH, ежедневными наградами, прямыми рефералами, рангами сети, Lifestyle Bonus и зарплатой по рангу.", "Открыть панель стейкинга →", "Читать описание протокола"],
      ko: ["스테이킹. 네트워크 구축. 함께 성장.", "AETHER ATH 스테이킹 포털에서 포지션, 일일 보상, 직접 추천, 네트워크 등급, Lifestyle Bonus 및 등급 급여를 관리하세요.", "스테이킹 대시보드 열기 →", "프로토콜 안내 읽기"],
      ja: ["ステーキング。つながり。共に成長。", "AETHER ATHポータルでステーキング、日次報酬、直接紹介、ネットワークランク、Lifestyle Bonus、ランク報酬を管理します。", "ステーキング画面を開く →", "プロトコル説明を読む"],
      vi: ["Staking. Xây dựng. Cùng phát triển.", "Quản lý vị thế staking ATH, thưởng hằng ngày, giới thiệu trực tiếp, cấp bậc mạng lưới, Lifestyle Bonus và lương cấp bậc.", "Mở bảng điều khiển staking →", "Đọc ghi chú giao thức"],
      pt: ["Faça staking. Construa. Cresça junto.", "Gerencie posições de staking ATH, recompensas diárias, indicações diretas, níveis da rede, Lifestyle Bonus e salários por nível.", "Abrir painel de staking →", "Ler notas do protocolo"]
    };
    const applyStakingLanguage = () => {
      const selector = document.getElementById("aetherLangSelect");
      const code = selector?.value || document.documentElement.lang || "en";
      const t = localized[code] || localized.en;
      if (heroTitle) heroTitle.textContent = t[0];
      if (heroCopy) heroCopy.textContent = t[1];
      const dashboard = heroButtons?.querySelector('[data-staking-cta="dashboard"]');
      const notes = heroButtons?.querySelector('[data-staking-cta="notes"]');
      if (dashboard) dashboard.textContent = t[2];
      if (notes) notes.textContent = t[3];
    };
    document.getElementById("aetherLangSelect")?.addEventListener("change", applyStakingLanguage);
    window.addEventListener("aether-language-change", applyStakingLanguage);
    window.addEventListener("aether-language-refresh", applyStakingLanguage);
    applyStakingLanguage();
  }
})();