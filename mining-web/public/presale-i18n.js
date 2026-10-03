(()=>{
const L=["id","zh","es","ar","ru","ko","ja","vi","pt"],D={
"Buy ATH":["Beli ATH","购买 ATH","Comprar ATH","شراء ATH","Купить ATH","ATH 구매","ATHを購入","Mua ATH","Comprar ATH"],
"ATH ON-CHAIN PRESALE":["PRESALE ATH ON-CHAIN","ATH 链上预售","PREVENTA ATH ON-CHAIN","البيع المسبق ATH على السلسلة","ОНЧЕЙН-ПРЕДПРОДАЖА ATH","ATH 온체인 프리세일","ATHオンチェーンプレセール","PRESALE ATH ON-CHAIN","PRÉ-VENDA ATH ON-CHAIN"],
"Buy ATH Directly On-chain":["Beli ATH Langsung On-chain","直接链上购买 ATH","Comprar ATH Directamente On-chain","شراء ATH مباشرة على السلسلة","Купить ATH напрямую ончейн","ATH 온체인 직접 구매","ATHをオンチェーンで直接購入","Mua ATH Trực tiếp On-chain","Comprar ATH Diretamente On-chain"],
"Current Presale Price":["Harga Presale Saat Ini","当前预售价","Precio Actual de Preventa","سعر البيع المسبق الحالي","Текущая цена предпродажи","현재 프리세일 가격","現在のプレセール価格","Giá Presale Hiện Tại","Preço Atual da Pré-venda"],
"ATH Sold":["ATH Terjual","已售 ATH","ATH Vendido","ATH المباع","Продано ATH","판매된 ATH","販売済みATH","ATH Đã Bán","ATH Vendido"],
"ATH Remaining":["Sisa ATH","剩余 ATH","ATH Restante","ATH المتبقي","Осталось ATH","남은 ATH","残りATH","ATH Còn Lại","ATH Restante"],
"Payment Asset":["Aset Pembayaran","支付资产","Activo de Pago","أصل الدفع","Платёжный актив","결제 자산","支払資産","Tài sản Thanh toán","Ativo de Pagamento"],
"Presale Order":["Pesanan Presale","预售订单","Orden de Preventa","طلب البيع المسبق","Заказ предпродажи","프리세일 주문","プレセール注文","Đơn Presale","Pedido de Pré-venda"],
"ATH Amount":["Jumlah ATH","ATH 数量","Cantidad ATH","كمية ATH","Количество ATH","ATH 수량","ATH数量","Số lượng ATH","Quantidade ATH"],
"Contract Quote":["Quote Kontrak","合约报价","Cotización del Contrato","عرض العقد","Котировка контракта","컨트랙트 견적","コントラクト見積","Báo giá Hợp đồng","Cotação do Contrato"],
"Max Payment Protection":["Proteksi Pembayaran Maksimal","最大支付保护","Protección de Pago Máximo","حماية الحد الأقصى للدفع","Защита максимального платежа","최대 결제 보호","最大支払保護","Bảo vệ Thanh toán Tối đa","Proteção de Pagamento Máximo"],
"Allowance":["Allowance","授权额度","Asignación","حد السماح","Разрешение","허용량","アローワンス","Hạn mức","Permissão"],
"Network Gas":["Gas Jaringan","网络 Gas","Gas de Red","غاز الشبكة","Газ сети","네트워크 가스","ネットワークGas","Gas Mạng","Gas da Rede"],
"Buy ATH On-chain":["Beli ATH On-chain","链上购买 ATH","Comprar ATH On-chain","شراء ATH على السلسلة","Купить ATH ончейн","ATH 온체인 구매","ATHをオンチェーン購入","Mua ATH On-chain","Comprar ATH On-chain"],
"On-chain Settlement":["Settlement On-chain","链上结算","Liquidación On-chain","التسوية على السلسلة","Ончейн-расчёт","온체인 정산","オンチェーン決済","Thanh toán On-chain","Liquidação On-chain"],
"Connect Wallet":["Hubungkan Wallet","连接钱包","Conectar Wallet","ربط المحفظة","Подключить кошелёк","지갑 연결","ウォレット接続","Kết nối Ví","Conectar Wallet"],
"Approve Stablecoin":["Setujui Stablecoin","授权稳定币","Aprobar Stablecoin","الموافقة على العملة المستقرة","Разрешить стейблкоин","스테이블코인 승인","ステーブルコイン承認","Phê duyệt Stablecoin","Aprovar Stablecoin"],
"Receive ATH":["Terima ATH","接收 ATH","Recibir ATH","استلام ATH","Получить ATH","ATH 수령","ATHを受け取る","Nhận ATH","Receber ATH"],
"Contract Rules":["Aturan Kontrak","合约规则","Reglas del Contrato","قواعد العقد","Правила контракта","컨트랙트 규칙","コントラクトルール","Quy tắc Hợp đồng","Regras do Contrato"],
"Presale Allocation":["Alokasi Presale","预售分配","Asignación de Preventa","تخصيص البيع المسبق","Объём предпродажи","프리세일 할당","プレセール配分","Phân bổ Presale","Alocação da Pré-venda"],
"Price Step":["Kenaikan Harga","价格步进","Escalón de Precio","خطوة السعر","Шаг цены","가격 단계","価格ステップ","Bước Giá","Etapa de Preço"],
"Buyer Protection":["Perlindungan Pembeli","买家保护","Protección del Comprador","حماية المشتري","Защита покупателя","구매자 보호","購入者保護","Bảo vệ Người mua","Proteção do Comprador"],
"Settlement":["Settlement","结算","Liquidación","التسوية","Расчёт","정산","決済","Thanh toán","Liquidação"],
"Contract pending":["Kontrak menunggu","合约待定","Contrato pendiente","العقد قيد الانتظار","Контракт ожидается","컨트랙트 대기","コントラクト待機","Hợp đồng đang chờ","Contrato pendente"]
};
function lang(){return(localStorage.getItem("aether-mining-lang")||document.documentElement.lang||"en").toLowerCase().split("-")[0]}
const base=new WeakMap(),rev={};Object.entries(D).forEach(([k,a])=>a.forEach(v=>rev[String(v).trim()]=k));
function apply(){const c=lang(),i=L.indexOf(c),root=document.getElementById("buy-ath");if(!root)return;root.querySelectorAll("a,button,h1,h2,h3,label,span,p,strong,small,option,div").forEach(e=>{if(e.children.length)return;const now=String(e.textContent||"").trim();if(D[now])base.set(e,now);else if(rev[now])base.set(e,rev[now]);const key=base.get(e),v=D[key];if(!key||!v)return;const next=c==="en"?key:(i>=0&&v[i]?v[i]:key);if(now!==next)e.textContent=next})}
window.addEventListener("aether-language-change",()=>setTimeout(apply,0));if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply);else apply();const root=document.getElementById("buy-ath");if(root)new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true,characterData:true});
})();
