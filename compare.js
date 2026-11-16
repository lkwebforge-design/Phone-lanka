(() => {
  const selected = new Map();
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = value => 'Rs. ' + Number(value || 0).toLocaleString('en-LK');

  const style = document.createElement('style');
  style.textContent = '.pl-compare-btn{width:100%;margin-top:8px;border:1px solid #b9d3ed;border-radius:11px;padding:10px 12px;background:#f4f9ff;color:#174b83;font-size:12px;font-weight:850}.pl-compare-btn.selected{background:#e0f2fe;border-color:#68b5e8;color:#075985}.pl-compare-tray{position:fixed;z-index:55;left:50%;bottom:14px;transform:translateX(-50%);width:min(720px,calc(100% - 24px));display:none;align-items:center;gap:12px;padding:12px 14px;border:1px solid #ffffffb8;border-radius:18px;background:#071a31ed;color:#fff;box-shadow:0 18px 50px #07142655;backdrop-filter:blur(18px)}.pl-compare-tray.show{display:flex}.pl-compare-tray-copy{flex:1;min-width:0}.pl-compare-tray-copy b{display:block;font-size:13px}.pl-compare-tray-copy small{color:#b8cce2;font-size:11px}.pl-compare-open,.pl-compare-clear{border:0;border-radius:10px;padding:10px 13px;font-weight:850}.pl-compare-open{background:#67c8ff;color:#071426}.pl-compare-clear{background:#ffffff18;color:#fff}.pl-compare-table-wrap{overflow-x:auto;margin-top:14px}.pl-compare-table{width:100%;border-collapse:collapse;min-width:470px;font-size:13px}.pl-compare-table th,.pl-compare-table td{padding:12px 10px;border-bottom:1px solid #dce4ef;text-align:left;vertical-align:top}.pl-compare-table th{background:#f0f6fc;color:#10243f}.pl-compare-table td:first-child{font-weight:800;color:#536783;white-space:nowrap}.pl-compare-table img{width:70px;height:76px;object-fit:cover;border-radius:10px;background:#e8f1fb}.pl-compare-remove{border:0;background:#fee2e2;color:#991b1b;border-radius:8px;padding:7px 9px;font-size:11px;font-weight:800}@media(max-width:520px){.pl-compare-tray{bottom:8px;gap:7px;padding:9px}.pl-compare-open,.pl-compare-clear{padding:9px;font-size:11px}.pl-compare-tray-copy b{font-size:12px}.pl-compare-tray-copy small{font-size:10px}}';
  document.head.append(style);

  const tray = document.createElement('div');
  tray.className = 'pl-compare-tray';
  tray.innerHTML = '<div class="pl-compare-tray-copy"><b>Compare phones <span class="pl-compare-count">0</span>/3</b><small class="pl-compare-hint">Choose up to three phones</small></div><button class="pl-compare-clear" type="button">Clear</button><button class="pl-compare-open" type="button">Compare</button>';
  document.body.append(tray);

  function updateTray() {
    const count = selected.size;
    tray.classList.toggle('show', count > 0);
    tray.querySelector('.pl-compare-count').textContent = count;
    tray.querySelector('.pl-compare-hint').textContent = count < 2 ? 'Select at least 2 phones to compare' : 'Ready to compare side by side';
    tray.querySelector('.pl-compare-open').disabled = count < 2;
    tray.querySelector('.pl-compare-open').style.opacity = count < 2 ? '.5' : '1';
    document.querySelectorAll('.pl-compare-btn').forEach(button => {
      const active = selected.has(button.dataset.phoneId);
      button.classList.toggle('selected', active);
      button.textContent = active ? '✓ Added to compare' : '＋ Compare phone';
    });
  }

  function removePhone(id) { selected.delete(id); updateTray(); }

  function openComparison() {
    if (selected.size < 2) return;
    const phones = [...selected.values()];
    const fields = [
      ['Price', p => money(p.price)], ['Brand', p => p.brand], ['Model / details', p => p.model],
      ['Condition', p => p.condition], ['RAM', p => p.ram], ['Storage', p => p.storage],
      ['Colour', p => p.color], ['Warranty', p => p.warranty],
      ['Availability', p => ({available:'Available',reserved:'Reserved',sold:'Sold',not_set:'Not confirmed'}[p.availability] || p.availability)],
      ['Seller', p => p.seller], ['Location', p => [p.area,p.district].filter(Boolean).join(', ') || 'Not specified']
    ];
    const headings = phones.map(p => '<th>' + esc(p.name) + '<div style="margin-top:8px">' + (p.imageUrl ? '<img src="' + esc(p.imageUrl) + '" alt="' + esc(p.name) + '">' : '') + '</div><button class="pl-compare-remove" data-remove="' + esc(p.id) + '" type="button">Remove</button></th>').join('');
    const rows = fields.map(([label, getter]) => '<tr><td>' + esc(label) + '</td>' + phones.map(p => '<td>' + esc(getter(p)) + '</td>').join('') + '</tr>').join('');
    const modal = document.getElementById('modalBack');
    document.getElementById('modalTitle').textContent = 'Compare phones';
    document.getElementById('modalContent').innerHTML = '<p class="pl-muted">Compare the details side by side. “Not specified” means the seller has not provided that information.</p><div class="pl-compare-table-wrap"><table class="pl-compare-table"><thead><tr><th>Details</th>' + headings + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    modal.classList.add('show');
    document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      removePhone(button.dataset.remove);
      if (selected.size < 2) modal.classList.remove('show'); else openComparison();
    }));
  }

  function attachButtons() {
    document.querySelectorAll('.product[data-compare]').forEach(card => {
      if (card.querySelector('.pl-compare-btn')) return;
      const body = card.querySelector('.product-body');
      if (!body) return;
      let phone;
      try { phone = JSON.parse(card.dataset.compare); } catch (error) { console.warn('PhoneLanka compare data invalid', error); return; }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pl-compare-btn';
      button.dataset.phoneId = String(phone.id);
      button.textContent = '＋ Compare phone';
      button.addEventListener('click', () => {
        const id = String(phone.id);
        if (selected.has(id)) { removePhone(id); return; }
        if (selected.size >= 3) {
          tray.querySelector('.pl-compare-hint').textContent = 'Maximum 3 phones. Remove one first.';
          return;
        }
        selected.set(id, phone);
        updateTray();
      });
      body.append(button);
    });
    updateTray();
  }

  tray.querySelector('.pl-compare-clear').addEventListener('click', () => { selected.clear(); updateTray(); });
  tray.querySelector('.pl-compare-open').addEventListener('click', openComparison);
  const observer = new MutationObserver(attachButtons);
  observer.observe(document.body, {childList:true,subtree:true});
  attachButtons();
})();