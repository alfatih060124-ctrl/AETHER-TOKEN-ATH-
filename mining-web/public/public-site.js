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
    document.querySelectorAll('.main-nav a[href="/staking-member.html"]').forEach(a=>a.remove());
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
      if (dashboard) dashboard.remove();
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
;(() => {
  if(document.body.dataset.publicSite!=="staking")return;
  const button=document.getElementById("connectBtn");if(!button)return;
  const providers=new Map();
  window.addEventListener("eip6963:announceProvider",e=>{const d=e.detail;if(d?.info?.uuid&&d.provider?.request)providers.set(d.info.uuid,d);});
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  const lang=()=>document.getElementById("aetherLangSelect")?.value==="id";
  const txt=(id,en)=>lang()?id:en;
  const dialog=document.createElement("dialog");dialog.className="ath-wallet-picker";dialog.setAttribute("aria-label","Connect Wallet");
  const title=document.createElement("h2"),close=document.createElement("button"),list=document.createElement("div"),status=document.createElement("p");
  close.type="button";close.textContent="×";close.setAttribute("aria-label","Close");close.className="ath-wallet-close";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  dialog.append(close,title,status,list);document.body.append(dialog);
  close.onclick=()=>dialog.close();
  const target=()=>{const u=new URL(location.origin+"/");const q=new URLSearchParams(location.search);for(const key of ["ref","sponsor"]){const v=q.get(key);if(/^0x[0-9a-f]{40}$/i.test(v||""))u.searchParams.set(key,v);}return u.href;};
  // First-party SDK handles the app link and callback format. Never treat an
  // address returned by a wallet as an authenticated member session.
  const aetherSDK=document.createElement("script");
  aetherSDK.src="https://wallet.aether.boats/sdk/aether-wallet.js";
  aetherSDK.async=true;
  document.head.append(aetherSDK);
  // Official SDK is a deep-link launcher, not a Promise returning an account.
  // The callback is only an account hint; the server must verify the signature.
  let externalConnection=null, handlingCallback=false;
  const pendingPrefix="ath-staking-wallet-request:";
  const hintKey="ath-staking-wallet-hint";
  const callbackURL=()=>{const u=new URL(location.href);u.hash="";return u.href;};
  function rememberRequest(request,kind,extra={}){
    const data={kind,expires:Date.now()+300000,origin:location.origin,...extra};
    localStorage.setItem(pendingPrefix+request.requestId,JSON.stringify(data));
  }
  function takeRequest(id){
    if(typeof id!=="string"||!/^[a-z0-9-]{1,100}$/i.test(id))return null;
    try{const key=pendingPrefix+id,raw=localStorage.getItem(key);localStorage.removeItem(key);const d=JSON.parse(raw||"null");return d&&d.origin===location.origin&&d.expires>Date.now()?d:null;}catch{return null;}
  }
  function clearCallback(){const u=new URL(location.href);u.hash="";history.replaceState(null,"",u.pathname+u.search);}
  function setExternal(address,referral,expires=Date.now()+300000){
    externalConnection={address,referral,expires};
    try{sessionStorage.setItem(hintKey,JSON.stringify(externalConnection));}catch{}
    paintConnection();
  }
  function clearExternal(){externalConnection=null;try{sessionStorage.removeItem(hintKey);}catch{}paintConnection();}
  function restoreExternal(){
    try{const d=JSON.parse(sessionStorage.getItem(hintKey)||"null");if(d&&validAccount(d.address)&&d.expires>Date.now())externalConnection=d;}catch{}
  }
  function showWalletStatus(message){if(!dialog.open)dialog.showModal();title.textContent=txt("Verifikasi Login","Verify Login");status.textContent=message;}
  function connectAetherApp(){
    if(typeof window.AetherWallet?.createConnectLink!=="function"){
      showWalletStatus(txt("SDK AETHER Wallet belum tersedia. Coba lagi.","AETHER Wallet SDK unavailable. Try again."));return;
    }
    try{
      const params=new URLSearchParams(location.search);
      const referral=params.get("ref")||params.get("sponsor")||undefined;
      const request=window.AetherWallet.createConnectLink({chain:"bsc",callback:callbackURL()});
      rememberRequest(request,"connect",{referral});
      showWalletStatus(txt("Setujui koneksi di AETHER Wallet, lalu kembali ke Chrome.","Approve connection in AETHER Wallet, then return to Chrome."));
      location.assign(request.url);
    }catch{showWalletStatus(txt("Tidak dapat membuka AETHER Wallet atau penyimpanan browser tidak tersedia.","Unable to open AETHER Wallet or browser storage is unavailable."));}
  }
  function callbackSignature(value,encoding){
    if(typeof value!=="string"||value.length>256)return null;
    if(/^0x[0-9a-f]{130}$/i.test(value))return value;
    if(/^[0-9a-f]{130}$/i.test(value))return "0x"+value;
    if(!/^(base64|base64url)$/i.test(encoding||""))return null;
    try{const raw=value.replace(/-/g,"+").replace(/_/g,"/");const bytes=atob(raw+"=".repeat((4-raw.length%4)%4));return bytes.length===65?"0x"+Array.from(bytes,x=>x.charCodeAt(0).toString(16).padStart(2,"0")).join(""):null;}catch{return null;}
  }
  async function verifyExternal(){
    if(authenticating||!externalConnection)return;
    if(externalConnection.expires<=Date.now()){clearExternal();showWalletStatus(txt("Sesi koneksi kedaluwarsa. Hubungkan wallet kembali.","Connection expired. Connect your wallet again."));return;}
    if(typeof window.AetherWallet?.createSignMessageLink!=="function"){list.replaceChildren();row(txt("Coba lagi","Try again"),verifyExternal,"aether");showWalletStatus(txt("SDK tanda tangan belum siap. Coba lagi.","Signing SDK not ready. Try again."));return;}
    authenticating=true;
    try{
      const {address,referral}=externalConnection;
      showWalletStatus(txt("Memeriksa akun dan referral...","Checking account and referral..."));
      const challenge=await memberPost("/api/member/challenge",{wallet:address,referral});
      validateChallenge(challenge,address);
      const request=window.AetherWallet.createSignMessageLink({chain:"bsc",address,message:challenge.message,callback:callbackURL()});
      rememberRequest(request,"sign",{address,nonce:challenge.nonce,referral});
      // Render an explicit click target so Chrome has a fresh user gesture.
      list.replaceChildren();
      row(txt("Buka AETHER Wallet & tanda tangani","Open AETHER Wallet & sign"),()=>{location.assign(request.url);},"aether");
      status.textContent=txt("Tanda tangani pesan login saja. Tidak ada transaksi atau persetujuan token.","Sign the login message only. No transaction or token approval.");
    }catch(e){showWalletStatus(authError(e));}finally{authenticating=false;}
  }
  async function handleAetherCallback(){
    if(handlingCallback)return;
    const p=new URLSearchParams(location.hash.slice(1));
    if(!p.has("aether_status"))return;
    handlingCallback=true;
    try{
      const d=takeRequest(p.get("aether_request_id"));
      clearCallback();
      if(!d||p.get("aether_chain")!=="bsc")throw Error("CALLBACK_INVALID");
      if(/reject|cancel|error|fail|denied/i.test(p.get("aether_status")||""))throw Error("CALLBACK_REJECTED");
      const address=p.get("aether_address");
      if(d.kind==="connect"){
        if(!validAccount(address))throw Error("CALLBACK_INVALID");
        setExternal(address,d.referral);
        list.replaceChildren();row(txt("Verifikasi Login","Verify Login"),verifyExternal,"aether");
        showWalletStatus(txt("Alamat wallet diterima. Verifikasi tanda tangan untuk masuk ke akun member.","Wallet address received. Verify your signature to access your member account."));
      }else if(d.kind==="sign"){
        const sig=callbackSignature(p.get("aether_signature"),p.get("aether_signature_encoding"));
        if(!sig||!validAccount(address)||address.toLowerCase()!==d.address.toLowerCase())throw Error("CALLBACK_INVALID");
        showWalletStatus(txt("Memverifikasi tanda tangan di server...","Verifying signature on server..."));
        await completeLogin(d.address,d.nonce,sig);
        clearExternal();
      }else throw Error("CALLBACK_INVALID");
    }catch(e){showWalletStatus(e.message==="CALLBACK_INVALID"?txt("Callback tidak valid atau sudah kedaluwarsa. Hubungkan wallet kembali.","Invalid or expired callback. Connect your wallet again."):authError(e));}finally{handlingCallback=false;}
  }
  const wallets=[
    ["AETHER Wallet",/aether/i,null,"aether"],
    ["TokenPocket",/tokenpocket|token pocket/i,()=> "tpdapp://open?params="+encodeURIComponent(JSON.stringify({url:target(),chain:"BSC",source:"AETHER ATH"})),"tp"],
    ["Trust Wallet",/trust/i,()=> "https://link.trustwallet.com/open_url?coin_id=20000714&url="+encodeURIComponent(target()),"trust"],
    ["MetaMask",/metamask/i,()=> "https://link.metamask.io/dapp/"+target().replace(/^https:\/\//,""),"mm"],
    ["SafePal",/safepal/i,null,"safe"]
  ];
  function injected(w){
    const found=[...providers.values()].find(d=>w[1].test(d.info.name+" "+d.info.rdns));if(found)return found.provider;
    const candidates=window.ethereum?.providers||[window.ethereum];return candidates.find(p=>p?.request&&({aether:p.isAether||p.isAetherWallet,tp:p.isTokenPocket,trust:p.isTrust||p.isTrustWallet,mm:p.isMetaMask&&!p.isTrust&&!p.isTrustWallet&&!p.isTokenPocket&&!p.isAetherWallet&&!p.isAether&&!p.isSafePal,safe:p.isSafePal})[w[3]]);
  }
  // An approved account is not an authenticated member. Detect it without a
  // second permission request and require explicit consent for personal_sign.
  let activeConnection=null, syncSequence=0;
  const connectionHint=document.createElement("span");
  connectionHint.className="ath-wallet-connection-hint";
  connectionHint.setAttribute("role","status");
  connectionHint.setAttribute("aria-live","polite");
  connectionHint.hidden=true;
  button.insertAdjacentElement("afterend",connectionHint);
  const validAccount=a=>typeof a==="string"&&/^0x[0-9a-f]{40}$/i.test(a);
  function availableProviders(){
    const all=[...providers.values()].map(d=>d.provider);
    if(Array.isArray(window.ethereum?.providers))all.push(...window.ethereum.providers);
    if(window.ethereum?.request&&!all.length)all.push(window.ethereum);
    return [...new Set(all.filter(p=>typeof p?.request==="function"))];
  }
  function paintConnection(){
    const connected=!!activeConnection||!!(externalConnection&&externalConnection.expires>Date.now());
    connectionHint.hidden=!connected;
    button.textContent=connected?txt("Verifikasi Login","Verify Login"):txt("Hubungkan Wallet","Connect Wallet");
    connectionHint.textContent=connected?(activeConnection?txt("Wallet terhubung · verifikasi login diperlukan","Wallet connected · login verification required"):txt("Alamat diterima · verifikasi login diperlukan","Address received · login verification required")):"";
  }
  async function readApproved(p){
    try{
      const a=await Promise.race([p.request({method:"eth_accounts"}),new Promise(resolve=>setTimeout(()=>resolve([]),1500))]);
      return Array.isArray(a)&&validAccount(a[0])?a[0]:null;
    }catch{return null;}
  }
  const observed=new WeakSet();
  function observeProvider(p){
    if(observed.has(p))return;observed.add(p);
    if(typeof p.on==="function"){
      for(const event of ["accountsChanged","connect","disconnect","chainChanged"])try{p.on(event,()=>syncConnection());}catch{}
    }
  }
  async function syncConnection(){
    const seq=++syncSequence;
    const all=availableProviders();
    all.forEach(observeProvider);
    const found=(await Promise.all(all.map(async p=>({p,address:await readApproved(p)})))).filter(x=>x.address);
    if(seq!==syncSequence||authenticating)return;
    activeConnection=found.length===1?found[0]:null;
    paintConnection();
  }
  let authenticating=false;
  async function memberPost(path,data){
    const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),credentials:"same-origin",cache:"no-store"});
    const b=await r.json();
    if(!r.ok||!b.ok){const err=new Error(b.error||"AUTH_FAILED");throw err;}
    return b;
  }
  function validateChallenge(challenge,address){
    if(typeof challenge.message!=="string"||!challenge.message.startsWith("AETHER ATH Staking member authentication\n")||!challenge.message.includes("Origin: https://staking.aether.boats\n")||!challenge.message.includes("Wallet: "+address.toLowerCase()+"\n")||!/^[a-f0-9]{64}$/.test(challenge.nonce||""))throw Error("INVALID_CHALLENGE");
  }
  function authError(e){
    const messages={REFERRAL_REQUIRED:txt("Member baru wajib membuka tautan referral sponsor.","New members must open a sponsor referral link."),INVALID_SPONSOR:txt("Sponsor belum terdaftar atau tidak valid.","Sponsor is not registered or invalid."),MEMBER_API_UNAVAILABLE:txt("Registrasi belum dibuka. Silakan coba setelah sistem siap.","Registration is not open yet. Please try after the system is ready.")};
    const signingDisabled=/sign(?:ing|ature)?[^\n]*(?:disabled|not supported|not allowed|unsupported)|(?:disabled|unsupported)[^\n]*sign|personal_sign/i.test(String(e?.message||""))||Number(e?.code)===4200;
    return messages[e.message]||(signingDisabled?txt("Wallet sudah terhubung, tetapi tanda tangan DApp belum diizinkan. Gunakan wallet yang mendukung tanda tangan pesan.","Wallet connected, but message signing is unavailable. Use a wallet that supports message signing."):txt("Login dibatalkan atau gagal. Silakan coba lagi.","Login canceled or failed. Please try again."));
  }
  async function completeLogin(address,nonce,signature){
    const result=await memberPost("/api/member/verify",{nonce,signature});
    if(result.member?.wallet!==address.toLowerCase())throw Error("INVALID_SESSION");
    const session=await fetch("/api/member/session",{credentials:"same-origin",cache:"no-store"}).then(r=>r.json());
    if(!session.ok||session.member?.wallet!==address.toLowerCase())throw Error("INVALID_SESSION");
    const lang=document.getElementById("aetherLangSelect")?.value||"en";
    location.assign("/staking-member.html?lang="+encodeURIComponent(lang));
  }
  function isAetherProvider(p){
    return !!p&&(p.isAether===true||p.isAetherWallet===true||[...providers.values()].some(d=>d.provider===p&&/aether/i.test(d.info.name+" "+d.info.rdns)));
  }
  function unsupportedMessageSigning(e){
    const code=Number(e?.code),message=String(e?.message||"");
    // Never retry or redirect automatically after user rejection or policy refusal.
    if(code===4001||code===4100||/reject|cancel|denied|not authorized|permission/i.test(message))return false;
    return code===4200||code===-32601||/sign(?:ing|ature)?[^\n]*(?:disabled|not supported|unsupported)|(?:disabled|unsupported)[^\n]*sign|method not found/i.test(message);
  }
  async function connect(p){
    if(authenticating)return;
    authenticating=true;
    let address=null,referral;
    try{
      const approved=await readApproved(p);
      address=approved||(await p.request({method:"eth_requestAccounts"}))?.[0];
      if(!validAccount(address))throw Error("INVALID_WALLET");
      const params=new URLSearchParams(location.search);
      referral=params.get("ref")||params.get("sponsor")||undefined;
      status.textContent=txt("Memeriksa akun dan referral...","Checking account and referral...");
      const challenge=await memberPost("/api/member/challenge",{wallet:address,referral});
      validateChallenge(challenge,address);
      status.textContent=txt("Setujui tanda tangan login. Tidak ada transaksi atau persetujuan token.","Approve the login signature. No transaction or token approval.");
      const hex="0x"+Array.from(new TextEncoder().encode(challenge.message),b=>b.toString(16).padStart(2,"0")).join("");
      const signature=await p.request({method:"personal_sign",params:[hex,address]});
      await completeLogin(address,challenge.nonce,signature);
    }catch(e){
      title.textContent=txt("Verifikasi Login","Verify Login");
      list.replaceChildren();
      status.textContent=authError(e);
      if(validAccount(address)&&isAetherProvider(p)&&unsupportedMessageSigning(e)){
        // The official native signing request remains subject to the wallet's own
        // approval and security policy. Do not treat a deep link as a signature.
        status.textContent=txt("Wallet terhubung, tetapi penandatanganan di browser DApp tidak tersedia. Anda dapat mencoba permintaan tanda tangan resmi AETHER Wallet jika diizinkan aplikasi.","Wallet connected, but in-DApp signing is unavailable. You may try the official AETHER Wallet signing request if the app permits it.");
        row(txt("Verifikasi melalui aplikasi AETHER Wallet","Verify through AETHER Wallet app"),()=>{
          setExternal(address,referral);
          verifyExternal();
        },"aether");
      }
      row(txt("Coba verifikasi lagi","Retry verification"),()=>openVerification({p}),"other");
      row(txt("Pilih wallet lain","Choose another wallet"),open,"other");
    }finally{authenticating=false;}
  }
  function row(label,action,key="other"){
    const b=document.createElement("button");b.type="button";b.className="ath-wallet-option";b.dataset.wallet=key;
    const mark=document.createElement("span");mark.className="ath-wallet-mark";mark.setAttribute("aria-hidden","true");
    if(key==="aether"){
      const logo=document.querySelector(".brand img");
      if(logo?.src){const img=document.createElement("img");img.src=logo.src;img.alt="";mark.append(img);}
    }
    if(!mark.hasChildNodes())mark.textContent=({tp:"TP",trust:"TW",mm:"M",safe:"S",other:"+"})[key]||"";
    const copy=document.createElement("span");copy.className="ath-wallet-copy";
    const name=document.createElement("strong");name.textContent=label;copy.append(name);
    if(key==="aether"){const sub=document.createElement("small");sub.textContent=txt("Wallet resmi ekosistem","Official ecosystem wallet");copy.append(sub);}
    const arrow=document.createElement("span");arrow.className="ath-wallet-arrow";arrow.textContent="›";arrow.setAttribute("aria-hidden","true");
    b.append(mark,copy,arrow);b.onclick=action;list.append(b);
  }
  function open(){
    title.textContent=txt("Hubungkan Wallet","Connect Wallet");list.replaceChildren();status.textContent=txt("Pilih wallet Anda. Tidak ada transaksi yang akan dikirim.","Choose your wallet. No transaction will be sent.");
    for(const w of wallets)row(w[0],()=>{const p=injected(w);if(p)return connect(p);if(w[3]==="aether")return connectAetherApp();if(w[2]){location.href=w[2]();return;}status.textContent=txt("Buka situs ini di browser DApp ","Open this site in the DApp browser of ")+w[0]+". "+target();},w[3]);
    for(const d of providers.values())if(!wallets.some(w=>w[1].test(d.info.name+" "+d.info.rdns)))row(d.info.name.slice(0,60),()=>connect(d.provider));
    row(txt("Wallet browser lainnya","Other browser wallet"),()=>{if(window.ethereum?.request)return connect(window.ethereum);status.textContent=txt("WalletConnect QR belum dikonfigurasi. Gunakan browser DApp wallet Anda.","WalletConnect QR is not configured yet. Use your wallet's DApp browser.");});
    if(!dialog.open)dialog.showModal();
  }
  function openVerification(connection){
    if(authenticating)return;
    list.replaceChildren();
    title.textContent=txt("Verifikasi Login","Verify Login");
    status.textContent=txt("Memverifikasi wallet yang sudah terhubung…","Verifying the connected wallet…");
    if(!dialog.open)dialog.showModal();
    if(connection)connect(connection.p);else verifyExternal();
  }
  document.addEventListener("click",e=>{
    if(!e.target.closest?.("#connectBtn"))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(activeConnection){openVerification(activeConnection);return;}
    if(externalConnection&&externalConnection.expires>Date.now()){openVerification(null);return;}
    open();
  },true);
  window.addEventListener("eip6963:announceProvider",()=>syncConnection());
  window.addEventListener("focus",()=>syncConnection());
  window.addEventListener("pageshow",()=>syncConnection());
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)syncConnection();});
  document.getElementById("aetherLangSelect")?.addEventListener("change",paintConnection);
  window.addEventListener("aether-language-refresh",paintConnection);
  restoreExternal();
  paintConnection();
  window.addEventListener("hashchange",handleAetherCallback);
  window.addEventListener("pageshow",handleAetherCallback);
  handleAetherCallback();
  syncConnection();
  setTimeout(syncConnection,700);
  setTimeout(syncConnection,2000);
})();
