(function () {
  'use strict';
  const KEY = 'shop-system-v1';
  const RECOVERY_KEY = 'shop-pre-import-recovery';
  const input = document.getElementById('importFile');
  const confirmButton = document.getElementById('importConfirm');
  const cancelButton = document.getElementById('importCancel');
  const modal = document.getElementById('importModal');
  const summary = document.getElementById('importSummary');
  if (!input || !confirmButton || !modal || !summary) return;
  let pending = null;
  const valid = data => !!(data && typeof data === 'object' && !Array.isArray(data) &&
    Array.isArray(data.products) && Array.isArray(data.sales) &&
    data.products.every(p => p && typeof p.id === 'string' && p.id.length &&
      typeof p.name === 'string' && p.name.trim().length &&
      typeof p.category === 'string' && Number.isFinite(Number(p.price)) && Number(p.price) >= 0) &&
    new Set(data.products.map(p => p.id)).size === data.products.length &&
    data.sales.every(s => s && Array.isArray(s.items) &&
      Number.isFinite(Number(s.total)) && Number(s.total) >= 0 &&
      s.items.every(i => i && typeof i.name === 'string' &&
        Number.isFinite(Number(i.price)) && Number(i.price) >= 0 &&
        Number.isInteger(Number(i.qty)) && Number(i.qty) > 0)));
  input.onchange = null;
  input.addEventListener('change', event => {
    event.stopImmediatePropagation();
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 15 MB');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!valid(data)) throw new Error('Invalid backup');
        pending = data;
        summary.textContent = 'สินค้า ' + data.products.length + ' รายการ / ประวัติ ' + data.sales.length + ' บิล (ระบบจะเก็บข้อมูลเดิมเพื่อกู้คืนก่อนนำเข้า)';
        modal.classList.add('open');
      } catch (_) {
        pending = null;
        input.value = '';
        alert('ไฟล์สำรองไม่ถูกต้อง');
      }
    };
    reader.onerror = () => { input.value = ''; alert('อ่านไฟล์ไม่สำเร็จ'); };
    reader.readAsText(file);
  }, true);
  confirmButton.onclick = () => {
    if (!pending || !valid(pending)) return;
    try {
      const previous = localStorage.getItem(KEY);
      if (previous !== null) localStorage.setItem(RECOVERY_KEY, previous);
      localStorage.setItem(KEY, JSON.stringify(pending));
    } catch (_) {
      alert('ไม่สามารถบันทึกข้อมูลสำรองหรือข้อมูลนำเข้าได้ ข้อมูลเดิมยังไม่ถูกเปลี่ยน');
      return;
    }
    pending = null;
    input.value = '';
    modal.classList.remove('open');
    location.reload();
  };
  if (cancelButton) cancelButton.addEventListener('click', () => { pending = null; }, true);
})();