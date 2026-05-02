<?php
date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$arqVendas  = __DIR__ . '/../../vendas.json';
$arqEstoque = __DIR__ . '/../../estoque.json';

function lerJson($path) {
    if (!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?? [];
}

function salvarJson($path, $dados) {
    file_put_contents($path, json_encode(array_values($dados), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $vendas = lerJson($arqVendas);
    echo json_encode(array_reverse(array_values($vendas)));
    exit;
}

if ($metodo === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $nome      = trim($body['nome'] ?? '');
    $data      = $body['data'] ?? date('Y-m-d');
    $pago      = (bool)($body['pago'] ?? false);
    $descricao = trim($body['descricao'] ?? '');
    $itens     = $body['itens'] ?? [];

    if (empty($itens)) {
        http_response_code(400);
        echo json_encode(['erro' => 'Adicione ao menos um item']);
        exit;
    }

    $estoque = lerJson($arqEstoque);
    $itensProcessados = [];
    $total = 0;

    foreach ($itens as $item) {
        $produto_id = $item['produto_id'] ?? '';
        $quantidade = (int)($item['quantidade'] ?? 0);
        $preco_unit = (float)(str_replace(',', '.', $item['preco_unitario'] ?? 0));

        if (!$produto_id || $quantidade <= 0) continue;

        $encontrado = false;
        foreach ($estoque as &$p) {
            if ($p['id'] === $produto_id) {
                if ($p['quantidade'] < $quantidade) {
                    http_response_code(400);
                    echo json_encode(['erro' => "Estoque insuficiente para \"{$p['nome']}\" (disponível: {$p['quantidade']})"]);
                    exit;
                }
                $p['quantidade'] -= $quantidade;
                $subtotal = round($preco_unit * $quantidade, 2);
                $itensProcessados[] = [
                    'produto_id'        => $produto_id,
                    'produto_nome'      => $p['nome'],
                    'produto_categoria' => $p['categoria'] ?? '',
                    'tamanho'           => $p['tamanho'] ?? '',
                    'quantidade'        => $quantidade,
                    'preco_unitario'    => $preco_unit,
                    'subtotal'          => $subtotal,
                ];
                $total += $subtotal;
                $encontrado = true;
                break;
            }
        }
        unset($p);

        if (!$encontrado) {
            http_response_code(404);
            echo json_encode(['erro' => 'Produto não encontrado']);
            exit;
        }
    }

    if (empty($itensProcessados)) {
        http_response_code(400);
        echo json_encode(['erro' => 'Nenhum item válido']);
        exit;
    }

    salvarJson($arqEstoque, $estoque);

    $venda = [
        'id'        => uniqid(),
        'data'      => $data,
        'nome'      => $nome,
        'descricao' => $descricao,
        'pago'      => $pago,
        'itens'     => $itensProcessados,
        'total'     => round($total, 2),
        'criado'    => date('Y-m-d H:i:s'),
    ];

    $vendas = lerJson($arqVendas);
    $vendas[] = $venda;
    salvarJson($arqVendas, $vendas);

    echo json_encode($venda);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$id   = $body['id'] ?? '';

if ($metodo === 'PUT') {
    $vendas = lerJson($arqVendas);
    foreach ($vendas as &$v) {
        if ($v['id'] === $id) {
            $v['pago'] = true;
            salvarJson($arqVendas, $vendas);
            echo json_encode($v);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(['erro' => 'Venda não encontrada']);
    exit;
}

if ($metodo === 'DELETE') {
    $vendas = lerJson($arqVendas);
    $venda  = null;
    foreach ($vendas as $v) { if ($v['id'] === $id) { $venda = $v; break; } }

    if (!$venda) { http_response_code(404); echo json_encode(['erro' => 'Venda não encontrada']); exit; }

    // Devolve estoque dos itens da venda
    if (!empty($venda['itens'])) {
        $estoque = lerJson($arqEstoque);
        foreach ($venda['itens'] as $item) {
            foreach ($estoque as &$p) {
                if ($p['id'] === $item['produto_id']) {
                    $p['quantidade'] += $item['quantidade'];
                    break;
                }
            }
            unset($p);
        }
        salvarJson($arqEstoque, $estoque);
    }

    $novas = array_filter($vendas, fn($v) => $v['id'] !== $id);
    salvarJson($arqVendas, $novas);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
