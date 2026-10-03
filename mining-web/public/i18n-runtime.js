(()=>{
const LANGS=['en','id','zh','es','ar','ru','ko','ja','vi','pt'];
const LOCALES={en:'en-GB',id:'id-ID',zh:'zh-CN',es:'es-ES',ar:'ar',ru:'ru-RU',ko:'ko-KR',ja:'ja-JP',vi:'vi-VN',pt:'pt-PT'};
const D={
'NOT ELIGIBLE':['TIDAK MEMENUHI SYARAT','不符合条件','NO ELEGIBLE','غير مؤهل','НЕ ДОСТУПНО','자격 없음','対象外','KHÔNG ĐỦ ĐIỀU KIỆN','NÃO ELEGÍVEL'],
'CLAIMABLE':['BISA DIKLAIM','可领取','DISPONIBLE','قابل للاستلام','ДОСТУПНО','수령 가능','受取可能','CÓ THỂ NHẬN','RESGATÁVEL'],
'CLAIMED':['SUDAH DIKLAIM','已领取','RECLAMADO','تم الاستلام','ПОЛУЧЕНО','수령 완료','受取済み','ĐÃ NHẬN','RESGATADO'],
'EXPIRED':['KEDALUWARSA','已过期','EXPIRADO','منتهي','ИСТЕКЛО','만료됨','期限切れ','ĐÃ HẾT HẠN','EXPIRADO'],
'PENDING 00:05 UTC':['MENUNGGU 00:05 UTC','等待 00:05 UTC','PENDIENTE 00:05 UTC','قيد الانتظار 00:05 UTC','ОЖИДАНИЕ 00:05 UTC','00:05 UTC 대기','00:05 UTC 待機','CHỜ 00:05 UTC','PENDENTE 00:05 UTC'],
'UNKNOWN':['TIDAK DIKETAHUI','未知','DESCONOCIDO','غير معروف','НЕИЗВЕСТНО','알 수 없음','不明','KHÔNG XÁC ĐỊNH','DESCONHECIDO'],
'Not active':['Tidak aktif','未激活','No activo','غير نشط','Неактивно','비활성','無効','Không hoạt động','Inativo'],
'Not available':['Tidak tersedia','不可用','No disponible','غير متاح','Недоступно','사용 불가','利用不可','Không khả dụng','Indisponível'],
'Power required':['Power diperlukan','需要 Power','Se requiere Power','يتطلب Power','Требуется Power','Power 필요','Powerが必要','Cần Power','Power necessário'],
'No positions yet':['Belum ada posisi','暂无仓位','Aún no hay posiciones','لا توجد مراكز بعد','Позиций пока нет','아직 포지션 없음','ポジションはまだありません','Chưa có vị trí','Ainda não há posições'],
'Not entered':['Belum masuk','尚未进入','No ingresado','لم يتم الإدخال','Не введено','미진입','未記録','Chưa vào','Não inserido'],
'Connect Wallet':['Hubungkan Wallet','连接钱包','Conectar Wallet','ربط المحفظة','Подключить кошелёк','지갑 연결','ウォレット接続','Kết nối ví','Conectar Wallet'],
'Wallet not connected':['Wallet belum terhubung','钱包未连接','Wallet no conectada','المحفظة غير متصلة','Кошелёк не подключён','지갑이 연결되지 않음','ウォレット未接続','Ví chưa kết nối','Wallet não conectada'],
'10 ATH × referral × booster':['10 ATH × referral × booster','1 ATH × 推荐 × booster','1 ATH × referido × booster','1 ATH × الإحالة × booster','1 ATH × реферал × booster','1 ATH × 추천 × booster','1 ATH × 紹介 × booster','1 ATH × giới thiệu × booster','1 ATH × indicação × booster'],
'10 ATH × {factor} referral × 2 Power × 3 Double':['10 ATH × {factor} referral × 2 Power × 3 Double','1 ATH × {factor} 推荐 × 2 Power × 3 Double','1 ATH × {factor} referido × 2 Power × 3 Double','1 ATH × {factor} إحالة × 2 Power × 3 Double','1 ATH × {factor} реферал × 2 Power × 3 Double','1 ATH × {factor} 추천 × 2 Power × 3 Double','1 ATH × {factor} 紹介 × 2 Power × 3 Double','1 ATH × {factor} giới thiệu × 2 Power × 3 Double','1 ATH × {factor} indicação × 2 Power × 3 Double'],
'10 ATH × {factor} referral × 2 Power':['10 ATH × {factor} referral × 2 Power','1 ATH × {factor} 推荐 × 2 Power','1 ATH × {factor} referido × 2 Power','1 ATH × {factor} إحالة × 2 Power','1 ATH × {factor} реферал × 2 Power','1 ATH × {factor} 추천 × 2 Power','1 ATH × {factor} 紹介 × 2 Power','1 ATH × {factor} giới thiệu × 2 Power','1 ATH × {factor} indicação × 2 Power'],
'10 ATH × {factor} referral':['10 ATH × {factor} referral','1 ATH × {factor} 推荐','1 ATH × {factor} referido','1 ATH × {factor} إحالة','1 ATH × {factor} реферал','1 ATH × {factor} 추천','1 ATH × {factor} 紹介','1 ATH × {factor} giới thiệu','1 ATH × {factor} indicação'],
'Testnet contract pending':['Kontrak Testnet menunggu','测试网合约待定','Contrato Testnet pendiente','عقد Testnet قيد الانتظار','Контракт Testnet ожидается','Testnet 컨트랙트 대기','Testnetコントラクト待機','Hợp đồng Testnet đang chờ','Contrato Testnet pendente'],
'Mining contract connected':['Kontrak Mining terhubung','挖矿合约已连接','Contrato de minería conectado','تم ربط عقد التعدين','Майнинг-контракт подключён','마이닝 컨트랙트 연결됨','マイニングコントラクト接続済み','Hợp đồng khai thác đã kết nối','Contrato de mineração conectado'],
'Wallet connected.':['Wallet terhubung.','钱包已连接。','Wallet conectada.','تم ربط المحفظة.','Кошелёк подключён.','지갑이 연결되었습니다.','ウォレット接続済み。','Ví đã kết nối.','Wallet conectada.'],
'Wallet connection failed.':['Koneksi wallet gagal.','钱包连接失败。','Falló la conexión de la wallet.','فشل ربط المحفظة.','Не удалось подключить кошелёк.','지갑 연결 실패.','ウォレット接続に失敗しました。','Kết nối ví thất bại.','Falha ao conectar a wallet.'],
'Power active':['Power aktif','Power 已激活','Power activo','Power نشط','Power активен','Power 활성','Power有効','Power đang hoạt động','Power ativo'],
'Ready to activate':['Siap diaktifkan','可激活','Listo para activar','جاهز للتفعيل','Готово к активации','활성화 준비 완료','有効化可能','Sẵn sàng kích hoạt','Pronto para ativar'],
'Contract pending':['Kontrak menunggu','合约待定','Contrato pendiente','العقد قيد الانتظار','Контракт ожидается','컨트랙트 대기','コントラクト待機','Hợp đồng đang chờ','Contrato pendente'],
'Double Power active':['Double Power aktif','Double Power 已激活','Double Power activo','Double Power نشط','Double Power активен','Double Power 활성','Double Power有効','Double Power đang hoạt động','Double Power ativo'],
'Power Booster active':['Power Booster aktif','Power Booster 已激活','Power Booster activo','Power Booster نشط','Power Booster активен','Power Booster 활성','Power Booster有効','Power Booster đang hoạt động','Power Booster ativo'],
'Ready — 30 day duration':['Siap — durasi 30 hari','就绪 — 30天','Listo — duración 30 días','جاهز — مدة 30 يوماً','Готово — 30 дней','준비 완료 — 30일','準備完了 — 30日間','Sẵn sàng — 30 ngày','Pronto — duração de 30 dias'],
'Mining window inactive':['Periode mining tidak aktif','挖矿期未激活','Período de minería inactivo','فترة التعدين غير نشطة','Период майнинга неактивен','마이닝 기간 비활성','マイニング期間は無効','Thời gian khai thác không hoạt động','Período de mineração inativo'],
'{count}/5 referrals — not eligible yet':['{count}/5 referral — belum memenuhi syarat','{count}/5 推荐 — 尚不符合条件','{count}/5 referidos — aún no elegible','{count}/5 إحالات — غير مؤهل بعد','{count}/5 рефералов — пока недоступно','{count}/5 추천 — 아직 자격 없음','{count}/5 紹介 — まだ対象外','{count}/5 giới thiệu — chưa đủ điều kiện','{count}/5 indicações — ainda não elegível'],
'Mining active':['Mining aktif','挖矿已激活','Minería activa','التعدين نشط','Майнинг активен','마이닝 활성','マイニング有効','Khai thác đang hoạt động','Mineração ativa'],
'Reward multiplier {value}×':['Pengali reward {value}×','奖励倍数 {value}×','Multiplicador de recompensa {value}×','مضاعف المكافأة {value}×','Множитель награды {value}×','보상 배수 {value}×','報酬倍率 {value}×','Hệ số thưởng {value}×','Multiplicador de recompensa {value}×'],
'Claim Position #{number}':['Posisi Klaim #{number}','领取仓位 #{number}','Posición de Reclamo #{number}','مركز الاستلام #{number}','Позиция получения #{number}','수령 포지션 #{number}','受取ポジション #{number}','Vị trí nhận #{number}','Posição de Resgate #{number}'],
'Latest':['Terbaru','最新','Más reciente','الأحدث','Последняя','최신','最新','Mới nhất','Mais recente'],
'Daily mining':['Mining harian','每日挖矿','Minería diaria','التعدين اليومي','Ежедневный майнинг','일일 마이닝','デイリーマイニング','Khai thác hằng ngày','Mineração diária'],
'Vested ATH':['ATH Vesting','已解锁 ATH','ATH en Vesting','ATH المستحق','ATH в вестинге','베스팅 ATH','ベスティングATH','ATH Vesting','ATH em Vesting'],
'{label}: confirm the transaction in your wallet.':['{label}: konfirmasi transaksi di wallet Anda.','{label}：请在钱包中确认交易。','{label}: confirma la transacción en tu wallet.','{label}: أكد المعاملة في محفظتك.','{label}: подтвердите транзакцию в кошельке.','{label}: 지갑에서 거래를 확인하세요.','{label}: ウォレットで取引を確認してください。','{label}: xác nhận giao dịch trong ví.','{label}: confirme a transação na sua wallet.'],
'{label}: submitted {hash}':['{label}: dikirim {hash}','{label}：已提交 {hash}','{label}: enviado {hash}','{label}: تم الإرسال {hash}','{label}: отправлено {hash}','{label}: 제출됨 {hash}','{label}: 送信済み {hash}','{label}: đã gửi {hash}','{label}: enviado {hash}'],
'{label}: confirmed.':['{label}: terkonfirmasi.','{label}：已确认。','{label}: confirmado.','{label}: تم التأكيد.','{label}: подтверждено.','{label}: 확인됨.','{label}: 確認済み。','{label}: đã xác nhận.','{label}: confirmado.'],
'{label} failed.':['{label} gagal.','{label} 失败。','{label} falló.','فشل {label}.','Ошибка {label}.','{label} 실패.','{label} に失敗しました。','{label} thất bại.','{label} falhou.']
};
function lang(){const c=(localStorage.getItem('aether-mining-lang')||document.documentElement.lang||navigator.language||'en').toLowerCase().split('-')[0];return LANGS.includes(c)?c:'en'}
function t(key,vars={}){const c=lang(),i=LANGS.indexOf(c)-1;let out=c==='en'?key:(D[key]?.[i]||key);return String(out).replace(/\{(\w+)\}/g,(_,k)=>vars[k]??`{${k}}`)}
window.aetherMiningT=t;
window.aetherMiningLocale=()=>LOCALES[lang()]||'en-GB';
window.addEventListener('aether-language-change',()=>{try{window.setSystemStatus?.();window.paintUser?.();window.syncPositionSelect?.();Promise.resolve(window.loadSelectedVesting?.()).catch(()=>{})}catch(e){console.warn('i18n repaint',e)}});
})();