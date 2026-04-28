<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estoque — Ton Camisas</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<header>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
  <h1>Controle de Estoque — Ton Camisas</h1>
</header>

<main>

  <!-- ── Estoque ─────────────────────────────────────── -->
  <div class="card">
    <div class="toolbar">
      <strong style="font-size:.95rem">Estoque</strong>
      <input id="busca" type="text" placeholder="Buscar produto..." oninput="renderTabela()">
      <span class="total" id="total-info"></span>
      <button class="btn btn-primary" style="margin-left:auto" onclick="abrirModal()">+ Novo produto</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Tamanho</th>
            <th>Qtd</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
        <tfoot id="tfoot-estoque"></tfoot>
      </table>
      <div class="empty-state" id="empty" style="display:none">Nenhum produto cadastrado.</div>
    </div>
  </div>

  <!-- ── Vendas ──────────────────────────────────────── -->
  <div class="card">
    <div class="toolbar">
      <strong style="font-size:.95rem">Vendas</strong>
      <span class="total" id="vendas-info"></span>
      <button class="btn btn-success" style="margin-left:auto" onclick="abrirModalVenda()">+ Nova venda</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Cliente</th>
            <th>Itens</th>
            <th>Total</th>
            <th>Status</th>
            <th>Ações</th>
            <th style="width:36px"></th>
          </tr>
        </thead>
        <tbody id="tbody-vendas"></tbody>
      </table>
      <div class="empty-state" id="empty-vendas" style="display:none">Nenhuma venda registrada.</div>
    </div>
  </div>

</main>

<!-- ── Modal produto ───────────────────────────────────── -->
<div id="modal-overlay" class="modal-overlay" onclick="fecharModalOverlay(event)">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modal-titulo">Novo produto</h2>
      <button class="modal-close" onclick="fecharModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div id="msg"></div>
      <div class="modal-grid">
        <div class="col-span-2">
          <label for="nome">Nome *</label>
          <input id="nome" type="text" placeholder="Ex: Camiseta básica">
        </div>
        <div>
          <label for="categoria">Categoria</label>
          <input id="categoria" type="text" placeholder="Ex: Camisetas">
        </div>
        <div>
          <label for="tamanho">Tamanho</label>
          <input id="tamanho" type="text" placeholder="P, M, G, GG...">
        </div>
        <div>
          <label for="quantidade">Quantidade *</label>
          <input id="quantidade" type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="0"
                 oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-cancel" onclick="fecharModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="salvar()">Salvar</button>
    </div>
  </div>
</div>

<!-- ── Modal venda ─────────────────────────────────────── -->
<div id="modal-venda-overlay" class="modal-overlay" onclick="fecharModalVendaOverlay(event)">
  <div class="modal modal-lg">
    <div class="modal-header">
      <h2>Nova venda</h2>
      <button class="modal-close" onclick="fecharModalVenda()">&times;</button>
    </div>
    <div class="modal-body">
      <div id="msg-venda"></div>
      <div class="modal-grid" style="margin-bottom:20px">
        <div>
          <label for="venda-data">Data *</label>
          <input id="venda-data" type="date">
        </div>
        <div>
          <label for="venda-nome">Cliente / Descrição</label>
          <input id="venda-nome" type="text" placeholder="Ex: João Silva">
        </div>
      </div>

      <div class="itens-header">
        <span>Itens da venda</span>
        <button class="btn btn-primary" style="padding:5px 12px;font-size:.82rem" onclick="adicionarItem()">+ Adicionar item</button>
      </div>
      <div id="venda-itens"></div>

      <div style="margin-top:16px">
        <label for="venda-descricao">Descrição</label>
        <input id="venda-descricao" type="text" placeholder="Observações sobre a venda...">
      </div>

      <div class="venda-resumo">
        <label class="pago-badge-label" for="venda-pago">
          <input id="venda-pago" type="checkbox">
          <span class="pago-badge">
            <span class="pago-off">Pendente</span>
            <span class="pago-on">Pago</span>
          </span>
        </label>
        <div class="venda-total-display">
          Total: <strong id="venda-total">R$ 0,00</strong>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-cancel" onclick="fecharModalVenda()">Cancelar</button>
      <button class="btn btn-success" onclick="salvarVenda()">Registrar venda</button>
    </div>
  </div>
</div>

<!-- ── Modal confirmação pagamento ─────────────────────── -->
<div id="modal-pagar-overlay" class="modal-overlay" onclick="fecharModalPagarOverlay(event)">
  <div class="modal modal-sm">
    <div class="modal-header">
      <h2>Confirmar pagamento</h2>
      <button class="modal-close" onclick="fecharModalPagar()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="color:#444;font-size:.95rem">Marcar a venda de <strong id="pagar-cliente"></strong> no valor de <strong id="pagar-total"></strong> como <span style="color:#15803d;font-weight:600">paga</span>?</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-cancel" onclick="fecharModalPagar()">Cancelar</button>
      <button class="btn btn-success" onclick="confirmarPagamento()">Confirmar</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html>
