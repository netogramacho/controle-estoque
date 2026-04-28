const API        = 'api/';
const API_VENDAS = 'api/vendas/';

let estoque = [];
let vendas  = [];
let editandoId = null;

async function carregar() {
  const [re, rv] = await Promise.all([fetch(API), fetch(API_VENDAS)]);
  estoque = await re.json();
  vendas  = await rv.json();
  renderTabela();
  renderVendas();
}

// ── Modal produto ──────────────────────────────────────

function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('msg').style.display = 'none';

  if (id) {
    const p = estoque.find(x => x.id === id);
    document.getElementById('modal-titulo').textContent = 'Editar produto';
    document.getElementById('nome').value       = p.nome;
    document.getElementById('categoria').value  = p.categoria || '';
    document.getElementById('tamanho').value    = p.tamanho || '';
    document.getElementById('quantidade').value = p.quantidade;
  } else {
    document.getElementById('modal-titulo').textContent = 'Novo produto';
    document.getElementById('nome').value       = '';
    document.getElementById('categoria').value  = '';
    document.getElementById('tamanho').value    = '';
    document.getElementById('quantidade').value = '';
  }

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('nome').focus();
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  editandoId = null;
}

function fecharModalOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) fecharModal();
}

// ── Estoque ────────────────────────────────────────────

function renderTabela() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const tbody = document.getElementById('tbody');
  const grid  = document.getElementById('produtos-grid');
  const empty = document.getElementById('empty');
  const tfoot = document.getElementById('tfoot-estoque');

  const filtrado = busca
    ? estoque.filter(p =>
        p.nome.toLowerCase().includes(busca) ||
        (p.categoria || '').toLowerCase().includes(busca) ||
        (p.tamanho || '').toLowerCase().includes(busca))
    : estoque;

  document.getElementById('total-info').textContent =
    `${filtrado.length} produto${filtrado.length !== 1 ? 's' : ''}`;

  if (!filtrado.length) {
    tbody.innerHTML = '';
    tfoot.innerHTML = '';
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  const badge = p => p.quantidade === 0
    ? `<span class="badge badge-empty">Sem estoque</span>`
    : p.quantidade <= 5
    ? `<span class="badge badge-low">Baixo</span>`
    : `<span class="badge badge-ok">OK</span>`;

  // ── Tabela (desktop) ──────────────────────────────────
  tbody.innerHTML = filtrado.map(p => `<tr>
    <td><strong>${esc(p.nome)}</strong></td>
    <td>${esc(p.categoria || '—')}</td>
    <td>${esc(p.tamanho || '—')}</td>
    <td>${p.quantidade}</td>
    <td>${badge(p)}</td>
    <td class="actions">
      <button class="btn btn-edit" onclick="abrirModal('${p.id}')">Editar</button>
      <button class="btn btn-danger" onclick="remover('${p.id}')">Excluir</button>
    </td>
  </tr>`).join('');

  const totalQtd = filtrado.reduce((s, p) => s + p.quantidade, 0);
  tfoot.innerHTML = `<tr class="tfoot-total">
    <td colspan="3"><strong>Total</strong></td>
    <td><strong>${totalQtd}</strong></td>
    <td colspan="2"></td>
  </tr>`;

  // ── Cards (mobile) ────────────────────────────────────
  grid.innerHTML = filtrado.map(p => `<div class="produto-card">
    <div class="produto-card-topo">
      <div class="produto-nome-wrap">
        <strong class="produto-nome">${esc(p.nome)}</strong>
        ${p.tamanho ? `<span class="produto-tamanho">${esc(p.tamanho)}</span>` : ''}
      </div>
      ${badge(p)}
    </div>
    <div class="produto-card-body">
      <div class="produto-campo">
        <span class="campo-label">Categoria</span>
        <span class="campo-valor">${esc(p.categoria || '—')}</span>
      </div>
      <div class="produto-campo">
        <span class="campo-label">Quantidade</span>
        <span class="campo-valor"><strong>${p.quantidade}</strong></span>
      </div>
    </div>
    <div class="produto-card-footer">
      <button class="btn btn-edit" onclick="abrirModal('${p.id}')">Editar</button>
      <button class="btn btn-danger" onclick="remover('${p.id}')">Excluir</button>
    </div>
  </div>`).join('');
}

async function salvar() {
  const nome      = document.getElementById('nome').value.trim();
  const categoria = document.getElementById('categoria').value.trim();
  const tamanho   = document.getElementById('tamanho').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value) || 0;

  if (!nome) { mostrarMsg('msg', 'Informe o nome do produto.', false); return; }

  const payload = { nome, categoria, tamanho, quantidade };
  let metodo = 'POST';
  if (editandoId) { payload.id = editandoId; metodo = 'PUT'; }

  const r = await fetch(API, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json();

  if (!r.ok) { mostrarMsg('msg', data.erro || 'Erro ao salvar.', false); return; }

  fecharModal();
  await carregar();
}

async function remover(id) {
  if (!confirm('Excluir este produto?')) return;
  const r = await fetch(API, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (r.ok) await carregar();
}

// ── Modal venda ────────────────────────────────────────

function abrirModalVenda() {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('venda-data').value       = hoje;
  document.getElementById('venda-nome').value       = '';
  document.getElementById('venda-descricao').value  = '';
  document.getElementById('venda-pago').checked     = false;
  document.getElementById('venda-itens').innerHTML = '';
  document.getElementById('msg-venda').style.display = 'none';
  calcularTotal();
  adicionarItem();
  document.getElementById('modal-venda-overlay').classList.add('open');
}

function fecharModalVenda() {
  document.getElementById('modal-venda-overlay').classList.remove('open');
}

function fecharModalVendaOverlay(e) {
  if (e.target === document.getElementById('modal-venda-overlay')) fecharModalVenda();
}

function adicionarItem() {
  const container = document.getElementById('venda-itens');
  const div = document.createElement('div');
  div.className = 'item-linha';
  div.innerHTML = `
    <div class="ac-wrap">
      <input class="item-produto-txt" type="text" placeholder="Buscar produto..." autocomplete="off"
             oninput="acFiltrar(this)" onfocus="acFiltrar(this)">
      <input class="item-produto-id" type="hidden">
      <div class="ac-dropdown"></div>
    </div>
    <input class="item-qtd" type="tel" inputmode="numeric" pattern="[0-9]*" value="1" placeholder="Qtd"
           oninput="this.value=this.value.replace(/[^0-9]/g,'');calcularTotal()">
    <input class="item-preco" type="tel" inputmode="decimal" pattern="[0-9]*[,.]?[0-9]{0,2}" placeholder="Preço"
           oninput="this.value=this.value.replace(/[^0-9,.]/g,'');calcularTotal()">
    <span class="item-sub">—</span>
    <button class="btn-remove-item" onclick="this.closest('.item-linha').remove();calcularTotal()" title="Remover">&times;</button>
  `;
  container.appendChild(div);
}

function acFiltrar(input) {
  const termo = input.value.toLowerCase();
  const dropdown = input.closest('.ac-wrap').querySelector('.ac-dropdown');

  const resultados = estoque
    .filter(p => p.quantidade > 0)
    .filter(p => !termo ||
      p.nome.toLowerCase().includes(termo) ||
      (p.categoria || '').toLowerCase().includes(termo) ||
      (p.tamanho || '').toLowerCase().includes(termo));

  if (!resultados.length) { dropdown.innerHTML = ''; return; }

  dropdown.innerHTML = resultados.map(p => {
    const label = [p.nome, p.tamanho].filter(Boolean).join(' · ');
    return `<div class="ac-item" data-id="${p.id}" data-preco="${p.preco}" data-label="${esc(label)}"
                 onmousedown="acSelecionar(this)">
              <span class="ac-nome">${esc(label)}</span>
              <span class="ac-estoque">${p.quantidade} em estoque</span>
            </div>`;
  }).join('');
}

function acSelecionar(item) {
  const wrap   = item.closest('.ac-wrap');
  const linha  = wrap.closest('.item-linha');
  wrap.querySelector('.item-produto-txt').value = item.dataset.label;
  wrap.querySelector('.item-produto-id').value  = item.dataset.id;
  wrap.querySelector('.ac-dropdown').innerHTML  = '';
  const preco = parseFloat(item.dataset.preco || 0);
  linha.querySelector('.item-preco').value = preco > 0 ? String(preco).replace('.', ',') : '';
  calcularTotal();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.ac-wrap'))
    document.querySelectorAll('.ac-dropdown').forEach(d => d.innerHTML = '');
});

function calcularTotal() {
  let total = 0;
  document.querySelectorAll('.item-linha').forEach(linha => {
    const qtd   = parseInt(linha.querySelector('.item-qtd').value) || 0;
    const preco = parseFloat(linha.querySelector('.item-preco').value.replace(',', '.')) || 0;
    const sub   = qtd * preco;
    total += sub;
    linha.querySelector('.item-sub').textContent = sub > 0 ? 'R$ ' + sub.toFixed(2).replace('.', ',') : '—';
  });
  document.getElementById('venda-total').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

async function salvarVenda() {
  const data      = document.getElementById('venda-data').value;
  const nome      = document.getElementById('venda-nome').value.trim();
  const descricao = document.getElementById('venda-descricao').value.trim();
  const pago      = document.getElementById('venda-pago').checked;

  if (!data) { mostrarMsg('msg-venda', 'Informe a data.', false); return; }

  const itens = [];
  document.querySelectorAll('.item-linha').forEach(linha => {
    const produto_id     = linha.querySelector('.item-produto-id').value;
    const quantidade     = parseInt(linha.querySelector('.item-qtd').value) || 0;
    const preco_unitario = linha.querySelector('.item-preco').value;
    if (produto_id && quantidade > 0) itens.push({ produto_id, quantidade, preco_unitario });
  });

  if (!itens.length) { mostrarMsg('msg-venda', 'Adicione ao menos um item.', false); return; }

  const r = await fetch(API_VENDAS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, nome, descricao, pago, itens })
  });
  const result = await r.json();

  if (!r.ok) { mostrarMsg('msg-venda', result.erro || 'Erro ao registrar venda.', false); return; }

  fecharModalVenda();
  await carregar();
}

// ── Vendas (tabela) ────────────────────────────────────

function renderVendas() {
  const tbody = document.getElementById('tbody-vendas');
  const grid  = document.getElementById('vendas-grid');
  const empty = document.getElementById('empty-vendas');

  if (!vendas.length) {
    tbody.innerHTML = '';
    grid.innerHTML  = '';
    empty.style.display = '';
    document.getElementById('vendas-info').textContent = '';
    return;
  }
  empty.style.display = 'none';

  const totalGeral = vendas.reduce((s, v) => s + (v.total || 0), 0);
  document.getElementById('vendas-info').textContent =
    `${vendas.length} venda${vendas.length !== 1 ? 's' : ''} · Total: R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

  const rows = vendas.map(v => {
    const itens = v.itens || (v.produto_nome
      ? [{ produto_nome: v.produto_nome, tamanho: '', quantidade: v.quantidade, preco_unitario: v.preco_unitario, subtotal: v.total }]
      : []);

    const pagoBadge = v.pago === true
      ? `<span class="badge badge-ok">Pago</span>`
      : v.pago === false
      ? `<span class="badge badge-empty">Pendente</span>`
      : `<span class="badge">—</span>`;

    const dataFmt = v.data
      ? (v.data.includes(' ') ? formatarData(v.data) : new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR'))
      : '—';

    const descricaoHtml = v.descricao
      ? `<div class="detalhe-descricao">${esc(v.descricao)}</div>`
      : '';

    const itensDetalhe = itens.map(i => `
      <div class="detalhe-item">
        <span class="di-nome">${esc(i.produto_nome)}${i.tamanho ? ' <em>' + esc(i.tamanho) + '</em>' : ''}</span>
        <span class="di-qtd">${i.quantidade}×</span>
        <span class="di-preco">R$ ${(i.preco_unitario || 0).toFixed(2).replace('.', ',')}</span>
        <span class="di-sub">= R$ ${(i.subtotal || 0).toFixed(2).replace('.', ',')}</span>
      </div>`).join('');

    const btnPagar = v.pago !== true
      ? `<button class="btn btn-success" style="padding:4px 10px;font-size:.78rem"
               onclick="event.stopPropagation();pagarVenda('${v.id}')">Pagar</button>`
      : '';

    return { v, itens, pagoBadge, dataFmt, descricaoHtml, itensDetalhe, btnPagar };
  });

  // ── Tabela (desktop) ──────────────────────────────────
  tbody.innerHTML = rows.map(({ v, itens, pagoBadge, dataFmt, itensDetalhe, descricaoHtml, btnPagar }) => `
    <tr class="venda-row" onclick="toggleDetalhe('${v.id}')">
      <td>${dataFmt}</td>
      <td>${esc(v.nome || '—')}</td>
      <td>${itens.length} item${itens.length !== 1 ? 'ns' : ''}</td>
      <td><strong>R$ ${(v.total || 0).toFixed(2).replace('.', ',')}</strong></td>
      <td>${pagoBadge}</td>
      <td class="actions">${btnPagar}<button class="btn btn-danger" style="padding:4px 10px;font-size:.78rem"
             onclick="event.stopPropagation();excluirVenda('${v.id}')">Excluir</button></td>
      <td><span class="chevron" id="chv-${v.id}">▼</span></td>
    </tr>
    <tr class="detalhe-row" id="det-${v.id}">
      <td colspan="7"><div class="detalhe-content">${itensDetalhe}${descricaoHtml}</div></td>
    </tr>`).join('');

  // ── Cards (mobile) ────────────────────────────────────
  grid.innerHTML = rows.map(({ v, itens, pagoBadge, dataFmt, itensDetalhe, descricaoHtml, btnPagar }) => `
    <div class="venda-linha" onclick="toggleVendaCard('${v.id}')">
      <div class="venda-linha-row">
        <span class="venda-ln-nome">${esc(v.nome || '—')}</span>
        <span class="venda-ln-qtd">${itens.length} it.</span>
        <strong class="venda-ln-total">R$ ${(v.total || 0).toFixed(2).replace('.', ',')}</strong>
        ${pagoBadge}
        <span class="produto-chevron" id="vchv-${v.id}">▼</span>
      </div>
      <div class="venda-card-detalhe" id="vdet-${v.id}">
        <div class="venda-det-data"><span class="campo-label">Data</span> ${dataFmt}</div>
        ${itensDetalhe}
        ${descricaoHtml}
        <div class="venda-det-acoes" onclick="event.stopPropagation()">
          ${btnPagar}
          <button class="btn btn-danger" style="padding:4px 10px;font-size:.78rem"
                  onclick="excluirVenda('${v.id}')">Excluir</button>
        </div>
      </div>
    </div>`).join('');
}

function toggleVendaCard(id) {
  const det = document.getElementById('vdet-' + id);
  const chv = document.getElementById('vchv-' + id);
  const aberto = det.classList.toggle('open');
  chv.textContent = aberto ? '▲' : '▼';
}

let pagarVendaId = null;

function pagarVenda(id) {
  const v = vendas.find(x => x.id === id);
  if (!v) return;
  pagarVendaId = id;
  document.getElementById('pagar-cliente').textContent = v.nome || 'sem nome';
  document.getElementById('pagar-total').textContent   = 'R$ ' + (v.total || 0).toFixed(2).replace('.', ',');
  document.getElementById('modal-pagar-overlay').classList.add('open');
}

function fecharModalPagar() {
  document.getElementById('modal-pagar-overlay').classList.remove('open');
  pagarVendaId = null;
}

function fecharModalPagarOverlay(e) {
  if (e.target === document.getElementById('modal-pagar-overlay')) fecharModalPagar();
}

async function confirmarPagamento() {
  if (!pagarVendaId) return;
  const r = await fetch(API_VENDAS, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: pagarVendaId })
  });
  fecharModalPagar();
  if (r.ok) await carregar();
}

async function excluirVenda(id) {
  if (!confirm('Excluir esta venda? O estoque dos itens será restaurado.')) return;
  const r = await fetch(API_VENDAS, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (r.ok) await carregar();
}

function toggleDetalhe(id) {
  const row = document.getElementById('det-' + id);
  const chv = document.getElementById('chv-' + id);
  const aberto = row.classList.toggle('open');
  chv.textContent = aberto ? '▲' : '▼';
}

// ── Utilitários ────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { fecharModal(); fecharModalVenda(); fecharModalPagar(); }
});

function mostrarMsg(id, texto, ok) {
  const el = document.getElementById(id);
  el.textContent = texto;
  el.className = ok ? 'msg-ok' : 'msg-err';
  el.style.display = '';
  setTimeout(() => el.style.display = 'none', 3500);
}

function formatarData(str) {
  const d = new Date(str.replace(' ', 'T'));
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

carregar();
