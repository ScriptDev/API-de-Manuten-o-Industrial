export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "API de Controle de Manutenção Industrial",
    version: "1.0.0",
    description: "API RESTful corporativa para gestão de equipamentos fabris, histórico de falhas, planejamento de manutenção preventiva e reposição de sobressalentes. Desenvolvida para a avaliação NP1 (UniATENEU - Back-End).",
    contact: {
      name: "Software Factory Labs - Samuel Mendes Cardoso",
    }
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor de Desenvolvimento Local"
    }
  ],
  tags: [
    { name: "Equipamentos", description: "Gerenciamento e ciclo de vida de ativos da fábrica" },
    { name: "Ordens de Serviço", description: "Abertura, acompanhamento e custos de OS corretivas/preventivas" },
    { name: "Defeitos", description: "Registro e triagem de anomalias com classificação de severidade" },
    { name: "Manutenções Preventivas", description: "Programação periódica e alarmes de vencimento preventivo" },
    { name: "Peças Substituídas", description: "Controle de estoque aplicado e rastreamento histórico de consumo" }
  ],
  paths: {
    "/equipamentos": {
      get: {
        tags: ["Equipamentos"],
        summary: "Listar equipamentos (com filtro opcional por status)",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["Ativo", "Em manutenção", "Inativo"] },
            description: "Filtrar pelo estado operacional do equipamento"
          }
        ],
        responses: {
          200: { description: "Lista de equipamentos recuperada com sucesso." }
        }
      },
      post: {
        tags: ["Equipamentos"],
        summary: "Cadastrar novo equipamento",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "modelo", "fabricante", "dataInstalacao", "status"],
                properties: {
                  nome: { type: "string", example: "Torno CNC Industrial" },
                  modelo: { type: "string", example: "TC-500X" },
                  fabricante: { type: "string", example: "Romi" },
                  dataInstalacao: { type: "string", format: "date-time", example: "2023-05-10T08:00:00Z" },
                  status: { type: "string", enum: ["Ativo", "Em manutenção", "Inativo"], example: "Ativo" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Equipamento cadastrado com sucesso." },
          400: { description: "Campos obrigatórios ausentes ou inválidos." }
        }
      }
    },
    "/equipamentos/em-manutencao": {
      get: {
        tags: ["Equipamentos"],
        summary: "[Problema 7] Consultar equipamentos atualmente em manutenção",
        description: "Retorna todos os equipamentos fabris com status 'Em manutenção' e suas ordens de serviço ativas.",
        responses: {
          200: { description: "Equipamentos em manutenção recuperados." }
        }
      }
    },
    "/equipamentos/{id}": {
      get: {
        tags: ["Equipamentos"],
        summary: "Buscar equipamento por ID (com detalhes de OS e manutenções)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Dados do equipamento." },
          404: { description: "Equipamento não encontrado." }
        }
      },
      put: {
        tags: ["Equipamentos"],
        summary: "[Problema 1] Atualizar máquina cadastrada incorretamente",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", example: "Torno CNC Modificado" },
                  modelo: { type: "string", example: "TC-500X Pro" },
                  fabricante: { type: "string", example: "Romi Brasil" },
                  status: { type: "string", example: "Em manutenção" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Equipamento retificado com sucesso." },
          404: { description: "Equipamento inexistente." }
        }
      },
      delete: {
        tags: ["Equipamentos"],
        summary: "[Problema 6] Excluir equipamento (com validação de integridade referencial)",
        description: "Caso o equipamento possua Ordens de Serviço, Defeitos ou Manutenções vinculadas, a exclusão é rejeitada (HTTP 400).",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Equipamento removido com sucesso." },
          400: { description: "Violação de integridade: existem vínculos associados." },
          404: { description: "Equipamento não encontrado." }
        }
      }
    },
    "/ordens-servico": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "Listar ordens de serviço",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "tipo", in: "query", schema: { type: "string" } },
          { name: "equipamentoId", in: "query", schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Lista de OSs." }
        }
      },
      post: {
        tags: ["Ordens de Serviço"],
        summary: "[Problema 2] Abertura de Ordem de Serviço (bloqueia equipamento inexistente)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["equipamentoId", "tipo", "responsavel"],
                properties: {
                  equipamentoId: { type: "string", example: "uuid-do-equipamento" },
                  tipo: { type: "string", enum: ["Preventiva", "Corretiva"], example: "Corretiva" },
                  responsavel: { type: "string", example: "Carlos Mecânico Chefe" },
                  status: { type: "string", enum: ["Aberta", "Em andamento", "Finalizada"], example: "Em andamento" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Ordem de serviço aberta com sucesso." },
          404: { description: "[Problema 2] Equipamento inexistente. Cadastro negado." },
          400: { description: "Campos obrigatórios ausentes." }
        }
      }
    },
    "/ordens-servico/{id}": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "Buscar Ordem de Serviço por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Dados da Ordem de Serviço." },
          404: { description: "OS não encontrada." }
        }
      },
      put: {
        tags: ["Ordens de Serviço"],
        summary: "Atualizar Ordem de Serviço (Bloqueia alterações em OS já finalizada)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["Aberta", "Em andamento", "Finalizada"], example: "Finalizada" },
                  responsavel: { type: "string", example: "Marcos Especialista" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "OS atualizada." },
          400: { description: "Tentativa de modificar OS que já está Finalizada." },
          404: { description: "OS não encontrada." }
        }
      },
      delete: {
        tags: ["Ordens de Serviço"],
        summary: "Excluir Ordem de Serviço",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "OS excluída." },
          400: { description: "OS já finalizada não pode ser excluída." }
        }
      }
    },
    "/ordens-servico/{id}/custo-pecas": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "[Problema 8] Calcular o custo total de peças utilizadas em uma OS",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Cálculo detalhado com subtotal, quantidade e valor total consolidado." },
          404: { description: "Ordem de serviço não encontrada." }
        }
      }
    },
    "/defeitos": {
      get: {
        tags: ["Defeitos"],
        summary: "Listar defeitos registrados",
        parameters: [
          { name: "severidade", in: "query", schema: { type: "string" } },
          { name: "equipamentoId", in: "query", schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Lista de defeitos." }
        }
      },
      post: {
        tags: ["Defeitos"],
        summary: "[Problema 5] Registrar defeito (Destaca prioridade crítica)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["equipamentoId", "descricao", "severidade"],
                properties: {
                  equipamentoId: { type: "string", example: "uuid-do-equipamento" },
                  descricao: { type: "string", example: "Sobreaquecimento crítico no motor principal com fumaça." },
                  severidade: { type: "string", enum: ["Baixo", "Médio", "Alto", "Crítico"], example: "Crítico" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Defeito registrado. Se for Crítico, retorna flag e mensagem de prioridade máxima." }
        }
      }
    },
    "/defeitos/criticos": {
      get: {
        tags: ["Defeitos"],
        summary: "[Problema 5] Listar defeitos de alta severidade/críticos",
        responses: {
          200: { description: "Lista de anomalias com severidade 'Crítico' ou 'Alto'." }
        }
      }
    },
    "/defeitos/{id}": {
      get: {
        tags: ["Defeitos"],
        summary: "Buscar defeito por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Dados do defeito." }, 404: { description: "Não encontrado." } }
      },
      put: {
        tags: ["Defeitos"],
        summary: "Atualizar defeito",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  severidade: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Atualizado." } }
      },
      delete: {
        tags: ["Defeitos"],
        summary: "Excluir defeito",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Excluído." } }
      }
    },
    "/manutencoes": {
      get: {
        tags: ["Manutenções Preventivas"],
        summary: "Listar programações de manutenção preventiva",
        responses: { 200: { description: "Lista de programações preventivas." } }
      },
      post: {
        tags: ["Manutenções Preventivas"],
        summary: "Cadastrar programação preventiva para equipamento",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["equipamentoId", "periodicidadeDias", "ultimaManutencao"],
                properties: {
                  equipamentoId: { type: "string" },
                  periodicidadeDias: { type: "integer", example: 30 },
                  ultimaManutencao: { type: "string", format: "date-time", example: "2026-08-01T00:00:00Z" },
                  proximaManutencao: { type: "string", format: "date-time", example: "2026-08-31T00:00:00Z" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Programação criada." } }
      }
    },
    "/manutencoes/vencidas": {
      get: {
        tags: ["Manutenções Preventivas"],
        summary: "[Problema 3] Identificar manutenções preventivas vencidas com alerta operacional",
        description: "Compara a data prevista com o dia atual. Retorna os dias de atraso e mensagem de alerta.",
        responses: { 200: { description: "Lista de manutenções com prazos vencidos." } }
      }
    },
    "/manutencoes/{id}": {
      get: {
        tags: ["Manutenções Preventivas"],
        summary: "Buscar programação preventiva por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Dados da manutenção." } }
      },
      put: {
        tags: ["Manutenções Preventivas"],
        summary: "Atualizar programação preventiva",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  periodicidadeDias: { type: "integer" },
                  ultimaManutencao: { type: "string", format: "date-time" },
                  proximaManutencao: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Atualizado." } }
      },
      delete: {
        tags: ["Manutenções Preventivas"],
        summary: "Excluir programação preventiva",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Excluído." } }
      }
    },
    "/pecas": {
      get: {
        tags: ["Peças Substituídas"],
        summary: "Listar peças substituídas",
        parameters: [
          { name: "codigo", in: "query", schema: { type: "string" } },
          { name: "ordemServicoId", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "Lista de peças." } }
      },
      post: {
        tags: ["Peças Substituídas"],
        summary: "Cadastrar peça substituída na Ordem de Serviço (Bloqueia se OS finalizada)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "codigo", "quantidade", "custoUnitario", "ordemServicoId"],
                properties: {
                  nome: { type: "string", example: "Rolamento Blindado 6205-2RS" },
                  codigo: { type: "string", example: "ROL-6205" },
                  quantidade: { type: "integer", example: 2 },
                  custoUnitario: { type: "number", format: "float", example: 45.50 },
                  ordemServicoId: { type: "string", example: "uuid-da-os" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Peça cadastrada e vinculada à OS." },
          400: { description: "Dados inválidos ou OS já finalizada." },
          404: { description: "OS não encontrada." }
        }
      }
    },
    "/pecas/historico/{codigo}": {
      get: {
        tags: ["Peças Substituídas"],
        summary: "[Problema 4] Consultar histórico de uma peça específica por código",
        description: "Retorna frequência de trocas, total consumido, custo total acumulado e dados de cada OS e máquina envolvida.",
        parameters: [{ name: "codigo", in: "path", required: true, schema: { type: "string", example: "ROL-6205" } }],
        responses: {
          200: { description: "Histórico consolidado da peça ao longo do tempo." }
        }
      }
    },
    "/pecas/{id}": {
      get: {
        tags: ["Peças Substituídas"],
        summary: "Buscar registro de peça por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Dados da peça." } }
      },
      put: {
        tags: ["Peças Substituídas"],
        summary: "Atualizar peça (Bloqueia se OS finalizada)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  codigo: { type: "string" },
                  quantidade: { type: "integer" },
                  custoUnitario: { type: "number" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Atualizado." } }
      },
      delete: {
        tags: ["Peças Substituídas"],
        summary: "Excluir peça (Bloqueia se OS finalizada)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Excluído." } }
      }
    }
  }
};
