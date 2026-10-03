(()=>{
const L=["id","zh","es","ar","ru","ko","ja","vi","pt"],D={
"Staking":["Staking","质押","Staking","التخزين","Стейкинг","스테이킹","ステーキング","Staking","Staking"],
"Mine. Stake. Grow Together.":["Mining. Staking. Tumbuh Bersama.","挖矿。质押。共同成长。","Mina. Haz staking. Crece juntos.","عدّن. خزّن. انمُ معاً.","Майнинг. Стейкинг. Растём вместе.","채굴. 스테이킹. 함께 성장.","マイニング。ステーキング。共に成長。","Khai thác. Staking. Cùng phát triển.","Minere. Faça staking. Cresça junto."],
"ATH UNIFIED PROGRAM":["PROGRAM TERPADU ATH","ATH 统一计划","PROGRAMA UNIFICADO ATH","برنامج ATH الموحد","ЕДИНАЯ ПРОГРАММА ATH","ATH 통합 프로그램","ATH統合プログラム","CHƯƠNG TRÌNH ATH HỢP NHẤT","PROGRAMA UNIFICADO ATH"],
"Official ATH Price":["Harga Resmi ATH","ATH 官方价格","Precio Oficial ATH","السعر الرسمي لـ ATH","Официальная цена ATH","공식 ATH 가격","ATH公式価格","Giá ATH Chính Thức","Preço Oficial ATH"],
"Listing Holder Gate":["Target Holder Listing","上市持有人门槛","Umbral de Holders para Listado","حد الحاملين للإدراج","Порог держателей для листинга","상장 홀더 기준","上場ホルダー条件","Mốc Holder Niêm Yết","Meta de Holders para Listagem"],
"Listing pending":["Listing menunggu","等待上市","Listado pendiente","الإدراج قيد الانتظار","Листинг ожидается","상장 대기","上場待機","Đang chờ niêm yết","Listagem pendente"],
"Staking Allocation":["Alokasi Staking","质押分配","Asignación de Staking","تخصيص التخزين","Распределение стейкинга","스테이킹 할당","ステーキング配分","Phân bổ Staking","Alocação de Staking"],
"Your Wallet":["Wallet Anda","您的钱包","Tu Wallet","محفظتك","Ваш кошелёк","내 지갑","あなたのウォレット","Ví của bạn","Sua Wallet"],
"Not Connected":["Belum Terhubung","未连接","No Conectada","غير متصل","Не подключено","연결 안 됨","未接続","Chưa kết nối","Não Conectada"],
"Stake ATH":["Stake ATH","质押 ATH","Hacer Staking de ATH","تخزين ATH","Стейкинг ATH","ATH 스테이킹","ATHをステーキング","Stake ATH","Fazer Staking de ATH"],
"Package":["Paket","套餐","Paquete","الباقة","Пакет","패키지","パッケージ","Gói","Pacote"],
"Stake Value (USD reference)":["Nilai Stake (referensi USD)","质押价值（USD参考）","Valor de Staking (referencia USD)","قيمة التخزين (مرجع USD)","Стоимость стейкинга (USD)","스테이킹 가치(USD 기준)","ステーキング価値（USD基準）","Giá trị Stake (tham chiếu USD)","Valor do Staking (referência USD)"],
"Sponsor Wallet (optional)":["Wallet Sponsor (opsional)","推荐钱包（可选）","Wallet del Sponsor (opcional)","محفظة الراعي (اختياري)","Кошелёк спонсора (необязательно)","스폰서 지갑(선택)","スポンサーウォレット（任意）","Ví Sponsor (tùy chọn)","Wallet do Sponsor (opcional)"],
"Required ATH":["ATH Dibutuhkan","所需 ATH","ATH Requerido","ATH المطلوب","Требуется ATH","필요 ATH","必要ATH","ATH Cần Thiết","ATH Necessário"],
"My Stake Position":["Posisi Stake Saya","我的质押仓位","Mi Posición de Staking","مركز التخزين الخاص بي","Моя позиция стейкинга","내 스테이킹 포지션","自分のステーキングポジション","Vị trí Stake của tôi","Minha Posição de Staking"],
"Pending Reward":["Reward Tertunda","待领取奖励","Recompensa Pendiente","المكافأة المعلقة","Ожидающая награда","대기 보상","保留中の報酬","Phần thưởng chờ","Recompensa Pendente"],
"Claim Reward":["Klaim Reward","领取奖励","Reclamar Recompensa","استلام المكافأة","Получить награду","보상 수령","報酬を受け取る","Nhận thưởng","Resgatar Recompensa"],
"Withdraw Principal":["Tarik Pokok","提取本金","Retirar Principal","سحب الأصل","Вывести основной капитал","원금 출금","元本を引き出す","Rút vốn gốc","Retirar Principal"],
"Staking Account":["Akun Staking","质押账户","Cuenta de Staking","حساب التخزين","Аккаунт стейкинга","스테이킹 계정","ステーキングアカウント","Tài khoản Staking","Conta de Staking"],
"Active Staked Value":["Nilai Stake Aktif","活跃质押价值","Valor Staked Activo","قيمة التخزين النشطة","Активная сумма стейкинга","활성 스테이킹 가치","有効ステーク価値","Giá trị Stake đang hoạt động","Valor em Staking Ativo"],
"Stake Positions":["Posisi Stake","质押仓位","Posiciones de Staking","مراكز التخزين","Позиции стейкинга","스테이킹 포지션","ステーキングポジション","Vị trí Stake","Posições de Staking"],
"Direct Referral Earned":["Referral Langsung Diperoleh","直接推荐收益","Referido Directo Ganado","أرباح الإحالة المباشرة","Доход прямых рефералов","직접 추천 수익","直接紹介報酬","Thưởng giới thiệu trực tiếp","Indicação Direta Recebida"],
"Network Earned":["Pendapatan Network","网络收益","Ganancia de Red","أرباح الشبكة","Доход сети","네트워크 수익","ネットワーク報酬","Thu nhập mạng lưới","Ganhos de Rede"],
"Locked":["Terkunci","锁定","Bloqueado","مقفل","Заблокировано","잠김","ロック中","Đang khóa","Bloqueado"],"Unlocked":["Terbuka","已解锁","Desbloqueado","مفتوح","Разблокировано","잠금 해제","解除済み","Đã mở khóa","Desbloqueado"]
};
function lang(){return(localStorage.getItem("aether-mining-lang")||document.documentElement.lang||"en").toLowerCase().split("-")[0]}
const base=new WeakMap(),rev={};Object.entries(D).forEach(([k,a])=>a.forEach(v=>rev[String(v).trim()]=k));
function apply(){const c=lang(),i=L.indexOf(c),root=document.getElementById("staking");if(!root)return;root.querySelectorAll("a,button,h1,h2,h3,label,span,p,strong,small,option,div").forEach(e=>{if(e.children.length)return;const now=String(e.textContent||"").trim();if(D[now])base.set(e,now);else if(rev[now])base.set(e,rev[now]);const key=base.get(e),v=D[key];if(!key||!v)return;const next=c==="en"?key:(i>=0&&v[i]?v[i]:key);if(now!==next)e.textContent=next})}
window.addEventListener("aether-language-change",()=>setTimeout(apply,0));if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply);else apply();const root=document.getElementById("staking");if(root)new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true,characterData:true});
})();