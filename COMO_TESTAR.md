# 🧪 Manual Passo a Passo de Testes da API

> **Projeto NP1 – API de Controle de Manutenção Industrial**  
> **Instituição:** Centro Universitário Ateneu (UniATENEU)  
> **Repositório:** [https://github.com/ScriptDev/API-de-Manuten-o-Industrial.git](https://github.com/ScriptDev/API-de-Manuten-o-Industrial.git)  

Este documento é o guia prático e oficial para executar, testar e homologar **todos os módulos, regras de negócio e os 8 problemas do edital da NP1**.

---

## 📋 Índice
1. [Preparação do Ambiente e Inicialização](#1-preparação-do-ambiente-e-inicialização)
2. [Método 1: Testes pelo Swagger UI (Navegador)](#2-método-1-testes-pelo-swagger-ui-navegador)
3. [Método 2: Testes pelo Postman (Coleção Pronta)](#3-método-2-testes-pelo-postman-coleção-pronta)
4. [Validação Técnica dos 8 Cenários de Negócio](#4-validação-técnica-dos-8-cenários-de-negócio)
5. [Validação dos Tratamentos de Erro Obrigatórios](#5-validação-dos-tratamentos-de-erro-obrigatórios)
6. [Restauração Rápida do Banco de Dados (Reset de Dados)](#6-restauração-rápida-do-banco-de-dados-reset-de-dados)

---

## 1. Preparação do Ambiente e Inicialização

Antes de iniciar qualquer teste, a API e o banco de dados SQLite precisam estar em execução.

### Passo 1.1: Abrir o Terminal
Abra o **PowerShell** ou **Prompt de Comando** dentro da pasta do projeto:
```powershell
cd "c:\Users\Usuario\OneDrive - Centro Universitário Ateneu\Área de Trabalho\Atvidade Jallyson"
```

### Passo 1.2: Garantir que o Banco está Sincronizado e com Dados de Teste
Execute os dois comandos abaixo:
```powershell
# Sincroniza o schema com o SQLite
npx prisma db push

# Popula o banco com a massa de dados inicial de teste
npm run seed
```

Você verá a saída confirmando que os dados foram inseridos:
```text
🔄 Iniciando carga de dados (Seed) para demonstração da API...
🧹 Banco limpo com sucesso.
✅ Equipamentos cadastrados.
✅ Ordens de Serviço cadastradas.
✅ Peças cadastradas com histórico compartilhado do código ROL-6205.
✅ Defeitos cadastrados (incluindo defeito Crítico).
✅ Manutenções Preventivas cadastradas (incluindo vencida com alerta).
🎉 Carga inicial (Seed) concluída com sucesso!
```

### Passo 1.3: Iniciar o Servidor
Execute:
```powershell
npm run dev
```

O terminal exibirá:
```text
====================================================
🚀 API DE MANUTENÇÃO INDUSTRIAL INICIADA COM SUCESSO
📡 Endereço Local:      http://localhost:3000
📚 Swagger OpenAPI UI:  http://localhost:3000/api-docs
⚙️  Banco de Dados:     SQLite (Prisma ORM)
====================================================
```
> **Importante:** Mantenha esta janela de terminal aberta enquanto realiza os testes.

---

## 2. Método 1: Testes pelo Swagger UI (Navegador)

Esta é a forma mais ágil e interativa para validar os endpoints diretamente pelo navegador, sem necessidade de ferramentas adicionais.

1. Abra seu navegador de internet (Google Chrome, Edge, Firefox).
2. Acesse a URL: **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**.
3. Você verá a tela da documentação OpenAPI com todos os endpoints divididos por cores e tags:
   * 🟢 **GET** (Consultas)
   * 🔵 **POST** (Cadastros)
   * 🟠 **PUT** (Atualizações)
   * 🔴 **DELETE** (Exclusões)

### Como executar qualquer requisição no Swagger:
1. Clique no endpoint desejado para expandir os detalhes.
2. Clique no botão branco **"Try it out"** (canto superior direito do bloco).
3. Se o endpoint exigir parâmetros ou corpo (Body), preencha ou mantenha o exemplo pré-carregado.
4. Clique no botão azul **"Execute"**.
5. Logo abaixo, na seção **"Responses"**, verifique:
   * **Code:** `200` (Sucesso), `201` (Criado), `400` (Erro de Validação) ou `404` (Não Encontrado).
   * **Response body:** Os dados em formato JSON retornados pelo banco SQLite.

---

## 3. Método 2: Testes pelo Postman (Coleção Pronta)

O projeto já inclui o arquivo [`postman_collection.json`](./postman_collection.json) exportado no padrão oficial v2.1.0 para entrega e validação.

### Passo a passo para importar e rodar no Postman:
1. Abra o programa **Postman**.
2. No canto superior esquerdo, clique no botão **"Import"**.
3. Arraste para a tela o arquivo **`postman_collection.json`** localizado na raiz do projeto (ou clique em *files* e selecione-o).
4. A coleção **"NP1 - Manutenção Industrial (API Completa)"** será criada no menu lateral esquerdo com 5 pastas organizadas:
   * `1. Equipamentos`
   * `2. Ordens de Serviço`
   * `3. Defeitos`
   * `4. Manutenções Preventivas`
   * `5. Peças Substituídas`
5. Para testar qualquer funcionalidade:
   * Dê dois cliques na requisição desejada.
   * Clique no botão azul **"Send"** (lado direito).
   * O resultado em JSON e o status HTTP aparecerão imediatamente no painel inferior.

---

## 4. Validação Técnica dos 8 Cenários de Negócio

Abaixo estão os procedimentos detalhados para testar e homologar cada um dos 8 requisitos de negócio implementados:

---

### 🟢 Problema 1: Atualizar máquina cadastrada incorretamente
* **Cenário:** Uma máquina foi cadastrada com dados incorretos e o operador precisa corrigir seu nome, modelo ou fabricante.
* **Método e URL:** `PUT http://localhost:3000/equipamentos/{id}`
* **Passo a passo no Swagger / Postman:**
  1. Primeiro, execute `GET /equipamentos` e copie o `id` do primeiro equipamento (ex: Torno CNC).
  2. Abra a rota `PUT /equipamentos/{id}`, cole o ID no parâmetro `id`.
  3. No corpo (Body), envie:
     ```json
     {
       "nome": "Torno CNC Multifuncional Corrigido",
       "modelo": "Galaxy 30M EVO",
       "fabricante": "Romi Indústrias"
     }
     ```
  4. Clique em **Execute** / **Send**.
* **Resultado Esperado:**
  * **Status HTTP:** `200 OK`
  * **Resposta:** Retorna a confirmação com o equipamento contendo os dados corrigidos.

---

### 🟢 Problema 2: Impedir cadastro de Ordem de Serviço para equipamento inexistente
* **Cenário:** O usuário tenta abrir uma OS informando um ID de máquina que não existe no banco de dados.
* **Método e URL:** `POST http://localhost:3000/ordens-servico`
* **Passo a passo no Swagger / Postman:**
  1. Abra a requisição `POST /ordens-servico`.
  2. No corpo (Body), envie um `equipamentoId` inexistente:
     ```json
     {
       "equipamentoId": "id-fantasma-inexistente-9999",
       "tipo": "Corretiva",
       "responsavel": "Técnico Plantonista",
       "status": "Aberta"
     }
     ```
  3. Clique em **Execute** / **Send**.
* **Resultado Esperado:**
  * **Status HTTP:** `404 Not Found`
  * **Resposta:**
    ```json
    {
      "status": "error",
      "statusCode": 404,
      "message": "Equipamento inexistente. Cadastro de Ordem de Serviço negado."
    }
    ```

---

### 🟢 Problema 3: Identificar manutenção preventiva vencida
* **Cenário:** O gestor da fábrica precisa identificar quais máquinas estão operando com prazos de manutenção vencidos para evitar paradas na linha de produção.
* **Método e URL:** `GET http://localhost:3000/manutencoes/vencidas`
* **Passo a passo:**
  1. Execute a requisição `GET /manutencoes/vencidas`.
* **Resultado Esperado:**
  * **Status HTTP:** `200 OK`
  * **Resposta:** O sistema calcula a diferença em relação à data atual e exibe o alerta:
    ```json
    {
      "totalVencidas": 1,
      "statusAlerta": "ALERTA_ATIVO",
      "mensagemGeral": "Existem máquinas operando com manutenção preventiva em atraso.",
      "vencidas": [
        {
          "equipamento": {
            "nome": "Prensa Hidráulica 200T",
            "modelo": "PH-200 Heavy"
          },
          "diasAtraso": 12,
          "alertaOperacional": "⚠️ ATENÇÃO: MANUTENÇÃO PREVENTIVA VENCIDA HÁ 12 DIA(S)! Risco de parada não programada da máquina."
        }
      ]
    }
    ```

---

### 🟢 Problema 4: Consultar histórico de uma peça específica por código
* **Cenário:** Uma peça quebra frequentemente ao longo do ano e o setor de compras quer auditar seu histórico de consumo, ordens de serviço e custo total acumulado.
* **Método e URL:** `GET http://localhost:3000/pecas/historico/ROL-6205`
* **Passo a passo:**
  1. Execute a requisição informando o código da peça `ROL-6205`.
* **Resultado Esperado:**
  * **Status HTTP:** `200 OK`
  * **Resposta:** Traz o histórico detalhado, somando todas as trocas e listando as máquinas afetadas:
    ```json
    {
      "codigoPeca": "ROL-6205",
      "nomeReferencia": "Rolamento de Precisão Cônico",
      "totalOcorrencias": 2,
      "quantidadeTotalConsumida": 6,
      "custoTotalAcumulado": 851,
      "custoTotalFormatado": "R$ 851,00",
      "historicoSubstituicoes": [ ... ]
    }
    ```

---

### 🟢 Problema 5: Destacar prioridade de defeito crítico
* **Cenário:** Uma anomalia grave com risco de segurança ou fogo é registrada na fábrica e o sistema deve disparar alerta prioritário imediato.
* **Método e URL:** `POST http://localhost:3000/defeitos`
* **Passo a passo:**
  1. Primeiro, copie o `id` de um equipamento válido (via `GET /equipamentos`).
  2. Envie no corpo do `POST /defeitos`:
     ```json
     {
       "equipamentoId": "COLE_O_ID_DO_EQUIPAMENTO_AQUI",
       "descricao": "Vazamento severo de óleo sob alta pressão com risco iminente de explosão.",
       "severidade": "Crítico"
     }
     ```
  3. Clique em **Execute** / **Send**.
* **Resultado Esperado:**
  * **Status HTTP:** `201 Created`
  * **Resposta:** Retorna a bandeira de emergência:
    ```json
    {
      "status": "PRIORIDADE_MAXIMA",
      "alertaPrioridade": "🚨 ATENÇÃO OPERACIONAL: Defeito com grau de severidade \"CRÍTICO\" registrado! Notificação enviada à equipe técnica...",
      "defeito": { ... }
    }
    ```
  > *Dica:* Você também pode consultar a rota `GET /defeitos/criticos` para ver a fila de falhas graves pendentes.

---

### 🟢 Problema 6: Tentar excluir equipamento com Ordens de Serviço vinculadas
* **Cenário:** Um usuário tenta deletar uma máquina antiga, mas ela possui ordens de serviço históricas vinculadas (o sistema deve bloquear para preservar o histórico).
* **Método e URL:** `DELETE http://localhost:3000/equipamentos/{id}`
* **Passo a passo:**
  1. Copie o `id` do Torno CNC ou da Prensa Hidráulica (que já possuem ordens vinculadas geradas pelo Seed).
  2. Execute a requisição `DELETE /equipamentos/{id}` passando esse ID.
* **Resultado Esperado:**
  * **Status HTTP:** `400 Bad Request`
  * **Resposta:** A exclusão é bloqueada com mensagem clara:
    ```json
    {
      "status": "error",
      "statusCode": 400,
      "message": "Impossível excluir equipamento: Existem registros vinculados (1 Ordens de Serviço, 1 Defeitos, 0 Manutenções)."
    }
    ```

---

### 🟢 Problema 7: Consultar todos os equipamentos atualmente em manutenção
* **Cenário:** A diretoria industrial precisa saber exatamente quais máquinas estão fora de operação em manutenção no momento.
* **Método e URL:** `GET http://localhost:3000/equipamentos/em-manutencao`
* **Passo a passo:**
  1. Execute a requisição `GET /equipamentos/em-manutencao`.
* **Resultado Esperado:**
  * **Status HTTP:** `200 OK`
  * **Resposta:** Retorna as máquinas com status `'Em manutenção'` acompanhadas de suas ordens de serviço ativas:
    ```json
    {
      "total": 1,
      "descricao": "Equipamentos que estão atualmente sob processo de manutenção.",
      "equipamentos": [
        {
          "nome": "Prensa Hidráulica 200T",
          "modelo": "PH-200 Heavy",
          "status": "Em manutenção",
          "ordens": [ ... ]
        }
      ]
    }
    ```

---

### 🟢 Problema 8: Calcular o custo total de peças utilizadas em uma Ordem de Serviço
* **Cenário:** O setor financeiro necessita apurar o custo total dos sobressalentes aplicados em uma OS específica.
* **Método e URL:** `GET http://localhost:3000/ordens-servico/{id}/custo-pecas`
* **Passo a passo:**
  1. Execute `GET /ordens-servico` e copie o `id` da primeira ordem (onde foram cadastrados 2 rolamentos e 4 retentores).
  2. Execute `GET /ordens-servico/{id}/custo-pecas` informando esse ID.
* **Resultado Esperado:**
  * **Status HTTP:** `200 OK`
  * **Resposta:** Multiplica quantidade por custo unitário de cada peça e totaliza com formatação monetária em Real:
    ```json
    {
      "ordemServicoId": "uuid-da-ordem",
      "statusOS": "Em andamento",
      "responsavel": "Carlos Alberto (Especialista Mecânico)",
      "totalItensSubstituidos": 6,
      "custoTotal": 431,
      "custoTotalFormatado": "R$ 431,00",
      "pecas": [
        {
          "nome": "Rolamento de Precisão Cônico",
          "codigo": "ROL-6205",
          "quantidade": 2,
          "custoUnitario": 145.5,
          "subtotal": 291
        },
        {
          "nome": "Retentor de Óleo Viton",
          "codigo": "RET-0042",
          "quantidade": 4,
          "custoUnitario": 35,
          "subtotal": 140
        }
      ]
    }
    ```

---

## 5. Validação dos Tratamentos de Erro Obrigatórios

O edital da prova exige o tratamento específico de cenários anômalos. Para testá-los:

1. **Campos obrigatórios ausentes:**
   * Tente cadastrar equipamento com `POST /equipamentos` enviando apenas `{"nome": "Torno"}`.
   * **Retorno:** `400 Bad Request` com a mensagem `"Campos obrigatórios ausentes: nome, modelo, fabricante, dataInstalacao e status são obrigatórios."`
2. **Ordem de Serviço já finalizada:**
   * Tente alterar uma OS com status `'Finalizada'` usando `PUT /ordens-servico/{id}` ou tente adicionar uma peça a ela usando `POST /pecas`.
   * **Retorno:** `400 Bad Request` com a mensagem `"Operação negada: Não é permitido adicionar peças a uma Ordem de Serviço já finalizada."`

---

## 6. Restauração Rápida do Banco de Dados (Reset de Dados)

Se durante os testes você cadastrar novos dados, alterar registros ou desejar reiniciar o banco para o estado inicial:

1. Vá ao terminal onde a API está rodando (ou abra um novo terminal na pasta).
2. Execute:
   ```powershell
   npm run seed
   ```
3. O banco SQLite será limpo e recarregado instantaneamente em menos de 2 segundos.

---

Ass: Samuel Mendes Cardoso - Software Factory Labs
