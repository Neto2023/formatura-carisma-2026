# Como colocar a votação no ar

Passo a passo para o Dr. Abrahão. Tudo o que pede login (conta Google e GitHub) é feito pelo senhor mesmo; o Claude Code nunca digita senha.

São três partes: **A**, a planilha e o script no Google; **B**, o formulário no GitHub; **C**, o teste final antes de divulgar o link. Leva uns 20 minutos.

---

## Parte A. Planilha e script no Google Drive

### 1. Criar a planilha

1. Abra [drive.google.com](https://drive.google.com) com a sua conta.
2. Clique em **Novo** > **Planilhas Google** > **Planilha em branco**.
3. No canto superior esquerdo, clique em "Planilha sem título" e dê o nome **Votação Formatura Carisma 2026**.

### 2. Colar o script

1. Na planilha, abra o menu **Extensões** > **Apps Script**. Abre uma nova aba com o editor.
2. No editor, apague todo o texto que já vem no arquivo `Código.gs`.
3. Abra o arquivo [`Code.gs`](Code.gs) deste repositório, copie todo o conteúdo e cole no editor.
4. Clique no ícone de disquete (**Salvar projeto**).
5. No topo, clique em "Projeto sem título" e dê o nome **Votação Formatura Carisma**.

### 3. Preparar a planilha e autorizar

1. Na barra de cima do editor, ao lado do botão **Executar**, há uma lista de funções. Escolha **prepararPlanilha**.
2. Clique em **Executar**.
3. O Google pede autorização: clique em **Revisar permissões** e escolha a sua conta.
4. Vai aparecer o aviso "O Google não verificou este app". É normal: o script é seu e não passou pela verificação do Google, que só existe para apps publicados para o público. Clique em **Avançado** e depois em **Acessar Votação Formatura Carisma (não seguro)**.
5. Clique em **Permitir**.
6. Volte para a aba da planilha: agora ela tem as abas **Votos** (com o cabeçalho) e **Resultado**.

### 4. Publicar como app da web

1. No editor do Apps Script, clique em **Implantar** (botão azul, canto superior direito) > **Nova implantação**.
2. Clique na engrenagem ao lado de "Selecione o tipo" e escolha **App da Web**.
3. Preencha:
   - Descrição: `v1`
   - Executar como: **Eu** (o seu e-mail)
   - Quem pode acessar: **Qualquer pessoa**
4. Clique em **Implantar**.
5. Copie a **URL do app da Web**. Ela começa com `https://script.google.com/macros/s/` e termina em `/exec`.

"Qualquer pessoa" é o que permite ao formando votar sem login. Mesmo assim, ninguém de fora enxerga a planilha: o script só acrescenta linhas, e a planilha continua visível apenas para quem o senhor compartilhar.

### 5. Testar o endereço

Cole a URL copiada na barra do navegador e abra. Deve aparecer algo assim:

```
{"ok":true,"votacao":"aberta","prazo":"31/10/2026 às 23:59"}
```

Se aparecer, o script está no ar.

### 6. Entregar a URL ao Claude Code

Mande a URL para o Claude Code. Ele cola o endereço na constante `URL_APPS_SCRIPT` do `index.html` e registra a mudança no repositório.

(Se preferir fazer à mão: no `index.html`, troque `COLE_AQUI_A_URL_DO_APPS_SCRIPT` pela URL, mantendo as aspas simples.)

---

## Parte B. Formulário no GitHub Pages

### 7. Criar o repositório

1. Entre em [github.com/new](https://github.com/new) com a sua conta.
2. Repository name: **formatura-carisma-2026**
3. Marque **Public**.
4. Não marque nenhuma opção de "Add README", ".gitignore" ou "license": o repositório precisa nascer vazio.
5. Clique em **Create repository** e mande o endereço do repositório para o Claude Code.

### 8. Enviar o código

O Claude Code envia os arquivos. Na primeira vez, o Windows abre uma janela do GitHub pedindo para entrar na conta: entre o senhor mesmo e autorize.

### 9. Ativar o GitHub Pages

1. No repositório, clique em **Settings** (aba no topo).
2. No menu da esquerda, clique em **Pages**.
3. Em "Build and deployment", Source: **Deploy from a branch**.
4. Em Branch, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
5. Espere um ou dois minutos e recarregue a página. O link aparece no topo, no formato:
   `https://SEU-USUARIO.github.io/formatura-carisma-2026/`

---

## Parte C. Teste final e divulgação

### 10. Votar como teste

1. Abra o link do formulário no celular.
2. Preencha com um nome de teste (por exemplo, "Teste Um") e toque em **Enviar meu voto**.
3. Deve aparecer "Voto registrado. Obrigado!".
4. Na planilha, aba **Votos**, a linha aparece em poucos segundos.

### 11. Gerar o resultado de teste

1. Recarregue a planilha (tecla F5). Aparece o menu **Formatura** ao lado de "Ajuda".
2. Clique em **Formatura** > **Gerar resultado**.
3. Abre uma janela com o texto pronto e o botão **Copiar resultado**. O mesmo texto fica salvo na aba **Resultado**.

### 12. Apagar os votos de teste (obrigatório antes de divulgar)

1. Na aba **Votos**, selecione as linhas de teste, da linha 2 para baixo, clicando nos números das linhas.
2. Botão direito > **Excluir linhas**.
3. Não apague a linha 1, que é o cabeçalho.
4. Na aba **Resultado**, selecione tudo e apague.

### 13. Compartilhar com a comissão e divulgar

1. Na planilha, botão **Compartilhar**: adicione só os e-mails da comissão (Amanda, Gilvan, Tatiane, Taliele). O formulário promete que só a comissão vê os votos.
2. Mande o link do formulário no grupo da turma.

---

## No dia a dia

### Apurar a votação

Menu **Formatura** > **Gerar resultado** > **Copiar resultado** > colar no grupo do WhatsApp. Pode gerar quantas vezes quiser: cada vez reescreve a aba Resultado com os números do momento.

Regras da apuração:

- Cada formando conta uma vez. Se votou mais de uma vez, vale o voto mais recente.
- O nome é comparado sem acento, sem diferença de maiúsculas e sem espaços duplicados: "José da Silva" e "jose  da silva" são a mesma pessoa.
- O valor da beca é R$ 120,00, mais R$ 20,00 para quem pediu canudo com o nome.

### A mesma pessoa votou com nomes diferentes

Por exemplo, "Ana Souza" e "Ana S. Souza". Na aba **Votos**, coluna **Chave do nome**, escreva o mesmo texto nas duas linhas (por exemplo, `ana souza`). A apuração passa a tratar as duas como uma só pessoa e vale a mais recente.

### Voto que chegou pelo WhatsApp (plano B)

Se o formulário não conseguir enviar, ele mostra o voto em texto para o formando colar no grupo. Para esse voto contar:

1. Na aba **Votos**, vá até a primeira linha vazia.
2. Preencha a coluna **Data e hora** com o dia e a hora da mensagem (por exemplo, `25/10/2026 14:30`). Isso importa: se a pessoa votar de novo pelo formulário, vale o mais recente.
3. Preencha as demais colunas copiando da mensagem. A coluna **Chave do nome** pode ficar em branco.

### Mudar o prazo ou encerrar antes

O prazo está em dois lugares, que precisam ficar iguais:

- no script: a linha `var PRAZO = new Date('2026-10-31T23:59:59-03:00');` no editor do Apps Script;
- no formulário: a mesma linha no `index.html` (o Claude Code altera e envia).

Depois de mudar o script, é preciso **publicar uma nova versão**, senão a mudança não vale:

1. **Implantar** > **Gerenciar implantações**.
2. Clique no lápis (**Editar**).
3. Em Versão, escolha **Nova versão**. Clique em **Implantar**.

A URL continua a mesma; não precisa mexer no formulário por causa disso.

### O formulário diz "Não foi possível enviar agora"

1. Abra a URL do app da web no navegador (passo 5). Se não aparecer `"ok":true`, refaça a implantação.
2. Confira em **Implantar** > **Gerenciar implantações** se "Quem pode acessar" está como **Qualquer pessoa**.
3. Confira se a URL no `index.html` é a mesma da implantação ativa.

Enquanto isso, os votos chegam pelo WhatsApp e entram na planilha como no plano B acima.
