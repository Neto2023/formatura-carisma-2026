/**
 * Votação da Formatura Carisma Intensivo 2026.
 * Script vinculado à planilha: recebe os votos do formulário (doPost) e gera o resultado
 * pelo menu Formatura > Gerar resultado. Passo a passo de implantação em apps-script/LEIA-ME.md.
 */

// Encerramento da votação, no horário de Belém (UTC-3). Manter igual ao PRAZO do index.html.
var PRAZO = new Date('2026-10-31T23:59:59-03:00');
var FUSO = 'America/Belem';
var ABA_VOTOS = 'Votos';
var ABA_RESULTADO = 'Resultado';
var CABECALHO = ['Data e hora', 'Nome', 'Chave do nome', 'Nome da turma', 'Música', 'Paraninfo', 'Professor',
  'Modelo da beca', 'Capelo', 'Canudo com nome', 'Tamanho ou altura', 'Valor estimado'];
var VALOR_BECA = 120;
var VALOR_CANUDO = 20;
var MAX_CAMPO = 200;

// Recebe um voto do formulário e grava uma linha na aba Votos.
function doPost(e) {
  try {
    if (new Date() > PRAZO) return responder({ok: false, erro: 'encerrada'});
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    // Campo oculto anti-robô: pessoa não vê o campo; se veio preenchido, descarta sem avisar
    if (limpar(d.site)) return responder({ok: true});
    var v = {
      nome: limpar(d.nome), turma: limpar(d.turma), musica: limpar(d.musica),
      paraninfo: limpar(d.paraninfo), professor: limpar(d.professor),
      beca: limpar(d.beca), capelo: limpar(d.capelo), canudo: limpar(d.canudo), tamanho: limpar(d.tamanho)
    };
    var faltas = [];
    if (!v.nome) faltas.push('nome');
    if (!v.turma) faltas.push('nome da turma');
    if (!v.musica) faltas.push('música');
    if (faltas.length) return responder({ok: false, erro: 'Falta preencher: ' + faltas.join(', ') + '.'});

    var trava = LockService.getScriptLock();
    trava.waitLock(15000);
    try {
      abaVotos().appendRow([
        new Date(), texto(v.nome), texto(chave(v.nome)), texto(v.turma), texto(v.musica),
        texto(v.paraninfo), texto(v.professor), texto(v.beca), texto(v.capelo), texto(v.canudo), texto(v.tamanho),
        v.beca ? valorBeca(v.canudo) : ''
      ]);
    } finally {
      trava.releaseLock();
    }
    return responder({ok: true});
  } catch (err) {
    return responder({ok: false, erro: String((err && err.message) || err)});
  }
}

// Abrir a URL do app da web no navegador mostra se a votação está aberta. Serve de teste da implantação.
function doGet() {
  return responder({
    ok: true,
    votacao: new Date() > PRAZO ? 'encerrada' : 'aberta',
    prazo: Utilities.formatDate(PRAZO, FUSO, "dd/MM/yyyy 'às' HH:mm")
  });
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Formatura').addItem('Gerar resultado', 'gerarResultado').addToUi();
}

// Rodar uma vez pelo editor: cria as abas, acerta o fuso e pede a autorização da conta.
function prepararPlanilha() {
  abaVotos();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(ABA_RESULTADO)) ss.insertSheet(ABA_RESULTADO);
}

function gerarResultado() {
  var ui = SpreadsheetApp.getUi();
  var lista = lerVotos();
  if (!lista.length) {
    ui.alert('Nenhum voto na aba ' + ABA_VOTOS + ' ainda.');
    return;
  }
  var txt = montarResultado(lista, Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy'));
  escreverResultado(txt);
  mostrarResultado(txt);
}

// Um voto por chave de nome, valendo o mais recente pela data e hora (em empate, a linha mais abaixo).
// A comissão pode juntar grafias diferentes da mesma pessoa igualando a coluna "Chave do nome".
function lerVotos() {
  var aba = abaVotos();
  var n = aba.getLastRow();
  if (n < 2) return [];
  var votos = {}, ordem = [];
  aba.getRange(2, 1, n - 1, CABECALHO.length).getValues().forEach(function (l) {
    var v = {
      quando: l[0] instanceof Date ? l[0].getTime() : 0,
      nome: limpar(l[1]), turma: limpar(l[3]), musica: limpar(l[4]), paraninfo: limpar(l[5]), professor: limpar(l[6]),
      beca: limpar(l[7]), capelo: limpar(l[8]), canudo: limpar(l[9]), tamanho: limpar(l[10])
    };
    if (!v.nome) return;
    var k = chave(limpar(l[2]) || v.nome);
    if (!(k in votos)) ordem.push(k);
    else if (v.quando < votos[k].quando) return;
    votos[k] = v;
  });
  return ordem.map(function (k) { return votos[k]; });
}

// Texto pronto para o WhatsApp, no mesmo formato da antiga aba Apuração do formulário.
function montarResultado(list, hoje) {
  var tN = contar(list, 'turma'), tM = contar(list, 'musica'), tP = contar(list, 'paraninfo'), tF = contar(list, 'professor');
  var tB = contar(list, 'beca'), tPl = contar(list, 'capelo'), tC = contar(list, 'canudo');
  var comBeca = list.filter(function (v) { return v.beca; });
  var totalBecas = comBeca.reduce(function (acc, v) { return acc + valorBeca(v.canudo); }, 0);
  return 'RESULTADO DA VOTAÇÃO · FORMATURA CARISMA INTENSIVO 2026\nApuração em ' + hoje + ', com ' + list.length + (list.length === 1 ? ' voto' : ' votos') + '.\n\n'
    + 'Nome da turma: ' + veredito(tN) + '\n' + linhas(tN) + '\n\n'
    + 'Música de entrada: ' + veredito(tM) + '\n' + linhas(tM) + '\n\n'
    + 'Paraninfo, mais indicado: ' + veredito(tP) + '\n' + linhas(tP) + '\n\n'
    + 'Professor homenageado, mais indicado: ' + veredito(tF) + '\n' + linhas(tF) + '\n\n'
    + 'Becas (' + comBeca.length + '):\n' + linhas(tB) + '\n  Capelo:\n' + linhas(tPl).replace(/^  /gm, '    ') + '\n  Canudo com nome:\n' + linhas(tC).replace(/^  /gm, '    ') + '\n  Valor estimado total: ' + brl(totalBecas) + '\n\n'
    + 'Pedido de becas por formando:\n'
    + (comBeca.length ? comBeca.map(function (v) { return '- ' + v.nome + ': ' + v.beca + ', ' + (v.tamanho || 'tamanho não informado') + ', capelo ' + (v.capelo || '').toLowerCase() + ', canudo com nome: ' + (v.canudo || 'não informado').toLowerCase(); }).join('\n') : '  nenhum pedido') + '\n\n'
    + 'Votos individuais:\n'
    + list.map(function (v) { return '- ' + v.nome + ': ' + v.turma + '; ' + v.musica + '; paraninfo: ' + (v.paraninfo || 'sem sugestão') + '; professor: ' + (v.professor || 'sem sugestão'); }).join('\n')
    + '\n\nGratidão a todos pela participação. Comissão de Formatura.';
}

function contar(list, prop) {
  var c = {}, rotulo = {};
  list.forEach(function (v) {
    var x = v[prop];
    if (!x || chave(x) === 'sem sugestao') return;
    var k = chave(x);
    c[k] = (c[k] || 0) + 1;
    if (!rotulo[k]) rotulo[k] = x;
  });
  return Object.keys(c).map(function (k) { return {t: rotulo[k], n: c[k]}; })
    .sort(function (a, b) { return b.n - a.n || a.t.localeCompare(b.t); });
}
function lideres(t) { return t.length ? t.filter(function (x) { return x.n === t[0].n; }) : []; }
function veredito(t) {
  var l = lideres(t);
  if (!l.length) return 'sem votos';
  if (l.length > 1) return 'empate entre ' + l.map(function (x) { return x.t; }).join(' e ') + ' (' + l[0].n + ' votos cada)';
  return l[0].t + ' (' + l[0].n + (l[0].n === 1 ? ' voto)' : ' votos)');
}
function linhas(t) { return t.length ? t.map(function (x) { return '  ' + x.t + ': ' + x.n; }).join('\n') : '  nenhuma indicação'; }

function escreverResultado(txt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA_RESULTADO) || ss.insertSheet(ABA_RESULTADO);
  aba.clear();
  var valores = txt.split('\n').map(function (l) { return [texto(l)]; });
  aba.getRange(1, 1, valores.length, 1).setValues(valores);
  aba.getRange(1, 1).setFontWeight('bold');
  aba.setColumnWidth(1, 900);
}

function mostrarResultado(txt) {
  var html = '<style>body{font-family:Arial,sans-serif;margin:0}'
    + 'textarea{width:100%;height:370px;box-sizing:border-box;font:13px/1.4 Consolas,monospace;padding:8px}'
    + 'button{margin-top:10px;padding:9px 16px;background:#681111;color:#fff;border:0;border-radius:6px;font-weight:bold;cursor:pointer}'
    + 'p{font-size:12px;color:#555}</style>'
    + '<textarea id="t" readonly>' + escaparHtml(txt) + '</textarea>'
    + '<button onclick="var t=document.getElementById(\'t\');t.select();document.execCommand(\'copy\');this.textContent=\'Copiado\'">Copiar resultado</button>'
    + '<p>O mesmo texto fica salvo na aba ' + ABA_RESULTADO + '. Cole no grupo da turma no WhatsApp.</p>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(680).setHeight(500), 'Resultado da votação');
}

function abaVotos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA_VOTOS);
  if (aba) return aba;
  ss.setSpreadsheetTimeZone(FUSO);
  var abas = ss.getSheets();
  // Planilha nova vem com uma aba vazia; aproveita em vez de deixar sobrando
  if (abas.length === 1 && abas[0].getLastRow() === 0) aba = abas[0].setName(ABA_VOTOS);
  else aba = ss.insertSheet(ABA_VOTOS, 0);
  aba.appendRow(CABECALHO);
  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
  aba.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  aba.getRange('L:L').setNumberFormat('"R$" #,##0.00');
  return aba;
}

function responder(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function limpar(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, MAX_CAMPO); }
// Minúsculas, sem acentos e com espaços normalizados: "José  Silva" e "jose silva" viram a mesma chave
function chave(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
// O apóstrofo faz a planilha guardar como texto: impede fórmula ("=...") e conversão de "1,65" em número
function texto(s) { return s ? "'" + s : ''; }
function valorBeca(canudo) { return VALOR_BECA + (chave(canudo) === 'sim' ? VALOR_CANUDO : 0); }
function brl(n) { return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function escaparHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
