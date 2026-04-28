<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$arquivo = __DIR__ . '/../estoque.json';

function lerEstoque($arquivo) {
    if (!file_exists($arquivo)) return [];
    $conteudo = file_get_contents($arquivo);
    return json_decode($conteudo, true) ?? [];
}

function salvarEstoque($arquivo, $dados) {
    file_put_contents($arquivo, json_encode(array_values($dados), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$metodo = $_SERVER['REQUEST_METHOD'];
$estoque = lerEstoque($arquivo);

if ($metodo === 'GET') {
    echo json_encode(array_values($estoque));
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

if ($metodo === 'POST') {
    $novo = [
        'id'         => uniqid(),
        'nome'       => trim($body['nome'] ?? ''),
        'categoria'  => trim($body['categoria'] ?? ''),
        'tamanho'    => trim($body['tamanho'] ?? ''),
        'quantidade' => (int)($body['quantidade'] ?? 0),
        'preco'      => (float)($body['preco'] ?? 0),
    ];
    if ($novo['nome'] === '') { http_response_code(400); echo json_encode(['erro' => 'Nome obrigatório']); exit; }
    $estoque[] = $novo;
    salvarEstoque($arquivo, $estoque);
    echo json_encode($novo);
    exit;
}

if ($metodo === 'PUT') {
    $id = $body['id'] ?? '';
    foreach ($estoque as &$item) {
        if ($item['id'] === $id) {
            $item['nome']       = trim($body['nome'] ?? $item['nome']);
            $item['categoria']  = trim($body['categoria'] ?? $item['categoria']);
            $item['tamanho']    = trim($body['tamanho'] ?? ($item['tamanho'] ?? ''));
            $item['quantidade'] = (int)($body['quantidade'] ?? $item['quantidade']);
            $item['preco']      = (float)($body['preco'] ?? $item['preco']);
            salvarEstoque($arquivo, $estoque);
            echo json_encode($item);
            exit;
        }
    }
    http_response_code(404); echo json_encode(['erro' => 'Não encontrado']);
    exit;
}

if ($metodo === 'DELETE') {
    $id = $body['id'] ?? '';
    $novo = array_filter($estoque, fn($i) => $i['id'] !== $id);
    if (count($novo) === count($estoque)) { http_response_code(404); echo json_encode(['erro' => 'Não encontrado']); exit; }
    salvarEstoque($arquivo, $novo);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
