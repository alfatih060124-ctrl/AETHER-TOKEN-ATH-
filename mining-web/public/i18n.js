(()=>{
const langs={en:'English',id:'Indonesia',zh:'中文',es:'Español',ar:'العربية',ru:'Русский',ko:'한국어',ja:'日本語',vi:'Tiếng Việt',pt:'Português'};
const rows={
'Home':['Beranda','首页','Inicio','الرئيسية','Главная','홈','ホーム','Trang chủ','Início'],
'Mining':['Mining','挖矿','Minería','التعدين','Майнинг','마이닝','マイニング','Khai thác','Mineração'],
'Buy ATH':['Beli ATH','购买 ATH','Comprar ATH','شراء ATH','Купить ATH','ATH 구매','ATHを購入','Mua ATH','Comprar ATH'],
'Leaderboard':['Papan Peringkat','排行榜','Clasificación','لوحة المتصدرين','Рейтинг','리더보드','ランキング','Bảng xếp hạng','Classificação'],
'Referral':['Referral','推荐','Referidos','الإحالة','Рефералы','추천','紹介','Giới thiệu','Indicação'],
'Docs':['Dokumen','文档','Documentos','المستندات','Документы','문서','ドキュメント','Tài liệu','Documentos'],
'Connect Wallet':['Hubungkan Wallet','连接钱包','Conectar Wallet','ربط المحفظة','Подключить кошелёк','지갑 연결','ウォレット接続','Kết nối ví','Conectar Wallet'],
'THE NEXT ERA OF DECENTRALIZED VALUE':['ERA BARU NILAI TERDESENTRALISASI','去中心化价值的新时代','LA NUEVA ERA DEL VALOR DESCENTRALIZADO','العصر الجديد للقيمة اللامركزية','НОВАЯ ЭРА ДЕЦЕНТРАЛИЗОВАННОЙ ЦЕННОСТИ','탈중앙화 가치의 새로운 시대','分散型価値の新時代','KỶ NGUYÊN MỚI CỦA GIÁ TRỊ PHI TẬP TRUNG','A NOVA ERA DO VALOR DESCENTRALIZADO'],
'Mine. Earn. Grow Together.':['Mining. Hasilkan. Tumbuh Bersama.','挖矿。赚取。共同成长。','Mina. Gana. Crece Juntos.','عدّن. اربح. انمُ معاً.','Майнинг. Зарабатывайте. Растите вместе.','채굴. 보상. 함께 성장.','マイニング。獲得。共に成長。','Khai thác. Kiếm thưởng. Cùng phát triển.','Minere. Ganhe. Cresça Juntos.'],
'Start Mining Now':['Mulai Mining Sekarang','立即开始挖矿','Comenzar Minería','ابدأ التعدين الآن','Начать майнинг','지금 마이닝 시작','今すぐマイニング','Bắt đầu khai thác','Começar Mineração'],
'Learn More':['Pelajari Lebih Lanjut','了解更多','Más Información','اعرف المزيد','Подробнее','자세히 보기','詳しく見る','Tìm hiểu thêm','Saiba Mais'],
'Buy Power':['Beli Power','购买算力','Comprar Power','شراء الطاقة','Купить Power','파워 구매','Powerを購入','Mua Power','Comprar Power'],
'Power Booster':['Power Booster','算力加速器','Power Booster','معزز الطاقة','Power Booster','파워 부스터','Power Booster','Power Booster','Power Booster'],
'Double Power Booster':['Double Power Booster','双倍算力加速器','Double Power Booster','معزز الطاقة المزدوج','Double Power Booster','더블 파워 부스터','Double Power Booster','Double Power Booster','Double Power Booster'],
'Daily Claim':['Klaim Harian','每日领取','Reclamo Diario','المطالبة اليومية','Ежедневное получение','일일 수령','デイリー受取','Nhận hàng ngày','Resgate Diário'],
'Claim Now':['Klaim Sekarang','立即领取','Reclamar Ahora','استلم الآن','Получить сейчас','지금 받기','今すぐ受取','Nhận ngay','Resgatar Agora'],
'Vesting Progress':['Progres Vesting','解锁进度','Progreso de Vesting','تقدم الاستحقاق','Прогресс вестинга','베스팅 진행','ベスティング進捗','Tiến độ Vesting','Progresso de Vesting'],
'Referral Bonus':['Bonus Referral','推荐奖励','Bono de Referido','مكافأة الإحالة','Реферальный бонус','추천 보너스','紹介ボーナス','Thưởng giới thiệu','Bônus de Indicação'],
'Your Miner Status':['Status Miner Anda','您的矿工状态','Estado de tu Minero','حالة التعدين الخاصة بك','Статус майнера','내 마이너 상태','マイナー状態','Trạng thái Miner','Status do Miner'],
'Daily Reward':['Reward Harian','每日奖励','Recompensa Diaria','المكافأة اليومية','Ежедневная награда','일일 보상','デイリー報酬','Phần thưởng hàng ngày','Recompensa Diária'],
'Network & Contract Status':['Status Jaringan & Kontrak','网络与合约状态','Estado de Red y Contrato','حالة الشبكة والعقد','Статус сети и контракта','네트워크 및 컨트랙트 상태','ネットワークとコントラクト状態','Trạng thái Mạng & Hợp đồng','Status da Rede e Contrato'],
'Wallet Status':['Status Wallet','钱包状态','Estado de Wallet','حالة المحفظة','Статус кошелька','지갑 상태','ウォレット状態','Trạng thái Ví','Status da Wallet'],
'Not Connected':['Belum Terhubung','未连接','No Conectado','غير متصل','Не подключено','연결 안 됨','未接続','Chưa kết nối','Não Conectado'],
'Active':['Aktif','活跃','Activo','نشط','Активен','활성','アクティブ','Hoạt động','Ativo'],
'Status':['Status','状态','Estado','الحالة','Статус','상태','ステータス','Trạng thái','Status'],
'Community':['Komunitas','社区','Comunidad','المجتمع','Сообщество','커뮤니티','コミュニティ','Cộng đồng','Comunidade']};
const original=new WeakMap();
const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
function mapFor(code){const i=Object.keys(langs).indexOf(code)-1,m={};Object.entries(rows).forEach(([en,a])=>m[en]=i<0?en:a[i]);return m}
function translate(code){const m=mapFor(code);document.querySelectorAll('a,button,h1,h2,h3,h4,h5,label,span,p,strong,option').forEach(el=>{if(el.children.length)return;if(!original.has(el))original.set(el,el.textContent);const base=norm(original.get(el));if(m[base]!==undefined)el.textContent=m[base]});}
function setLang(code){code=langs[code]?code:'en';document.documentElement.lang=code;document.documentElement.dir=code==='ar'?'rtl':'ltr';localStorage.setItem('aether-mining-lang',code);translate(code);const s=document.getElementById('aetherMiningLang');if(s)s.value=code;window.dispatchEvent(new CustomEvent('aether-language-change',{detail:{code}}));}
function mount(){if(document.getElementById('aetherMiningLang'))return;const s=document.createElement('select');s.id='aetherMiningLang';s.setAttribute('aria-label','Language');Object.entries(langs).forEach(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n;s.appendChild(o)});Object.assign(s.style,{position:'fixed',right:'16px',top:'76px',zIndex:'9999',padding:'8px 10px',borderRadius:'10px',background:'#111',color:'#fff',border:'1px solid #555',maxWidth:'145px'});s.onchange=()=>setLang(s.value);document.body.appendChild(s);setLang(localStorage.getItem('aether-mining-lang')||(navigator.language||'en').toLowerCase().split('-')[0]);new MutationObserver(()=>translate(localStorage.getItem('aether-mining-lang')||'en')).observe(document.body,{subtree:true,childList:true});}
window.aetherMiningSetLanguage=setLang;document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount):mount();
})();