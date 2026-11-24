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
    if (heroButtons) heroButtons.innerHTML = '<a class="btn btn-gold btn-large" href="/staking-member.html" data-staking-cta="dashboard">Open Staking Dashboard →</a><a class="btn btn-dark btn-large" href="#docs" data-staking-cta="notes">Read Protocol Notes</a>';
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
      if (dashboard) { dashboard.textContent = ({en:"Member Area",id:"Area Member",zh:"会员专区",es:"Área de miembros",ar:"منطقة الأعضاء",ru:"Личный кабинет",ko:"회원 영역",ja:"メンバーエリア",vi:"Khu vực thành viên",pt:"Área de membros"})[code] || "Member Area"; dashboard.href="/staking-member.html"+location.search.replace(/^\?rev=[^&]*&?/, "?").replace(/^\?$/, ""); }
      if (notes) notes.textContent = t[3];
    };
    document.getElementById("aetherLangSelect")?.addEventListener("change", applyStakingLanguage);
    window.addEventListener("aether-language-change", applyStakingLanguage);
    window.addEventListener("aether-language-refresh", applyStakingLanguage);
    applyStakingLanguage();

    // Hide obsolete small-leg metrics until the approved cumulative-turnover
    // Rank implementation has passed contract and API verification.
    const obsoleteRankFields = ["stakingSmallLeg","stakingBigLeg","stakingNetworkSmallLeg","stakingNetworkBigLeg"];
    for (const id of obsoleteRankFields) {
      const metric = document.getElementById(id);
      if (metric) metric.closest("div")?.setAttribute("hidden","");
    }
    const rankPanel = document.querySelector(".site-mode-staking .staking-rank-panel");
    if (rankPanel) {
      const obsoleteExplanation = [...rankPanel.querySelectorAll("p")].find(p=>p.textContent.includes("Small-leg turnover ="));
      if (obsoleteExplanation) obsoleteExplanation.setAttribute("hidden","");
      const notice = document.createElement("p");
      notice.className = "staking-note";
      notice.setAttribute("role","status");
      notice.dataset.stakingRankNotice = "true";
      rankPanel.appendChild(notice);
      const notices = {
        id:"Kualifikasi Rank mengacu pada omzet staking pribadi kumulatif dan seluruh omzet grup jaringan (langsung maupun tidak langsung), tanpa menghitung ganda omzet pribadi. Data Rank belum dapat dinyatakan final sebelum kontrak dan API diverifikasi.",
        en:"Rank qualification uses cumulative personal staking turnover plus total downline group turnover (direct and indirect), without double counting personal turnover. Rank data is not final until the contract and API are verified.",
        zh:"等级资格依据个人累计质押业绩以及全部直属和间接团队业绩，不重复计算个人业绩。合约和 API 验证完成前，等级数据不能视为最终结果。",
        es:"La calificación de rango considera el volumen acumulado de staking personal y el volumen total del grupo directo e indirecto, sin contar dos veces el volumen personal. Los datos de rango no son definitivos hasta verificar el contrato y la API.",
        ar:"تعتمد أهلية الرتبة على حجم التخزين الشخصي التراكمي وإجمالي حجم المجموعة المباشرة وغير المباشرة، دون تكرار الحساب الشخصي. بيانات الرتب ليست نهائية حتى التحقق من العقد وواجهة API.",
        ru:"Квалификация ранга учитывает накопленный личный оборот стейкинга и оборот всей прямой и косвенной сети без двойного учёта личного оборота. Данные ранга не окончательны до проверки контракта и API.",
        ko:"등급 자격은 누적 개인 스테이킹 실적과 직간접 전체 그룹 실적을 합산하며 개인 실적을 중복 계산하지 않습니다. 계약과 API 검증 전까지 등급 데이터는 확정되지 않습니다.",
        ja:"ランク資格は個人の累積ステーキング実績と直属・間接グループ全体の実績を合算し、個人実績の二重計上を行いません。コントラクトと API の検証が完了するまでランクデータは確定しません。",
        vi:"Điều kiện cấp bậc dựa trên tổng doanh số staking cá nhân tích lũy và toàn bộ doanh số nhóm trực tiếp, gián tiếp, không tính trùng doanh số cá nhân. Dữ liệu cấp bậc chưa được chốt cho đến khi xác minh hợp đồng và API.",
        pt:"A qualificação do nível considera o volume acumulado de staking pessoal e todo o volume do grupo direto e indireto, sem duplicar o volume pessoal. Os dados de nível só serão finais após a verificação do contrato e da API."
      };
      const refreshRankNotice=()=>{
        const lang=document.getElementById("aetherLangSelect")?.value||"en";
        notice.textContent=notices[lang]||notices.en;
      };
      document.getElementById("aetherLangSelect")?.addEventListener("change",refreshRankNotice);
      window.addEventListener("aether-language-change",refreshRankNotice);
      refreshRankNotice();
    }
    const stakingTranslations = document.createElement("script");
    stakingTranslations.src = "/staking-public-i18n.js?v=20261123";
    stakingTranslations.defer = true;
    document.body.appendChild(stakingTranslations);
  }
})();