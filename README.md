# Votação da Formatura Carisma Intensivo 2026

Formulário online para a turma Carisma Intensivo 2026 (Marabá) escolher o nome da turma e a música de entrada, indicar o professor homenageado, sugerir o paraninfo e fazer o pedido individual de beca. Cerimônia em 6 de dezembro de 2026, às 10h (data adiada; antes era 5 de dezembro, às 19h). Votação aberta até 31 de outubro de 2026, às 23h59 (horário de Belém).

**Link do formulário:** https://neto2023.github.io/formatura-carisma-2026/

O formando abre o link no celular, sem login, e cada voto vai direto para uma planilha no Google Drive da comissão. A apuração sai pronta para colar no grupo do WhatsApp.

## Como funciona

```
Celular do formando
   │  abre o link
   ▼
GitHub Pages: index.html (formulário)
   │  envia o voto (POST)
   ▼
Google Apps Script, publicado como app da web
   │  grava uma linha por voto
   ▼
Planilha no Google Drive
   ├─ aba "Votos"       (dados brutos)
   └─ aba "Resultado"   (gerada pelo menu Formatura)
```

Sem servidor próprio, sem banco de dados e sem custo. O código deste repositório não contém dados pessoais: nomes e escolhas ficam só na planilha, visível apenas para a comissão de formatura.

Se o envio falhar, o formulário mostra o voto em texto com o botão "Copiar voto", para o formando colar no grupo da turma no WhatsApp (plano B).

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O formulário. Página única, sem dependências além das fontes do Google. |
| `apps-script/Code.gs` | Script da planilha: recebe os votos e gera o resultado. |
| `apps-script/LEIA-ME.md` | Passo a passo de implantação, apuração e situações do dia a dia. |
| `save-the-date/index.html` | Página "Save the date" da cerimônia, com contagem regressiva, agenda e compartilhamento. |
| `save-the-date/formatura-carisma-2026.ics` | Evento para a agenda do iPhone e do Outlook. |
| `save-the-date/og-v2.png` e `og-modelo.html` | Imagem da prévia no WhatsApp, já com a nova data, e o modelo que a gera. A `og.png` é a versão anterior, com a data antiga. |
| `feijoada/apps-script/Code.gs` | Script da planilha de encomendas da Feijoada Solidária. |
| `feijoada/apps-script/LEIA-ME.md` | Passo a passo de implantação e uso das encomendas da feijoada. |
| `feijoada/cartaz.jpg`, `cartaz-720.jpg` e `qrcode.min.js` | Cartaz da feijoada e a biblioteca que desenha o QR Code do Pix (MIT, Kazuhiko Arase). |

## Save the date

**Link:** https://neto2023.github.io/formatura-carisma-2026/save-the-date/

Cerimônia em domingo, 6 de dezembro de 2026, às 10h (data adiada; antes era sábado, 5 de dezembro, às 19h), na Igreja Batista da Lagoinha Marabá (Rodovia Transamazônica, km 5, em frente ao Supermercado Líder). Depois da apuração, preencher a constante `TURMA` no script da página com os dados do nome vencedor, copiados da lista `NOMES` do formulário.

## Feijoada Solidária

Encomenda do almoço de domingo, 22 de novembro de 2026 (R$ 25,00 a porção, no Pix), dentro da página do save the date:
https://neto2023.github.io/formatura-carisma-2026/save-the-date/#feijoada

O pedido vai para uma planilha própria, separada da votação, e a página gera o QR Code Pix com o valor exato e o número do pedido. Encomendas até domingo, 22/11, às 15h (prazo estendido; antes era sábado, 21/11, às 23h59); a seção some da página no domingo, 22/11, às 16h. Implantação e uso no dia a dia: [`feijoada/apps-script/LEIA-ME.md`](feijoada/apps-script/LEIA-ME.md).

## Para a comissão

- **Colocar no ar:** siga o [`apps-script/LEIA-ME.md`](apps-script/LEIA-ME.md).
- **Apurar:** na planilha, menu **Formatura** > **Gerar resultado**.
- **Regra da apuração:** um voto por formando, valendo o mais recente; nomes comparados sem acento e sem diferença de maiúsculas.

## Ajustes no código

- Endereço do Apps Script: constante `URL_APPS_SCRIPT` no topo do script do `index.html`.
- Prazo de encerramento: constante `PRAZO`, que precisa ser igual no `index.html` e no `Code.gs`. Depois de mudar o `Code.gs`, publicar nova versão da implantação (ver LEIA-ME).
- Opções de nome da turma, músicas, professores e becas: listas `NOMES`, `MUSICAS`, `PROFESSORES`, `BECAS`, `PLUMA` e `CANUDO` no `index.html`.
- Valores da beca: `VALOR_BECA` e `VALOR_CANUDO` no `Code.gs`, e a função `valor()` no `index.html`.

Regra de texto do projeto: não usar travessão; usar vírgula, ponto, dois-pontos ou reescrever.

Comissão de formatura: Amanda Soares, Gilvan Júnior, Tatiane Frazão, Taliele Miranda e Abrahão Neto.
