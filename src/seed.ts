import prisma from './config/prisma';

async function seed() {
  console.log('🔄 Iniciando carga de dados (Seed) para demonstração da API...');

  // Limpeza prévia segura respeitando a integridade
  await prisma.pecaSubstituida.deleteMany();
  await prisma.ordemServico.deleteMany();
  await prisma.defeito.deleteMany();
  await prisma.manutencaoPreventiva.deleteMany();
  await prisma.equipamento.deleteMany();

  console.log('🧹 Banco limpo com sucesso.');

  // 1. Equipamentos
  const tornoCNC = await prisma.equipamento.create({
    data: {
      nome: 'Torno CNC Multifuncional',
      modelo: 'Galaxy 30M',
      fabricante: 'Romi',
      dataInstalacao: new Date('2022-03-15T08:00:00Z'),
      status: 'Ativo',
    },
  });

  const prensa = await prisma.equipamento.create({
    data: {
      nome: 'Prensa Hidráulica 200T',
      modelo: 'PH-200 Heavy',
      fabricante: 'Schuler',
      dataInstalacao: new Date('2021-08-20T10:00:00Z'),
      status: 'Em manutenção', // Para demonstrar o Problema 7
    },
  });

  const roboSolda = await prisma.equipamento.create({
    data: {
      nome: 'Robô Industrial de Solda',
      modelo: 'IRB 2600',
      fabricante: 'ABB',
      dataInstalacao: new Date('2023-01-10T09:30:00Z'),
      status: 'Ativo',
    },
  });

  const esteira = await prisma.equipamento.create({
    data: {
      nome: 'Esteira Transportadora de Cavacos',
      modelo: 'ETC-100',
      fabricante: 'Rexnord',
      dataInstalacao: new Date('2020-05-12T14:00:00Z'),
      status: 'Inativo',
    },
  });

  console.log('✅ Equipamentos cadastrados.');

  // 2. Ordens de Serviço
  const osAberta = await prisma.ordemServico.create({
    data: {
      equipamentoId: tornoCNC.id,
      tipo: 'Corretiva',
      responsavel: 'Carlos Alberto (Especialista Mecânico)',
      status: 'Em andamento',
      dataAbertura: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
    },
  });

  const osFinalizada = await prisma.ordemServico.create({
    data: {
      equipamentoId: prensa.id,
      tipo: 'Preventiva',
      responsavel: 'Mariana Lima (Engenheira de Manutenção)',
      status: 'Finalizada',
      dataAbertura: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      dataConclusao: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Ordens de Serviço cadastradas.');

  // 3. Peças Substituídas (Demonstração do Problema 4 - Histórico por Código, e Problema 8 - Custo Total)
  // Peça ROL-6205 instalada no Torno CNC (OS Aberta)
  await prisma.pecaSubstituida.create({
    data: {
      nome: 'Rolamento de Precisão Cônico',
      codigo: 'ROL-6205',
      quantidade: 2,
      custoUnitario: 145.50,
      ordemServicoId: osAberta.id,
    },
  });

  // Retentor para o Torno CNC (OS Aberta)
  await prisma.pecaSubstituida.create({
    data: {
      nome: 'Retentor de Óleo Viton',
      codigo: 'RET-0042',
      quantidade: 4,
      custoUnitario: 35.00,
      ordemServicoId: osAberta.id,
    },
  });

  // Peça ROL-6205 também instalada anteriormente na Prensa (OS Finalizada) para evidenciar histórico acumulado!
  await prisma.pecaSubstituida.create({
    data: {
      nome: 'Rolamento de Precisão Cônico',
      codigo: 'ROL-6205',
      quantidade: 4,
      custoUnitario: 140.00,
      ordemServicoId: osFinalizada.id,
    },
  });

  console.log('✅ Peças cadastradas com histórico compartilhado do código ROL-6205.');

  // 4. Defeitos (Demonstração do Problema 5 - Criticidade)
  await prisma.defeito.create({
    data: {
      equipamentoId: prensa.id,
      descricao: 'Vazamento de fluido em alta pressão no bloco manifold com perda de força.',
      severidade: 'Crítico', // Problema 5
    },
  });

  await prisma.defeito.create({
    data: {
      equipamentoId: tornoCNC.id,
      descricao: 'Vibração excessiva acima de 3000 RPM no cabeçote.',
      severidade: 'Médio',
    },
  });

  console.log('✅ Defeitos cadastrados (incluindo defeito Crítico).');

  // 5. Manutenções Preventivas (Demonstração do Problema 3 - Vencidas)
  // Manutenção VENCIDA (próxima data no passado)
  const dataPassada = new Date();
  dataPassada.setDate(dataPassada.getDate() - 12); // Vencida há 12 dias

  await prisma.manutencaoPreventiva.create({
    data: {
      equipamentoId: prensa.id,
      periodicidadeDias: 60,
      ultimaManutencao: new Date('2026-06-01T08:00:00Z'),
      proximaManutencao: dataPassada,
    },
  });

  // Manutenção EM DIA (próxima data no futuro)
  const dataFutura = new Date();
  dataFutura.setDate(dataFutura.getDate() + 25); // Vence daqui a 25 dias

  await prisma.manutencaoPreventiva.create({
    data: {
      equipamentoId: roboSolda.id,
      periodicidadeDias: 90,
      ultimaManutencao: new Date(),
      proximaManutencao: dataFutura,
    },
  });

  console.log('✅ Manutenções Preventivas cadastradas (incluindo vencida com alerta).');
  console.log('🎉 Carga inicial (Seed) concluída com sucesso!');
}

seed()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
