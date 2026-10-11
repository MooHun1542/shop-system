(function(){
'use strict';
const key='shop-system-v1', recovery='shop-pre-import-recovery';
const button=document.getElementById('recoverImport');
if(!button)return;
function refresh(){button.hidden=!localStorage.getItem(recovery);}
refresh();
button.addEventListener('click',function(){
 const snapshot=localStorage.getItem(recovery);
 if(!snapshot)return refresh();
 let data;
 try{data=JSON.parse(snapshot);if(!data||!Array.isArray(data.products)||!Array.isArray(data.sales))throw Error('invalid');}
 catch(_){alert('ข้อมูลกู้คืนไม่ถูกต้อง');return;}
 if(!confirm('คืนค่าข้อมูลก่อนนำเข้าครั้งล่าสุด? ข้อมูลปัจจุบันจะถูกแทนที่ กรุณาสำรองข้อมูลปัจจุบันก่อน'))return;
 try{localStorage.setItem(key,snapshot);localStorage.removeItem(recovery);}
 catch(_){alert('กู้คืนไม่สำเร็จ');return;}
 location.reload();
});
})();