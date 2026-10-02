(()=>{
const L=['id','zh','es','ar','ru','ko','ja','vi','pt'];
const X={
'30 Days':['30 Hari','30天','30 Días','30 يوماً','30 дней','30일','30日','30 Ngày','30 Dias'],
'60 Days':['60 Hari','60天','60 Días','60 يوماً','60 дней','60일','60日','60 Ngày','60 Dias'],
'90 Days':['90 Hari','90天','90 Días','90 يوماً','90 дней','90일','90日','90 Ngày','90 Dias'],
'30-day Unlock':['Unlock 30 hari','30天解锁','Desbloqueo de 30 días','فتح 30 يوماً','Разблокировка 30 дней','30일 해제','30日解除','Mở khóa 30 ngày','Desbloqueio de 30 dias'],
'60-day Unlock':['Unlock 60 hari','60天解锁','Desbloqueo de 60 días','فتح 60 يوماً','Разблокировка 60 дней','60일 해제','60日解除','Mở khóa 60 ngày','Desbloqueio de 60 dias'],
'90-day Unlock':['Unlock 90 hari','90天解锁','Desbloqueo de 90 días','فتح 90 يوماً','Разблокировка 90 дней','90일 해제','90日解除','Mở khóa 90 ngày','Desbloqueio de 90 dias'],
'180-day Cycle Principal':['Pokok Siklus 180 hari','180天周期本金','Principal del ciclo de 180 días','أصل دورة 180 يوماً','Основная сумма цикла 180 дней','180일 주기 원금','180日サイクル元本','Gốc chu kỳ 180 ngày','Principal do ciclo de 180 dias'],
'Burn on Entry 10%':['Burn saat Masuk 10%','进入时销毁10%','Quema al entrar 10%','حرق عند الدخول 10%','Сжигание при входе 10%','진입 시 10% 소각','開始時10%バーン','Đốt khi vào 10%','Queima na entrada 10%'],
'+30d Unlock 10%':['+30 hari Unlock 10%','+30天解锁10%','+30d Desbloqueo 10%','+30 يوم فتح 10%','+30д разблокировка 10%','+30일 해제 10%','+30日解除10%','+30 ngày mở 10%','+30d Desbloqueio 10%'],
'+60d Unlock 5%':['+60 hari Unlock 5%','+60天解锁5%','+60d Desbloqueo 5%','+60 يوم فتح 5%','+60д разблокировка 5%','+60일 해제 5%','+60日解除5%','+60 ngày mở 5%','+60d Desbloqueio 5%'],
'+90d Unlock 5%':['+90 hari Unlock 5%','+90天解锁5%','+90d Desbloqueo 5%','+90 يوم فتح 5%','+90д разблокировка 5%','+90일 해제 5%','+90日解除5%','+90 ngày mở 5%','+90d Desbloqueio 5%'],
'Roll Forward 70%':['Diteruskan 70%','滚存70%','Transferir 70%','ترحيل 70%','Перенос 70%','70% 이월','70%繰越','Chuyển tiếp 70%','Transferir 70%'],
'Final Cycle-12 Burn 60%':['Burn Akhir Siklus-12 60%','第12周期最终销毁60%','Quema final ciclo 12 60%','حرق نهائي للدورة 12 بنسبة 60%','Финальное сжигание цикла 12 — 60%','12주기 최종 소각 60%','サイクル12最終バーン60%','Đốt cuối Chu kỳ 12 60%','Queima final Ciclo 12 60%'],
'Final Distribution 40%':['Distribusi Akhir 40%','最终分配40%','Distribución final 40%','التوزيع النهائي 40%','Финальное распределение 40%','최종 분배 40%','最終配布40%','Phân phối cuối 40%','Distribuição final 40%']};
const n=s=>String(s||'').trim().replace(/\s+/g,' ');
function lang(){return (localStorage.getItem('aether-mining-lang')||document.documentElement.lang||'en').toLowerCase().split('-')[0]}
function apply(){const c=lang(),i=L.indexOf(c);localStorage.setItem('aetherMiningLang',c);if(c==='en'||i<0)return;document.querySelectorAll('body *').forEach(e=>{if(e.children.length||['SCRIPT','STYLE'].includes(e.tagName))return;const v=X[n(e.textContent)];if(v?.[i])e.textContent=v[i]});window.dispatchEvent(new CustomEvent('aether:languagechange',{detail:{language:c}}))}
window.addEventListener('aether-language-change',()=>setTimeout(apply,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
})();