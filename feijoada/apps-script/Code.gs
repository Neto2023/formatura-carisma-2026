/**
 * Feijoada Solidária · Carisma Intensivo 2026.
 * Script vinculado à planilha de encomendas: recebe os pedidos da seção Feijoada do save-the-date/index.html (doPost),
 * guarda os comprovantes de Pix numa pasta do Drive e monta o resumo de vendas e a lista de retirada.
 * Passo a passo de implantação em feijoada/apps-script/LEIA-ME.md.
 */

// Encerramento das encomendas, no horário de Belém (UTC-3). Manter igual ao PRAZO do save-the-date/index.html.
var PRAZO = new Date('2026-11-22T15:00:00-03:00');
var FUSO = 'America/Belem';
var VALOR = 25;          // preço da porção, em reais
var MAX_QTD = 30;        // teto de porções por pedido, contra erro de digitação
var FORMAS = ['Retirar no local', 'Comer no local'];   // manter igual a FORMAS do save-the-date/index.html
var ABA_PEDIDOS = 'Pedidos';
var ABA_RESUMO = 'Resumo';
var PASTA = 'Comprovantes Feijoada Solidária 2026';
var CABECALHO = ['Data e hora', 'Pedido', 'Nome', 'WhatsApp', 'Porções', 'Como vai receber', 'Observação',
  'Valor', 'Pago', 'Comprovante', 'Entregue', 'Código de acesso'];
// Colunas (base 1)
var C = {data: 1, pedido: 2, nome: 3, zap: 4, qtd: 5, forma: 6, obs: 7, valor: 8, pago: 9, comp: 10, entregue: 11, token: 12};
var MAX_CAMPO = 200;
var MAX_ARQUIVO = 6 * 1024 * 1024;   // 6 MB por comprovante
var TIPOS = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf'};

// ---------------------------------------------------------------- web app

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (limpar(d.site)) return responder({ok: true});   // campo anti-robô preenchido: descarta sem avisar
    if (d.acao === 'comprovante') return responder(receberComprovante(d));
    return responder(receberPedido(d));
  } catch (err) {
    return responder({ok: false, erro: String((err && err.message) || err)});
  }
}

// Abrir a URL do app da web no navegador mostra se as vendas estão abertas e quantas porções já saíram.
function doGet() {
  var t = totais();
  return responder({
    ok: true,
    vendas: new Date() > PRAZO ? 'encerradas' : 'abertas',
    prazo: Utilities.formatDate(PRAZO, FUSO, "dd/MM/yyyy 'às' HH:mm"),
    pedidos: t.pedidos,
    porcoes: t.porcoes
  });
}

function receberPedido(d) {
  if (new Date() > PRAZO) return {ok: false, erro: 'encerrada'};
  var v = {
    nome: limpar(d.nome), zap: limpar(d.whatsapp).replace(/\D/g, ''),
    qtd: parseInt(d.quantidade, 10), forma: limpar(d.forma), obs: limpar(d.obs)
  };
  var faltas = [];
  if (!v.nome) faltas.push('nome');
  if (v.zap.length < 10 || v.zap.length > 13) faltas.push('WhatsApp com DDD');
  if (!(v.qtd >= 1 && v.qtd <= MAX_QTD)) faltas.push('quantidade de 1 a ' + MAX_QTD);
  if (FORMAS.indexOf(v.forma) < 0) faltas.push('como vai receber');
  if (faltas.length) return {ok: false, erro: 'Confira: ' + faltas.join(', ') + '.'};

  var trava = LockService.getScriptLock();
  trava.waitLock(15000);
  try {
    var props = PropertiesService.getScriptProperties();
    var n = Number(props.getProperty('ULTIMO_PEDIDO') || 0) + 1;
    props.setProperty('ULTIMO_PEDIDO', String(n));
    var codigo = 'F' + ('00' + n).slice(-3);
    var token = Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    var aba = abaPedidos();
    aba.appendRow([new Date(), codigo, texto(v.nome), texto(v.zap), v.qtd, v.forma, texto(v.obs),
      v.qtd * VALOR, false, '', false, token]);
    var linha = aba.getLastRow();
    aba.getRange(linha, C.pago).insertCheckboxes();
    aba.getRange(linha, C.entregue).insertCheckboxes();
    return {ok: true, pedido: codigo, valor: v.qtd * VALOR, token: token};
  } finally {
    trava.releaseLock();
  }
}

// Salva o comprovante na pasta do Drive e põe o link na linha do pedido. Não marca como pago:
// quem confere o Pix no extrato e marca "Pago" é a comissão.
function receberComprovante(d) {
  var codigo = limpar(d.pedido).toUpperCase(), token = limpar(d.token);
  var tipo = limpar(d.tipo), ext = TIPOS[tipo];
  if (!codigo || !token) return {ok: false, erro: 'Pedido não informado.'};
  if (!ext) return {ok: false, erro: 'Envie foto (JPG ou PNG) ou PDF do comprovante.'};
  var bytes = Utilities.base64Decode(String(d.dados || ''));
  if (!bytes.length) return {ok: false, erro: 'Arquivo vazio.'};
  if (bytes.length > MAX_ARQUIVO) return {ok: false, erro: 'Arquivo grande demais (máximo de 6 MB).'};

  var aba = abaPedidos(), linha = acharPedido(aba, codigo);
  if (!linha) return {ok: false, erro: 'Pedido ' + codigo + ' não encontrado.'};
  if (String(aba.getRange(linha, C.token).getValue()) !== token) return {ok: false, erro: 'Código de acesso não confere.'};

  var nome = String(aba.getRange(linha, C.nome).getValue()).replace(/^'/, '');
  var arq = pasta().createFile(Utilities.newBlob(bytes, tipo, codigo + ' - ' + nome + '.' + ext));
  var cel = aba.getRange(linha, C.comp);
  var anterior = String(cel.getValue());
  cel.setValue(anterior ? anterior + '\n' + arq.getUrl() : arq.getUrl());
  return {ok: true};
}

function acharPedido(aba, codigo) {
  var n = aba.getLastRow();
  if (n < 2) return 0;
  var cods = aba.getRange(2, C.pedido, n - 1, 1).getValues();
  for (var i = cods.length - 1; i >= 0; i--) if (String(cods[i][0]).toUpperCase() === codigo) return i + 2;
  return 0;
}

function totais() {
  var aba = abaPedidos(), n = aba.getLastRow(), t = {pedidos: 0, porcoes: 0};
  if (n < 2) return t;
  aba.getRange(2, C.qtd, n - 1, 1).getValues().forEach(function (l) {
    var q = Number(l[0]) || 0;
    if (q > 0) { t.pedidos++; t.porcoes += q; }
  });
  return t;
}

// ---------------------------------------------------------------- planilha

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Feijoada')
    .addItem('Resumo para o WhatsApp', 'mostrarResumo')
    .addItem('Lista de retirada (domingo)', 'mostrarLista')
    .addSeparator()
    .addItem('Confirmar pagamento ao cliente (linha selecionada)', 'confirmarSelecionado')
    .addToUi();
}

// Rodar uma vez pelo editor: cria as abas, a pasta dos comprovantes e pede a autorização da conta.
function prepararPlanilha() {
  abaPedidos();
  pasta();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var r = ss.getSheetByName(ABA_RESUMO) || ss.insertSheet(ABA_RESUMO);
  r.clear();
  var P = "'" + ABA_PEDIDOS + "'!";
  var col = function (c) { return P + String.fromCharCode(64 + c) + '2:' + String.fromCharCode(64 + c); };
  var linhas = [
    ['FEIJOADA SOLIDÁRIA · CARISMA 2026', ''],
    ['Pedidos', '=COUNTA(' + col(C.pedido) + ')'],
    ['Porções encomendadas', '=SUM(' + col(C.qtd) + ')'],
    ['Valor previsto', '=SUM(' + col(C.valor) + ')'],
    ['Pedidos pagos (conferidos)', '=COUNTIF(' + col(C.pago) + ',TRUE)'],
    ['Porções pagas', '=SUMIF(' + col(C.pago) + ',TRUE,' + col(C.qtd) + ')'],
    ['Valor recebido', '=SUMIF(' + col(C.pago) + ',TRUE,' + col(C.valor) + ')'],
    ['A receber', '=B4-B7'],
    ['Com comprovante, falta conferir', '=COUNTIFS(' + col(C.comp) + ',"<>",' + col(C.pago) + ',FALSE)'],
    ['Porções já entregues', '=SUMIF(' + col(C.entregue) + ',TRUE,' + col(C.qtd) + ')']
  ];
  FORMAS.forEach(function (f) { linhas.push(['Porções: ' + f, '=SUMIF(' + col(C.forma) + ',"' + f + '",' + col(C.qtd) + ')']); });
  r.getRange(1, 1, linhas.length, 2).setValues(linhas);
  r.getRange('A1').setFontWeight('bold');
  r.getRange('B4').setNumberFormat('"R$" #,##0.00');
  r.getRange('B7:B8').setNumberFormat('"R$" #,##0.00');
  r.setColumnWidth(1, 280);
  r.setColumnWidth(2, 140);
}

// Rodar pelo editor depois de apagar os pedidos de teste: o próximo pedido volta a ser F001.
function zerarNumeracao() {
  PropertiesService.getScriptProperties().deleteProperty('ULTIMO_PEDIDO');
}

function mostrarResumo() {
  var lista = lerPedidos();
  var t = {p: 0, q: 0, v: 0, qp: 0, vp: 0, forma: {}};
  lista.forEach(function (x) {
    t.p++; t.q += x.qtd; t.v += x.valor;
    if (x.pago) { t.qp += x.qtd; t.vp += x.valor; }
    t.forma[x.forma] = (t.forma[x.forma] || 0) + x.qtd;
  });
  var txt = 'FEIJOADA SOLIDÁRIA · CARISMA 2026\nParcial de ' + Utilities.formatDate(new Date(), FUSO, "dd/MM 'às' HH:mm") + '\n\n'
    + 'Pedidos: ' + t.p + '\nPorções encomendadas: ' + t.q + '\n'
    + Object.keys(t.forma).map(function (f) { return '  ' + f + ': ' + t.forma[f]; }).join('\n') + '\n'
    + 'Porções pagas: ' + t.qp + '\nValor recebido: ' + brl(t.vp) + ' de ' + brl(t.v) + '\n\nGratidão! Comissão de Formatura.';
  dialogo(txt, 'Resumo de vendas', 'Cole no grupo da comissão no WhatsApp.');
}

// Lista em ordem alfabética para conferir a retirada no domingo. Também dá para imprimir a aba Pedidos.
function mostrarLista() {
  var lista = lerPedidos().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
  var txt = 'LISTA DE RETIRADA · FEIJOADA 22/11\n\n' + lista.map(function (x) {
    return (x.entregue ? '[ok] ' : '[  ] ') + x.nome + ' · ' + x.pedido + ' · ' + x.qtd + (x.qtd === 1 ? ' porção' : ' porções')
      + ' · ' + x.forma.toLowerCase() + (x.pago ? '' : ' · CONFERIR PAGAMENTO') + (x.obs ? ' · obs.: ' + x.obs : '');
  }).join('\n') + '\n\nTotal: ' + lista.reduce(function (a, x) { return a + x.qtd; }, 0) + ' porções em ' + lista.length + ' pedidos.';
  dialogo(txt, 'Lista de retirada', 'Marque a coluna "Entregue" na aba Pedidos conforme cada pessoa retira.');
}

// Abre o WhatsApp do cliente com a mensagem de confirmação do pedido da linha selecionada.
function confirmarSelecionado() {
  var ui = SpreadsheetApp.getUi(), aba = SpreadsheetApp.getActiveSheet();
  var linha = aba.getActiveRange() ? aba.getActiveRange().getRow() : 0;
  if (aba.getName() !== ABA_PEDIDOS || linha < 2) { ui.alert('Clique numa linha de pedido da aba ' + ABA_PEDIDOS + ' e tente de novo.'); return; }
  var l = aba.getRange(linha, 1, 1, CABECALHO.length).getValues()[0];
  var nome = String(l[C.nome - 1]).replace(/^'/, ''), zap = String(l[C.zap - 1]).replace(/\D/g, '');
  if (zap.length <= 11) zap = '55' + zap;
  var q = Number(l[C.qtd - 1]);
  var msg = 'Olá, ' + nome.split(' ')[0] + '! Recebemos o seu Pix da Feijoada Solidária do Carisma. '
    + 'Pedido ' + l[C.pedido - 1] + ': ' + q + (q === 1 ? ' porção' : ' porções') + ' (' + String(l[C.forma - 1]).toLowerCase() + '), '
    + 'no almoço de domingo, 22/11. Basta dizer o seu nome ou o número do pedido. Obrigado por apoiar a nossa formatura!';
  var url = 'https://wa.me/' + zap + '?text=' + encodeURIComponent(msg);
  var html = '<style>body{font-family:Arial,sans-serif}a{display:inline-block;margin-top:12px;padding:10px 16px;background:#1E7E34;color:#fff;border-radius:6px;font-weight:bold;text-decoration:none}p{font-size:13px;color:#333}</style>'
    + '<p>' + escaparHtml(msg) + '</p><a href="' + url + '" target="_blank" onclick="google.script.host.close()">Abrir conversa com ' + escaparHtml(nome) + '</a>'
    + '<p style="color:#777">Lembre de marcar a coluna "Pago" depois de conferir o Pix no extrato.</p>';
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(460).setHeight(260), 'Confirmar pagamento');
}

function lerPedidos() {
  var aba = abaPedidos(), n = aba.getLastRow();
  if (n < 2) return [];
  return aba.getRange(2, 1, n - 1, CABECALHO.length).getValues().map(function (l) {
    return {
      pedido: String(l[C.pedido - 1]), nome: String(l[C.nome - 1]).replace(/^'/, ''), qtd: Number(l[C.qtd - 1]) || 0,
      forma: String(l[C.forma - 1] || 'não informado'), obs: String(l[C.obs - 1]).replace(/^'/, ''),
      valor: Number(l[C.valor - 1]) || 0, pago: l[C.pago - 1] === true, entregue: l[C.entregue - 1] === true
    };
  }).filter(function (x) { return x.nome && x.qtd > 0; });
}

function dialogo(txt, titulo, nota) {
  var html = '<style>body{font-family:Arial,sans-serif;margin:0}'
    + 'textarea{width:100%;height:370px;box-sizing:border-box;font:13px/1.4 Consolas,monospace;padding:8px}'
    + 'button{margin-top:10px;padding:9px 16px;background:#6B4210;color:#fff;border:0;border-radius:6px;font-weight:bold;cursor:pointer}'
    + 'p{font-size:12px;color:#555}</style>'
    + '<textarea id="t" readonly>' + escaparHtml(txt) + '</textarea>'
    + '<button onclick="var t=document.getElementById(\'t\');t.select();document.execCommand(\'copy\');this.textContent=\'Copiado\'">Copiar</button>'
    + '<p>' + escaparHtml(nota) + '</p>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(680).setHeight(500), titulo);
}

function abaPedidos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA_PEDIDOS);
  if (aba) return aba;
  ss.setSpreadsheetTimeZone(FUSO);
  var abas = ss.getSheets();
  // Planilha nova vem com uma aba vazia; aproveita em vez de deixar sobrando
  if (abas.length === 1 && abas[0].getLastRow() === 0) aba = abas[0].setName(ABA_PEDIDOS);
  else aba = ss.insertSheet(ABA_PEDIDOS, 0);
  aba.appendRow(CABECALHO);
  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
  aba.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  aba.getRange('H:H').setNumberFormat('"R$" #,##0.00');
  aba.hideColumns(C.token);   // código que autoriza o envio do comprovante; não precisa ficar à vista
  return aba;
}

function pasta() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('PASTA_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* pasta apagada: cria outra */ } }
  var p = DriveApp.createFolder(PASTA);
  props.setProperty('PASTA_ID', p.getId());
  return p;
}

function responder(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function limpar(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, MAX_CAMPO); }
// O apóstrofo faz a planilha guardar como texto: impede fórmula ("=...") e mantém zeros e o "+" do telefone
function texto(s) { return s ? "'" + s : ''; }
function brl(n) { return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function escaparHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
