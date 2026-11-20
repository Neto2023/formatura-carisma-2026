# Feijoada Solidária: como colocar as encomendas no ar

Onde fica: na página da formatura (save the date), seção **Feijoada Solidária**, logo abaixo da contagem regressiva:
https://neto2023.github.io/formatura-carisma-2026/save-the-date/#feijoada

A seção aparece até domingo, 22/11, às 16h, e depois some sozinha da página.

Mesmo modelo da votação: a página no GitHub Pages envia cada pedido para um Google Apps Script, que grava numa planilha no Drive da comissão. Leva uns 15 minutos. Tudo o que pede login é feito pelo senhor; o Claude Code nunca digita senha.

**Use uma planilha nova**, separada da votação. Assim os pedidos não se misturam com os votos e nada da votação é alterado.

## Como funciona

```
Celular do comprador
   │  preenche nome, WhatsApp, porções e como vai receber
   ▼
save-the-date/index.html, seção Feijoada (GitHub Pages)
   │  envia o pedido (POST)                    ┌─ responde com o número do pedido (F001, F002...)
   ▼                                           │
Apps Script (app da web) ──────────────────────┘
   │  grava a linha e guarda o comprovante
   ▼
Planilha "Feijoada Solidária 2026"            Pasta no Drive "Comprovantes Feijoada Solidária 2026"
   ├─ aba Pedidos (Pago e Entregue com caixinha)
   └─ aba Resumo (porções, valor previsto, valor recebido)
```

A página gera o QR Code e o "Pix copia e cola" com **o valor exato do pedido** (2 porções, R$ 50,00) e com o número do pedido no campo de identificação do Pix. A chave, a recebedora e a cidade são as mesmas do QR Code do cartaz.

Se a planilha não responder, a página continua funcionando (plano B): mostra o Pix e um botão que manda o pedido completo por WhatsApp para a comissão anotar.

## 1. Criar a planilha e colar o script

1. No [Google Drive](https://drive.google.com): **Novo** > **Planilhas Google** > **Planilha em branco**. Nome: **Feijoada Solidária 2026**.
2. **Extensões** > **Apps Script**. Apague o que vier no `Código.gs`.
3. Copie todo o conteúdo de [`Code.gs`](Code.gs) e cole no editor. Salve (disquete). Nome do projeto: **Feijoada Solidária**.

## 2. Preparar e autorizar

1. Na lista de funções ao lado de **Executar**, escolha **prepararPlanilha** e clique em **Executar**.
2. Autorize com a sua conta (**Avançado** > **Acessar Feijoada Solidária (não seguro)** > **Permitir**). O aviso é normal para script próprio. Desta vez o Google também pede acesso ao Drive: é para criar a pasta dos comprovantes.
3. Na planilha aparecem as abas **Pedidos** e **Resumo**, e no Drive a pasta **Comprovantes Feijoada Solidária 2026**.

## 3. Publicar como app da web

1. **Implantar** > **Nova implantação** > engrenagem > **App da Web**.
2. Executar como: **Eu**. Quem pode acessar: **Qualquer pessoa**. **Implantar**.
3. Copie a URL que termina em `/exec` e abra no navegador. Deve aparecer `{"ok":true,"vendas":"abertas",...}`.

## 4. Entregar a URL ao Claude Code

Mande a URL. Ele cola na constante `URL_APPS_SCRIPT` do script da feijoada no `save-the-date/index.html` e publica.

## 5. Teste antes de divulgar

1. Abra a página no celular, faça um pedido de teste e envie qualquer foto como comprovante.
2. Confira a linha na aba **Pedidos** e a foto na pasta do Drive.
3. Apague as linhas de teste (da linha 2 para baixo; nunca a linha 1).
4. No editor do Apps Script, execute **zerarNumeracao**, para o primeiro pedido de verdade ser o F001.
5. **Compartilhar** a planilha só com a comissão.

## No dia a dia

- **Conferir pagamentos:** abra o extrato do Pix da conta da Tatiele. O número do pedido (F001...) aparece como identificação na maioria dos bancos; o valor e o nome ajudam a casar. Marque a caixinha **Pago**.
- **Avisar o comprador:** clique na linha do pedido e use **Feijoada** > **Confirmar pagamento ao cliente**. Abre o WhatsApp da pessoa com a mensagem pronta.
- **Parcial para a comissão:** **Feijoada** > **Resumo para o WhatsApp**. A aba **Resumo** mostra o mesmo em tempo real, inclusive quantas porções a cozinha precisa preparar.
- **Pedido que chegou pelo WhatsApp (plano B):** acrescente a linha à mão na aba Pedidos. Para o número, use o próximo da sequência com uma letra a mais (por exemplo, F015W), para não colidir com os do site.
- **Pedido desistente:** apague a linha.

## Domingo, na retirada

**Feijoada** > **Lista de retirada (domingo)**: lista em ordem alfabética com número do pedido, porções, forma e alerta "CONFERIR PAGAMENTO" para quem ainda não foi marcado como pago. Marque **Entregue** na aba Pedidos conforme cada pessoa retira; o Resumo soma as porções já entregues.

## Ajustes

| O quê | Onde |
|---|---|
| Prazo das encomendas | `PRAZO` no `save-the-date/index.html` **e** no `Code.gs` (depois de mudar o `Code.gs`: **Implantar** > **Gerenciar implantações** > lápis > **Nova versão**) |
| Local e horário do almoço | `LOCAL` e `HORARIO` no `save-the-date/index.html` |
| Quando a seção some da página | `FIM` no `save-the-date/index.html` |
| WhatsApp que recebe comprovantes | `WHATSAPP` no `save-the-date/index.html` |
| Formas de receber | `FORMAS` no `save-the-date/index.html` e no `Code.gs` (iguais) |
| Preço | `VALOR` nos dois arquivos |

Regra de texto do projeto: não usar travessão.
