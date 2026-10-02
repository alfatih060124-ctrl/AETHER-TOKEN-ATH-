(()=>{
const L=['id','zh','es','ar','ru','ko','ja','vi','pt'];
const X={
'▣ Connect Wallet':['▣ Hubungkan Wallet','▣ 连接钱包','▣ Conectar Wallet','▣ ربط المحفظة','▣ Подключить кошелёк','▣ 지갑 연결','▣ ウォレット接続','▣ Kết nối ví','▣ Conectar Wallet'],
'⚒ Start Mining Now →':['⚒ Mulai Mining Sekarang →','⚒ 立即开始挖矿 →','⚒ Comenzar Minería →','⚒ ابدأ التعدين الآن →','⚒ Начать майнинг →','⚒ 지금 마이닝 시작 →','⚒ 今すぐマイニング →','⚒ Bắt đầu khai thác →','⚒ Começar Mineração →'],
'▶ Learn More':['▶ Pelajari Lebih Lanjut','▶ 了解更多','▶ Más Información','▶ اعرف المزيد','▶ Подробнее','▶ 자세히 보기','▶ 詳しく見る','▶ Tìm hiểu thêm','▶ Saiba Mais'],
'▣ Buy Power':['▣ Beli Power','▣ 购买算力','▣ Comprar Power','▣ شراء الطاقة','▣ Купить Power','▣ 파워 구매','▣ Powerを購入','▣ Mua Power','▣ Comprar Power'],
'▣ Buy Power Booster':['▣ Beli Power Booster','▣ 购买算力加速器','▣ Comprar Power Booster','▣ شراء معزز الطاقة','▣ Купить Power Booster','▣ 파워 부스터 구매','▣ Power Boosterを購入','▣ Mua Power Booster','▣ Comprar Power Booster'],
'✦ Activate Double Power':['✦ Aktifkan Double Power','✦ 激活双倍算力','✦ Activar Double Power','✦ تفعيل الطاقة المزدوجة','✦ Активировать Double Power','✦ 더블 파워 활성화','✦ Double Powerを有効化','✦ Kích hoạt Double Power','✦ Ativar Double Power'],
'▣ Claim Now':['▣ Klaim Sekarang','▣ 立即领取','▣ Reclamar Ahora','▣ استلم الآن','▣ Получить сейчас','▣ 지금 받기','▣ 今すぐ受取','▣ Nhận ngay','▣ Resgatar Agora'],
'▥ View Vesting':['▥ Lihat Vesting','▥ 查看解锁','▥ Ver Vesting','▥ عرض الاستحقاق','▥ Посмотреть вестинг','▥ 베스팅 보기','▥ ベスティングを見る','▥ Xem Vesting','▥ Ver Vesting'],
'↗ Referral Details':['↗ Detail Referral','↗ 推荐详情','↗ Detalles de Referidos','↗ تفاصيل الإحالة','↗ Детали рефералов','↗ 추천 상세','↗ 紹介詳細','↗ Chi tiết giới thiệu','↗ Detalhes de Indicação'],
'◷ View Details':['◷ Lihat Detail','◷ 查看详情','◷ Ver Detalles','◷ عرض التفاصيل','◷ Подробнее','◷ 상세 보기','◷ 詳細を見る','◷ Xem chi tiết','◷ Ver Detalhes'],
'● Active':['● Aktif','● 活跃','● Activo','● نشط','● Активен','● 활성','● アクティブ','● Hoạt động','● Ativo'],
'▶ Start Mining':['▶ Mulai Mining','▶ 开始挖矿','▶ Iniciar Minería','▶ ابدأ التعدين','▶ Начать майнинг','▶ 마이닝 시작','▶ マイニング開始','▶ Bắt đầu khai thác','▶ Iniciar Mineração'],
'● Connected':['● Terhubung','● 已连接','● Conectado','● متصل','● Подключено','● 연결됨','● 接続済み','● Đã kết nối','● Conectado']};
const n=s=>String(s||'').trim().replace(/\s+/g,' '),B=new WeakMap(),R={};Object.entries(X).forEach(([k,a])=>a.forEach(v=>R[n(v)]=k));
function lang(){return(localStorage.getItem('aether-mining-lang')||document.documentElement.lang||'en').toLowerCase().split('-')[0]}
function apply(){const c=lang(),i=L.indexOf(c);document.querySelectorAll('body *').forEach(e=>{if(e.children.length||['SCRIPT','STYLE'].includes(e.tagName))return;const q=n(e.textContent);if(X[q])B.set(e,q);else if(R[q])B.set(e,R[q]);else if(!B.has(e))B.set(e,q);const k=n(B.get(e)),v=X[k];if(c==='en'&&v)e.textContent=k;else if(i>=0&&v?.[i])e.textContent=v[i]})}
window.addEventListener('aether-language-change',()=>setTimeout(apply,5));window.addEventListener('aether:languagechange',()=>setTimeout(apply,5));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,5));else setTimeout(apply,5);
})();