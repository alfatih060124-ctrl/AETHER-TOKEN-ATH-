(()=>{
const langs={en:'English',id:'Indonesia',zh:'中文',es:'Español',ar:'العربية',ru:'Русский',ko:'한국어',ja:'日本語',vi:'Tiếng Việt',pt:'Português'};
const L=['id','zh','es','ar','ru','ko','ja','vi','pt'];
const R={
'Home':['Beranda','首页','Inicio','الرئيسية','Главная','홈','ホーム','Trang chủ','Início'],
'Mining':['Mining','挖矿','Minería','التعدين','Майнинг','마이닝','マイニング','Khai thác','Mineração'],
'Buy ATH':['Beli ATH','购买 ATH','Comprar ATH','شراء ATH','Купить ATH','ATH 구매','ATHを購入','Mua ATH','Comprar ATH'],
'Leaderboard':['Papan Peringkat','排行榜','Clasificación','لوحة المتصدرين','Рейтинг','리더보드','ランキング','Bảng xếp hạng','Classificação'],
'Referral':['Referral','推荐','Referidos','الإحالة','Рефералы','추천','紹介','Giới thiệu','Indicação'],
'Docs':['Dokumen','文档','Documentos','المستندات','Документы','문서','ドキュメント','Tài liệu','Documentos'],
'Connect Wallet':['Hubungkan Wallet','连接钱包','Conectar Wallet','ربط المحفظة','Подключить кошелёк','지갑 연결','ウォレット接続','Kết nối ví','Conectar Wallet'],
'Disconnect':['Putuskan','断开连接','Desconectar','قطع الاتصال','Отключить','연결 해제','切断','Ngắt kết nối','Desconectar'],
'THE NEXT ERA OF DECENTRALIZED VALUE':['ERA BARU NILAI TERDESENTRALISASI','去中心化价值的新时代','LA NUEVA ERA DEL VALOR DESCENTRALIZADO','العصر الجديد للقيمة اللامركزية','НОВАЯ ЭРА ДЕЦЕНТРАЛИЗОВАННОЙ ЦЕННОСТИ','탈중앙화 가치의 새로운 시대','分散型価値の新時代','KỶ NGUYÊN MỚI CỦA GIÁ TRỊ PHI TẬP TRUNG','A NOVA ERA DO VALOR DESCENTRALIZADO'],
'Mine. Earn. Grow Together.':['Mining. Hasilkan. Tumbuh Bersama.','挖矿。赚取。共同成长。','Mina. Gana. Crece Juntos.','عدّن. اربح. انمُ معاً.','Майнинг. Зарабатывайте. Растите вместе.','채굴. 보상. 함께 성장.','マイニング。獲得。共に成長。','Khai thác. Kiếm thưởng. Cùng phát triển.','Minere. Ganhe. Cresça Juntos.'],
'Start Mining Now':['Mulai Mining Sekarang','立即开始挖矿','Comenzar Minería','ابدأ التعدين الآن','Начать майнинг','지금 마이닝 시작','今すぐマイニング','Bắt đầu khai thác','Começar Mineração'],
'Learn More':['Pelajari Lebih Lanjut','了解更多','Más Información','اعرف المزيد','Подробнее','자세히 보기','詳しく見る','Tìm hiểu thêm','Saiba Mais'],
'PEOPLE':['MANUSIA','人','PERSONAS','الناس','ЛЮДИ','사람','人々','CON NGƯỜI','PESSOAS'],
'UTILITY':['UTILITAS','实用性','UTILIDAD','المنفعة','ПОЛЕЗНОСТЬ','유틸리티','ユーティリティ','TIỆN ÍCH','UTILIDADE'],
'COMMUNITY':['KOMUNITAS','社区','COMUNIDAD','المجتمع','СООБЩЕСТВО','커뮤니티','コミュニティ','CỘNG ĐỒNG','COMUNIDADE'],
'A BRIGHTER TOMORROW':['MASA DEPAN LEBIH CERAH','更光明的未来','UN MAÑANA MÁS BRILLANTE','غد أكثر إشراقاً','СВЕТЛОЕ БУДУЩЕЕ','더 밝은 내일','より明るい未来','NGÀY MAI TƯƠI SÁNG HƠN','UM AMANHÃ MAIS BRILHANTE'],
'Buy Power':['Beli Power','购买算力','Comprar Power','شراء الطاقة','Купить Power','파워 구매','Powerを購入','Mua Power','Comprar Power'],
'Activate your 180-day mining window.':['Aktifkan periode mining 180 hari.','激活180天挖矿期。','Activa tu período de minería de 180 días.','فعّل فترة التعدين لمدة 180 يوماً.','Активируйте 180-дневный период майнинга.','180일 마이닝 기간을 활성화하세요.','180日間のマイニング期間を有効化。','Kích hoạt thời gian khai thác 180 ngày.','Ative seu período de mineração de 180 dias.'],
'Sponsor wallet (optional)':['Wallet sponsor (opsional)','赞助钱包（可选）','Wallet patrocinadora (opcional)','محفظة الراعي (اختياري)','Кошелёк спонсора (необязательно)','스폰서 지갑 (선택)','スポンサーウォレット（任意）','Ví người giới thiệu (tùy chọn)','Wallet do patrocinador (opcional)'],
'Wallet not connected':['Wallet belum terhubung','钱包未连接','Wallet no conectada','المحفظة غير متصلة','Кошелёк не подключён','지갑이 연결되지 않음','ウォレット未接続','Ví chưa kết nối','Wallet não conectada'],
'Power Booster':['Power Booster','算力加速器','Power Booster','معزز الطاقة','Power Booster','파워 부스터','Power Booster','Power Booster','Power Booster'],
'Buy Power Booster':['Beli Power Booster','购买算力加速器','Comprar Power Booster','شراء معزز الطاقة','Купить Power Booster','파워 부스터 구매','Power Boosterを購入','Mua Power Booster','Comprar Power Booster'],
'Power required':['Power diperlukan','需要 Power','Se requiere Power','يتطلب Power','Требуется Power','Power 필요','Powerが必要','Cần Power','Power necessário'],
'Double Power Booster':['Double Power Booster','双倍算力加速器','Double Power Booster','معزز الطاقة المزدوج','Double Power Booster','더블 파워 부스터','Double Power Booster','Double Power Booster','Double Power Booster'],
'Activate Double Power':['Aktifkan Double Power','激活双倍算力','Activar Double Power','تفعيل الطاقة المزدوجة','Активировать Double Power','더블 파워 활성화','Double Powerを有効化','Kích hoạt Double Power','Ativar Double Power'],
'Daily Claim':['Klaim Harian','每日领取','Reclamo Diario','المطالبة اليومية','Ежедневное получение','일일 수령','デイリー受取','Nhận hàng ngày','Resgate Diário'],
'Claim Now':['Klaim Sekarang','立即领取','Reclamar Ahora','استلم الآن','Получить сейчас','지금 받기','今すぐ受取','Nhận ngay','Resgatar Agora'],
'Waiting for active Power':['Menunggu Power aktif','等待有效 Power','Esperando Power activo','بانتظار Power النشط','Ожидание активного Power','활성 Power 대기 중','有効なPowerを待機中','Đang chờ Power hoạt động','Aguardando Power ativo'],
'Vesting Progress':['Progres Vesting','解锁进度','Progreso de Vesting','تقدم الاستحقاق','Прогресс вестинга','베스팅 진행','ベスティング進捗','Tiến độ Vesting','Progresso de Vesting'],
'View Vesting':['Lihat Vesting','查看解锁','Ver Vesting','عرض الاستحقاق','Посмотреть вестинг','베스팅 보기','ベスティングを見る','Xem Vesting','Ver Vesting'],
'Referral Bonus':['Bonus Referral','推荐奖励','Bono de Referido','مكافأة الإحالة','Реферальный бонус','추천 보너스','紹介ボーナス','Thưởng giới thiệu','Bônus de Indicação'],
'Referral Details':['Detail Referral','推荐详情','Detalles de Referidos','تفاصيل الإحالة','Детали рефералов','추천 상세','紹介詳細','Chi tiết giới thiệu','Detalhes de Indicação'],
'Current Price':['Harga Saat Ini','当前价格','Precio Actual','السعر الحالي','Текущая цена','현재 가격','現在価格','Giá hiện tại','Preço Atual'],
'Mining Window':['Periode Mining','挖矿期','Período de Minería','فترة التعدين','Период майнинга','마이닝 기간','マイニング期間','Thời gian khai thác','Período de Mineração'],
'180 Days':['180 Hari','180天','180 Días','180 يوماً','180 дней','180일','180日','180 Ngày','180 Dias'],
'View Details':['Lihat Detail','查看详情','Ver Detalles','عرض التفاصيل','Подробнее','상세 보기','詳細を見る','Xem chi tiết','Ver Detalhes'],
'Your Miner Status':['Status Miner Anda','您的矿工状态','Estado de tu Minero','حالة التعدين الخاصة بك','Статус майнера','내 마이너 상태','マイナー状態','Trạng thái Miner','Status do Miner'],
'Active':['Aktif','活跃','Activo','نشط','Активен','활성','アクティブ','Hoạt động','Ativo'],
'Hash Power':['Hash Power','算力','Hash Power','قوة الهاش','Хешрейт','해시 파워','ハッシュパワー','Hash Power','Hash Power'],
'Total Allocated':['Total Dialokasikan','总分配量','Total Asignado','إجمالي المخصص','Всего выделено','총 할당량','総割当量','Tổng phân bổ','Total Alocado'],
'Daily Reward':['Reward Harian','每日奖励','Recompensa Diaria','المكافأة اليومية','Ежедневная награда','일일 보상','デイリー報酬','Phần thưởng hàng ngày','Recompensa Diária'],
'Start Mining':['Mulai Mining','开始挖矿','Iniciar Minería','ابدأ التعدين','Начать майнинг','마이닝 시작','マイニング開始','Bắt đầu khai thác','Iniciar Mineração'],
'Day':['Hari','天','Día','يوم','День','일','日','Ngày','Dia'],
'Not active':['Tidak aktif','未激活','No activo','غير نشط','Неактивен','비활성','非アクティブ','Không hoạt động','Inativo'],
'Vesting Unlock Timeline':['Jadwal Unlock Vesting','解锁时间表','Cronograma de Desbloqueo','الجدول الزمني للاستحقاق','График разблокировки','베스팅 해제 일정','ベスティング解除予定','Lịch mở khóa Vesting','Cronograma de Desbloqueio'],
'Claim All Unlocked':['Klaim Semua yang Terbuka','领取全部已解锁','Reclamar Todo Desbloqueado','استلام كل المستحق','Получить всё разблокированное','해제분 모두 받기','解除済みをすべて受取','Nhận tất cả đã mở khóa','Resgatar Tudo Desbloqueado'],
'Claimed':['Sudah Diklaim','已领取','Reclamado','تم الاستلام','Получено','수령 완료','受取済み','Đã nhận','Resgatado'],
'Pending':['Menunggu','待处理','Pendiente','قيد الانتظار','Ожидание','대기 중','保留中','Đang chờ','Pendente'],
'Burned':['Dibakar','已销毁','Quemado','تم الحرق','Сожжено','소각됨','バーン済み','Đã đốt','Queimado'],
'Network & Contract Status':['Status Jaringan & Kontrak','网络与合约状态','Estado de Red y Contrato','حالة الشبكة والعقد','Статус сети и контракта','네트워크 및 컨트랙트 상태','ネットワークとコントラクト状態','Trạng thái Mạng & Hợp đồng','Status da Rede e Contrato'],
'Wallet Status':['Status Wallet','钱包状态','Estado de Wallet','حالة المحفظة','Статус кошелька','지갑 상태','ウォレット状態','Trạng thái Ví','Status da Wallet'],
'Not Connected':['Belum Terhubung','未连接','No Conectado','غير متصل','Не подключено','연결 안 됨','未接続','Chưa kết nối','Não Conectado'],
'Network':['Jaringan','网络','Red','الشبكة','Сеть','네트워크','ネットワーク','Mạng','Rede'],
'Connected':['Terhubung','已连接','Conectado','متصل','Подключено','연결됨','接続済み','Đã kết nối','Conectado'],
'Contract Status':['Status Kontrak','合约状态','Estado del Contrato','حالة العقد','Статус контракта','컨트랙트 상태','コントラクト状態','Trạng thái Hợp đồng','Status do Contrato'],
'Mining Contract':['Kontrak Mining','挖矿合约','Contrato de Minería','عقد التعدين','Майнинг-контракт','마이닝 컨트랙트','マイニングコントラクト','Hợp đồng khai thác','Contrato de Mineração'],
'Daily Reward Transparency':['Transparansi Reward Harian','每日奖励透明度','Transparencia de Recompensa Diaria','شفافية المكافأة اليومية','Прозрачность ежедневной награды','일일 보상 투명성','デイリー報酬の透明性','Minh bạch Phần thưởng Hàng ngày','Transparência da Recompensa Diária'],
'Status':['Status','状态','Estado','الحالة','Статус','상태','ステータス','Trạng thái','Status'],
'Not available':['Belum tersedia','不可用','No disponible','غير متاح','Недоступно','사용 불가','利用不可','Chưa có','Indisponível'],
'Reward Today':['Reward Hari Ini','今日奖励','Recompensa de Hoy','مكافأة اليوم','Награда сегодня','오늘 보상','本日の報酬','Phần thưởng hôm nay','Recompensa de Hoje'],
'Formula':['Formula','公式','Fórmula','الصيغة','Формула','공식','計算式','Công thức','Fórmula'],
'Claim Window':['Waktu Klaim','领取窗口','Ventana de Reclamo','نافذة الاستلام','Окно получения','수령 시간','受取時間','Khung giờ nhận','Janela de Resgate'],
'Deadline':['Batas Waktu','截止时间','Fecha Límite','الموعد النهائي','Крайний срок','마감','期限','Hạn chót','Prazo'],
'On-chain Vesting Ledger':['Ledger Vesting On-chain','链上解锁账本','Libro de Vesting On-chain','سجل الاستحقاق على السلسلة','Ончейн-реестр вестинга','온체인 베스팅 원장','オンチェーン・ベスティング台帳','Sổ Vesting On-chain','Ledger de Vesting On-chain'],
'Vesting position':['Posisi vesting','解锁仓位','Posición de vesting','مركز الاستحقاق','Позиция вестинга','베스팅 포지션','ベスティングポジション','Vị trí vesting','Posição de vesting'],
'No positions yet':['Belum ada posisi','暂无仓位','Aún no hay posiciones','لا توجد مراكز بعد','Позиций пока нет','아직 포지션 없음','まだポジションなし','Chưa có vị trí','Ainda sem posições'],
'Claim Amount':['Jumlah Klaim','领取数量','Cantidad de Reclamo','مبلغ الاستلام','Сумма получения','수령 금액','受取額','Số lượng nhận','Valor do Resgate'],
'Current Cycle':['Siklus Saat Ini','当前周期','Ciclo Actual','الدورة الحالية','Текущий цикл','현재 사이클','現在のサイクル','Chu kỳ hiện tại','Ciclo Atual'],
'Claimable Now':['Bisa Diklaim Sekarang','当前可领取','Disponible Ahora','قابل للاستلام الآن','Доступно сейчас','지금 수령 가능','現在受取可能','Có thể nhận ngay','Resgatável Agora'],
'Burned So Far':['Total Dibakar','累计销毁','Quemado Hasta Ahora','المحروق حتى الآن','Сожжено к настоящему моменту','현재까지 소각','これまでのバーン','Đã đốt đến nay','Queimado Até Agora'],
'12-Cycle Preview':['Pratinjau 12 Siklus','12周期预览','Vista Previa de 12 Ciclos','معاينة 12 دورة','Предпросмотр 12 циклов','12사이클 미리보기','12サイクルプレビュー','Xem trước 12 chu kỳ','Prévia de 12 Ciclos'],
'Cycle':['Siklus','周期','Ciclo','الدورة','Цикл','사이클','サイクル','Chu kỳ','Ciclo'],
'Incoming':['Masuk','流入','Entrada','الوارد','Входящий','유입','流入','Đầu vào','Entrada'],
'Scheduled Start':['Mulai Terjadwal','计划开始','Inicio Programado','البدء المجدول','Запланированный старт','예정 시작','予定開始','Bắt đầu theo lịch','Início Programado'],
'On-chain Entry':['Entri On-chain','链上记录','Entrada On-chain','إدخال على السلسلة','Ончейн-запись','온체인 기록','オンチェーン記録','Bản ghi On-chain','Entrada On-chain'],
'Not entered':['Belum masuk','尚未进入','No ingresado','لم يتم الإدخال','Не введено','미진입','未記録','Chưa vào','Não inserido'],
'Final Settlement':['Settlement Akhir','最终结算','Liquidación Final','التسوية النهائية','Финальный расчёт','최종 정산','最終決済','Quyết toán cuối','Liquidação Final'],
'Referral Program':['Program Referral','推荐计划','Programa de Referidos','برنامج الإحالة','Реферальная программа','추천 프로그램','紹介プログラム','Chương trình giới thiệu','Programa de Indicação'],
'Your Referral Status':['Status Referral Anda','您的推荐状态','Estado de tus Referidos','حالة الإحالة الخاصة بك','Статус рефералов','내 추천 상태','紹介ステータス','Trạng thái giới thiệu','Status de Indicação'],
'Active Referrals':['Referral Aktif','活跃推荐','Referidos Activos','الإحالات النشطة','Активные рефералы','활성 추천','有効な紹介','Giới thiệu đang hoạt động','Indicações Ativas'],
'Current Bonus':['Bonus Saat Ini','当前奖励','Bono Actual','المكافأة الحالية','Текущий бонус','현재 보너스','現在のボーナス','Thưởng hiện tại','Bônus Atual'],
'Max Bonus':['Bonus Maksimal','最高奖励','Bono Máximo','الحد الأقصى للمكافأة','Максимальный бонус','최대 보너스','最大ボーナス','Thưởng tối đa','Bônus Máximo'],
'STRONGER TOGETHER':['LEBIH KUAT BERSAMA','携手更强','MÁS FUERTES JUNTOS','أقوى معاً','ВМЕСТЕ СИЛЬНЕЕ','함께 더 강하게','共により強く','CÙNG NHAU MẠNH MẼ HƠN','MAIS FORTES JUNTOS'],
'More Friends.':['Lebih Banyak Teman.','更多朋友。','Más Amigos.','المزيد من الأصدقاء.','Больше друзей.','더 많은 친구.','もっと多くの仲間。','Thêm bạn bè.','Mais Amigos.'],
'More Rewards.':['Lebih Banyak Reward.','更多奖励。','Más Recompensas.','المزيد من المكافآت.','Больше наград.','더 많은 보상.','もっと多くの報酬。','Thêm phần thưởng.','Mais Recompensas.'],
'A Brighter Tomorrow.':['Masa Depan Lebih Cerah.','更光明的未来。','Un Mañana Más Brillante.','غد أكثر إشراقاً.','Светлое будущее.','더 밝은 내일.','より明るい未来。','Ngày mai tươi sáng hơn.','Um Amanhã Mais Brilhante.'],
'SECURITY MODE':['MODE KEAMANAN','安全模式','MODO DE SEGURIDAD','وضع الأمان','РЕЖИМ БЕЗОПАСНОСТИ','보안 모드','セキュリティモード','CHẾ ĐỘ BẢO MẬT','MODO DE SEGURANÇA'],
'Fixed 1B Supply':['Supply Tetap 1B','固定10亿供应量','Suministro Fijo de 1B','إمداد ثابت 1B','Фиксированная эмиссия 1B','고정 10억 공급량','固定10億供給','Nguồn cung cố định 1B','Oferta Fixa de 1B'],
'No Mint Function':['Tanpa Fungsi Mint','无增发功能','Sin Función Mint','بدون وظيفة Mint','Без функции Mint','민트 기능 없음','Mint機能なし','Không có chức năng Mint','Sem Função Mint'],
'Reserve Checks':['Pemeriksaan Reserve','储备检查','Verificación de Reservas','فحوصات الاحتياطي','Проверки резерва','리저브 검사','リザーブ確認','Kiểm tra dự trữ','Verificações de Reserva'],
'Wallet-Side Signing':['Signing di Wallet','钱包端签名','Firma en Wallet','التوقيع داخل المحفظة','Подпись в кошельке','지갑 측 서명','ウォレット側署名','Ký tại ví','Assinatura na Wallet'],
'2× your referral-adjusted reward for 30 days. Adds 100 Hash.':['2× reward setelah referral selama 30 hari. Menambah 100 Hash.','2× 推荐调整后奖励，持续30天。增加100 Hash。','2× la recompensa ajustada por referidos durante 30 días. Añade 100 Hash.','مكافأة 2× بعد تعديل الإحالة لمدة 30 يوماً. تضيف 100 Hash.','2× награда с учётом рефералов на 30 дней. Добавляет 100 Hash.','추천 반영 보상 2×, 30일간. 100 Hash 추가.','紹介調整後の報酬が30日間2倍。100 Hash追加。','2× phần thưởng sau giới thiệu trong 30 ngày. Thêm 100 Hash.','2× a recompensa ajustada por indicação por 30 dias. Adiciona 100 Hash.'],
'3× the active Power Booster reward. Requires 5 referrals and follows the same expiry.':['3× reward Power Booster aktif. Memerlukan 5 referral dan mengikuti masa berlaku yang sama.','3× 当前 Power Booster 奖励。需要5个推荐，并使用相同到期时间。','3× la recompensa del Power Booster activo. Requiere 5 referidos y comparte el mismo vencimiento.','3× مكافأة Power Booster النشط. يتطلب 5 إحالات ويتبع نفس الانتهاء.','3× награда активного Power Booster. Требуется 5 рефералов, срок тот же.','활성 Power Booster 보상 3×. 추천 5명이 필요하며 동일한 만료를 따릅니다.','有効なPower Booster報酬が3倍。紹介5件が必要で同じ期限に従います。','3× phần thưởng Power Booster đang hoạt động. Cần 5 giới thiệu và cùng thời hạn.','3× a recompensa do Power Booster ativo. Requer 5 indicações e segue o mesmo vencimento.'],
'5 referrals + active Power Booster required':['Diperlukan 5 referral + Power Booster aktif','需要5个推荐 + 有效 Power Booster','Se requieren 5 referidos + Power Booster activo','مطلوب 5 إحالات + Power Booster نشط','Требуется 5 рефералов + активный Power Booster','추천 5명 + 활성 Power Booster 필요','紹介5件 + 有効なPower Boosterが必要','Cần 5 giới thiệu + Power Booster đang hoạt động','Necessárias 5 indicações + Power Booster ativo'],
'Reward opens 00:05 UTC and expires at 23:59:59 UTC if not claimed.':['Reward dibuka 00:05 UTC dan kedaluwarsa 23:59:59 UTC jika tidak diklaim.','奖励于00:05 UTC开放，未领取则在23:59:59 UTC过期。','La recompensa abre a las 00:05 UTC y vence a las 23:59:59 UTC si no se reclama.','تفتح المكافأة 00:05 UTC وتنتهي 23:59:59 UTC إذا لم تُستلم.','Награда открывается в 00:05 UTC и истекает в 23:59:59 UTC, если не получена.','보상은 00:05 UTC에 열리고 미수령 시 23:59:59 UTC에 만료됩니다.','報酬は00:05 UTCに開始し、未受取の場合23:59:59 UTCに失効します。','Phần thưởng mở lúc 00:05 UTC và hết hạn 23:59:59 UTC nếu chưa nhận.','A recompensa abre às 00:05 UTC e expira às 23:59:59 UTC se não for resgatada.'],
'Tokens are released automatically according to schedule.':['Token dilepas otomatis sesuai jadwal.','代币按计划自动释放。','Los tokens se liberan automáticamente según el calendario.','يتم تحرير التوكنات تلقائياً حسب الجدول.','Токены автоматически разблокируются по графику.','토큰은 일정에 따라 자동 해제됩니다.','トークンはスケジュールに従って自動解除されます。','Token được mở tự động theo lịch.','Os tokens são liberados automaticamente conforme o cronograma.'],
'Invite friends, grow the community, and increase your mining bonus.':['Undang teman, kembangkan komunitas, dan tingkatkan bonus mining Anda.','邀请朋友、壮大社区并提高挖矿奖励。','Invita amigos, haz crecer la comunidad y aumenta tu bono de minería.','ادعُ الأصدقاء ونمِّ المجتمع وزد مكافأة التعدين.','Приглашайте друзей, развивайте сообщество и увеличивайте бонус майнинга.','친구를 초대하고 커뮤니티를 성장시켜 마이닝 보너스를 높이세요.','友達を招待し、コミュニティを成長させ、マイニングボーナスを増やしましょう。','Mời bạn bè, phát triển cộng đồng và tăng thưởng khai thác.','Convide amigos, amplie a comunidade e aumente seu bônus de mineração.'],
'Fail-closed until the verified contract is connected.':['Fail-closed sampai kontrak terverifikasi terhubung.','在已验证合约连接前保持故障关闭。','Fail-closed hasta conectar el contrato verificado.','يبقى النظام مغلقاً بأمان حتى ربط العقد الموثق.','Fail-closed до подключения проверенного контракта.','검증된 컨트랙트 연결 전까지 fail-closed 유지.','検証済みコントラクト接続までfail-closedを維持。','Giữ fail-closed cho đến khi hợp đồng đã xác minh được kết nối.','Fail-closed até o contrato verificado ser conectado.'],
'Whitepaper':['Whitepaper','白皮书','Whitepaper','الورقة البيضاء','Whitepaper','백서','ホワイトペーパー','Whitepaper','Whitepaper'],
'Roadmap':['Peta Jalan','路线图','Hoja de Ruta','خارطة الطريق','Дорожная карта','로드맵','ロードマップ','Lộ trình','Roteiro'],
'Developers':['Pengembang','开发者','Desarrolladores','المطورون','Разработчики','개발자','開発者','Nhà phát triển','Desenvolvedores'],
'ATH TOKEN DOCUMENTATION':['DOKUMENTASI TOKEN ATH','ATH 代币文档','DOCUMENTACIÓN DEL TOKEN ATH','توثيق توكن ATH','ДОКУМЕНТАЦИЯ ТОКЕНА ATH','ATH 토큰 문서','ATHトークンドキュメント','TÀI LIỆU TOKEN ATH','DOCUMENTAÇÃO DO TOKEN ATH'],
'Download Whitepaper PDF':['Unduh Whitepaper PDF','下载白皮书 PDF','Descargar Whitepaper PDF','تنزيل الورقة البيضاء PDF','Скачать Whitepaper PDF','백서 PDF 다운로드','ホワイトペーパーPDFをダウンロード','Tải Whitepaper PDF','Baixar Whitepaper PDF'],
'View Roadmap':['Lihat Peta Jalan','查看路线图','Ver Hoja de Ruta','عرض خارطة الطريق','Посмотреть дорожную карту','로드맵 보기','ロードマップを見る','Xem lộ trình','Ver Roteiro'],
'BUILD WITH GATES, NOT PROMISES':['DIBANGUN DENGAN GATE, BUKAN JANJI','以门槛构建，而非承诺','CONSTRUIR CON CONTROLES, NO PROMESAS','نبني عبر بوابات تحقق لا وعود','СТРОИМ ЧЕРЕЗ КОНТРОЛЬНЫЕ ЭТАПЫ, А НЕ ОБЕЩАНИЯ','약속이 아닌 검증 게이트로 구축','約束ではなくゲートで構築','XÂY DỰNG BẰNG CỔNG KIỂM SOÁT, KHÔNG PHẢI LỜI HỨA','CONSTRUIR COM GATES, NÃO PROMESSAS'],
'ATH Roadmap':['Peta Jalan ATH','ATH 路线图','Hoja de Ruta ATH','خارطة طريق ATH','Дорожная карта ATH','ATH 로드맵','ATHロードマップ','Lộ trình ATH','Roteiro ATH'],
'PROTOCOL & CREATIVE TEAM':['TIM PROTOKOL & KREATIF','协议与创意团队','EQUIPO DE PROTOCOLO Y CREATIVO','فريق البروتوكول والإبداع','КОМАНДА ПРОТОКОЛА И КРЕАТИВА','프로토콜 & 크리에이티브 팀','プロトコル＆クリエイティブチーム','ĐỘI NGŨ GIAO THỨC & SÁNG TẠO','EQUIPE DE PROTOCOLO & CRIAÇÃO'],
'Developer Team':['Tim Pengembang','开发团队','Equipo de Desarrollo','فريق المطورين','Команда разработчиков','개발팀','開発チーム','Đội ngũ phát triển','Equipe de Desenvolvimento'],
'COMPLETE':['SELESAI','已完成','COMPLETO','مكتمل','ЗАВЕРШЕНО','완료','完了','HOÀN THÀNH','CONCLUÍDO'],
'NEXT GATE':['GATE BERIKUTNYA','下一关卡','SIGUIENTE CONTROL','البوابة التالية','СЛЕДУЮЩИЙ ЭТАП','다음 게이트','次のゲート','CỔNG TIẾP THEO','PRÓXIMO GATE'],
'PLANNED':['DIRENCANAKAN','计划中','PLANIFICADO','مخطط','ЗАПЛАНИРОВАНО','계획됨','計画済み','ĐÃ LÊN KẾ HOẠCH','PLANEJADO'],
'REQUIRED':['WAJIB','必需','REQUERIDO','مطلوب','ОБЯЗАТЕЛЬНО','필수','必須','BẮT BUỘC','OBRIGATÓRIO'],
'GATED':['TERGATE','受控','CONTROLADO','مقيد ببوابة','ЗА ГЕЙТОМ','게이트 적용','ゲート管理','CÓ KIỂM SOÁT','COM GATE'],
'FUTURE':['MASA DEPAN','未来','FUTURO','مستقبلي','БУДУЩЕЕ','미래','将来','TƯƠNG LAI','FUTURO'],
'Protocol Foundation':['Fondasi Protokol','协议基础','Fundación del Protocolo','أساس البروتوكول','Основа протокола','프로토콜 기반','プロトコル基盤','Nền tảng giao thức','Base do Protocolo'],
'Validation & Interfaces':['Validasi & Antarmuka','验证与界面','Validación e Interfaces','التحقق والواجهات','Валидация и интерфейсы','검증 & 인터페이스','検証とインターフェース','Xác thực & Giao diện','Validação & Interfaces'],
'BSC Testnet Deployment':['Deployment BSC Testnet','BSC 测试网部署','Despliegue en BSC Testnet','نشر BSC Testnet','Развертывание BSC Testnet','BSC 테스트넷 배포','BSC Testnetデプロイ','Triển khai BSC Testnet','Deploy na BSC Testnet'],
'Wallet Integration':['Integrasi Wallet','钱包集成','Integración de Wallet','تكامل المحفظة','Интеграция кошелька','지갑 통합','ウォレット統合','Tích hợp ví','Integração de Wallet'],
'Production Security':['Keamanan Produksi','生产安全','Seguridad de Producción','أمن الإنتاج','Безопасность продакшена','프로덕션 보안','本番セキュリティ','Bảo mật sản xuất','Segurança de Produção'],
'Mainnet & Liquidity':['Mainnet & Likuiditas','主网与流动性','Mainnet y Liquidez','Mainnet والسيولة','Mainnet и ликвидность','메인넷 & 유동성','Mainnetと流動性','Mainnet & Thanh khoản','Mainnet & Liquidez'],
'Ecosystem Expansion':['Ekspansi Ekosistem','生态扩展','Expansión del Ecosistema','توسيع النظام البيئي','Расширение экосистемы','생태계 확장','エコシステム拡張','Mở rộng hệ sinh thái','Expansão do Ecossistema'],
'Total Supply':['Total Pasokan','总供应量','Suministro Total','إجمالي المعروض','Общее предложение','총 공급량','総供給量','Tổng cung','Oferta Total'],
'Mining Reserve':['Cadangan Mining','挖矿储备','Reserva de Minería','احتياطي التعدين','Резерв майнинга','마이닝 리저브','マイニング準備金','Dự trữ khai thác','Reserva de Mineração'],
'Liquidity Reserve':['Cadangan Likuiditas','流动性储备','Reserva de Liquidez','احتياطي السيولة','Резерв ликвидности','유동성 리저브','流動性準備金','Dự trữ thanh khoản','Reserva de Liquidez'],
'Team / Dev':['Tim / Dev','团队 / 开发','Equipo / Dev','الفريق / التطوير','Команда / Dev','팀 / 개발','チーム / Dev','Đội ngũ / Dev','Equipe / Dev'],
'Marketing':['Marketing','市场营销','Marketing','التسويق','Маркетинг','마케팅','マーケティング','Marketing','Marketing'],
'0x0000… or blank':['0x0000… atau kosong','0x0000… 或留空','0x0000… o vacío','0x0000… أو اتركه فارغاً','0x0000… или пусто','0x0000… 또는 비워두기','0x0000… または空欄','0x0000… hoặc để trống','0x0000… ou vazio'],
'People · Utility · Community · A Brighter Tomorrow':['Manusia · Utilitas · Komunitas · Masa Depan Lebih Cerah','人 · 实用性 · 社区 · 更光明的未来','Personas · Utilidad · Comunidad · Un Mañana Más Brillante','الناس · المنفعة · المجتمع · غد أكثر إشراقاً','Люди · Полезность · Сообщество · Светлое будущее','사람 · 유틸리티 · 커뮤니티 · 더 밝은 내일','人々 · ユーティリティ · コミュニティ · より明るい未来','Con người · Tiện ích · Cộng đồng · Ngày mai tươi sáng hơn','Pessoas · Utilidade · Comunidade · Um Amanhã Mais Brilhante']
};
const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
const O=new WeakMap(),P=new WeakMap();let busy=false;
const reverse={};Object.entries(R).forEach(([en,a])=>a.forEach(v=>{reverse[norm(v)]=en}));
function code(){const x=(localStorage.getItem('aether-mining-lang')||localStorage.getItem('aetherMiningLang')||navigator.language||'en').toLowerCase();return langs[x]?x:(langs[x.split('-')[0]]?x.split('-')[0]:'en')}
function translated(base,c){if(!R[base])return null;if(c==='en')return base;const i=L.indexOf(c);return i>=0?(R[base]?.[i]||base):base}
function tr(c){if(busy)return;busy=true;
  document.querySelectorAll('body *').forEach(e=>{
    if(['SCRIPT','STYLE','OPTION'].includes(e.tagName)||e.children.length)return;
    const now=norm(e.textContent);
    if(R[now])O.set(e,now);else if(reverse[now])O.set(e,reverse[now]);
    const base=norm(O.get(e)||'');const val=translated(base,c);
    if(val!==null&&norm(e.textContent)!==val)e.textContent=val;
  });
  document.querySelectorAll('[placeholder]').forEach(e=>{
    const now=norm(e.getAttribute('placeholder'));
    if(R[now])P.set(e,now);else if(reverse[now])P.set(e,reverse[now]);
    const base=norm(P.get(e)||'');const val=translated(base,c);
    if(val!==null&&now!==val)e.setAttribute('placeholder',val);
  });
  busy=false;
}
function set(c){if(!langs[c])c='en';localStorage.setItem('aether-mining-lang',c);localStorage.setItem('aetherMiningLang',c);document.documentElement.lang=c;document.documentElement.dir=c==='ar'?'rtl':'ltr';const s=document.getElementById('aetherLangSelect');if(s)s.value=c;tr(c);window.dispatchEvent(new CustomEvent('aether-language-change',{detail:{language:c}}))}
function refresh(){requestAnimationFrame(()=>tr(code()))}
function init(){let s=document.getElementById('aetherLangSelect');if(!s){s=document.createElement('select');s.id='aetherLangSelect';s.className='aether-lang-select';s.setAttribute('aria-label','Language');Object.entries(langs).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v;s.appendChild(o)});const host=document.querySelector('.nav-actions')||document.querySelector('header')||document.body;host.prepend(s)}if(!s.dataset.i18nBound){s.dataset.i18nBound='1';s.addEventListener('change',()=>set(s.value))}set(code())}
window.addEventListener('aether-language-refresh',refresh);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();