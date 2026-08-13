# SIME - Sistema Integrado de Monitorização Escolar

Sistema completo para gestão e monitorização do ecossistema escolar de Angola (Educa Mais+).

## Funcionalidades

### Módulos Principais
- **Dashboard Principal** - Visão geral do sistema com estatísticas e gráficos
- **Pesquisa de Escolas** - Busca e filtragem de instituições de ensino
- **Gestão de Instituições** - CRUD completo de escolas
- **Gestão de Alunos** - Registo e acompanhamento de alunos
- **Gestão de Professores** - Cadastro de docentes
- **Gestão de Turmas** - Organização de turmas por ano letivo
- **Matrículas Online** - Processo de matrícula escolar
- **Área do Encarregado** - Acesso para pais/responsáveis
- **Estatísticas** - Análises e relatórios detalhados
- **Relatórios** - Relatório de ocupação e indicadores

### Perfis de Utilizador
- **Admin** - Acesso total; aprova instituições e Encarregados; envia email de aprovação
- **Instituição** - Gestão da própria escola, vagas, turmas, imagens e logotipo
- **Encarregado** - Consulta escolas, vagas e solicita matrículas (conta pendente até aprovação)

## Tecnologias Utilizadas

### Backend
- Node.js + Express
- MongoDB (Mongoose/driver oficial) - base de dados principal
- JWT para autenticação
- bcryptjs para hashing de senhas
- Brevo API (email transacional: verificação e recuperação de senha)
- Multer (upload de imagens de instituições)

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (ícones)
- Axios (comunicação HTTP)

## Estrutura do Projeto

```
sime_ecossistema_escolar/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── init-db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── alunoController.js
│   │   ├── dashboardController.js
│   │   ├── encarregadoController.js
│   │   ├── instituicaoController.js
│   │   ├── matriculaController.js
│   │   ├── professorController.js
│   │   └── turmaController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   ├── routes/
│   │   ├── alunos.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── encarregados.js
│   │   ├── instituicoes.js
│   │   ├── matriculas.js
│   │   ├── professores.js
│   │   └── turmas.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Alert.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── Header.jsx
    │   │   ├── Layout.jsx
    │   │   ├── Loading.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── StatsCard.jsx
    │   │   └── StatusChip.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Alunos.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── DetalhesInstituicao.jsx
    │   │   ├── Encarregados.jsx
    │   │   ├── Estatisticas.jsx
    │   │   ├── Instituicoes.jsx
    │   │   ├── Login.jsx
    │   │   ├── Matriculas.jsx
    │   │   ├── PesquisarEscolas.jsx
    │   │   ├── Professores.jsx
    │   │   ├── Relatorios.jsx
    │   │   └── Turmas.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## Instalação e Configuração

### Pré-requisitos
- Node.js (v16+)
- npm ou yarn

### Backend

1. Acesse a pasta do backend:
```bash
cd D:\sime_ecossistema_escolar\backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o ficheiro `.env` (MongoDB, JWT e chave Brevo).

4. (Opcional) Reset total da base remota com re-seed de demonstração:
```bash
node reset-db.js
```

5. Inicie o servidor:
```bash
npm start
```

O backend estará disponível em `http://localhost:3001`

### Frontend

1. Acesse a pasta do frontend:
```bash
cd D:\sime_ecossistema_escolar\frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## Utilizadores de Teste

| Utilizador | Senha | Perfil |
|------------|-------|--------|
| venancio | Venancio@2026 | Administrador (aprova instituições e Encarregados) |
| gestor.demonstracao | Demo@2026 | Gestor da Escola de Demonstração SIME |

- A base contém **apenas** a instituição de demonstração "Escola de Demonstração SIME" (Ensino Médio, Huambo), com turmas da 7ª à 12ª Classe e calendário escolar.
- Tipos de ensino suportados: Pré-Escolar, Primário e Médio (sem Ensino Superior).
- Novas contas (instituições e Encarregados) exigem validação por email/SMS e ficam **pendentes de aprovação** pelo administrador.
- Recuperação de palavra-passe disponível no ecrã de login ("Esqueceu a palavra-passe?").

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login (bloqueia utilizadores não aprovados)
- `POST /api/auth/register` - Registar utilizador (exige email/telefone verificados)
- `POST /api/auth/solicitar-verificacao` - Enviar código de verificação (email/SMS)
- `POST /api/auth/verificar-codigo` - Confirmar código de verificação
- `POST /api/auth/esqueci-senha` - Enviar código de recuperação de senha
- `POST /api/auth/redefinir-senha` - Redefinir senha com token

### Instituições
- `GET /api/instituicoes` - Listar instituições
- `GET /api/instituicoes/:id` - Detalhes da instituição
- `POST /api/instituicoes` - Criar instituição
- `PUT /api/instituicoes/:id` - Atualizar instituição
- `DELETE /api/instituicoes/:id` - Eliminar instituição
- `POST /api/instituicoes/:id/imagem` - Enviar imagem (admin/instituição dona)
- `POST /api/instituicoes/:id/logotipo` - Enviar logotipo (admin/instituição dona)
- `GET /api/instituicoes/:id/estatisticas` - Estatísticas da instituição

### Alunos
- `GET /api/alunos` - Listar alunos
- `GET /api/alunos/:id` - Detalhes do aluno
- `POST /api/alunos` - Criar aluno
- `PUT /api/alunos/:id` - Atualizar aluno
- `DELETE /api/alunos/:id` - Eliminar aluno

### Professores
- `GET /api/professores` - Listar professores
- `GET /api/professores/:id` - Detalhes do professor
- `POST /api/professores` - Criar professor
- `PUT /api/professores/:id` - Atualizar professor
- `DELETE /api/professores/:id` - Eliminar professor

### Turmas
- `GET /api/turmas` - Listar turmas
- `GET /api/turmas/:id` - Detalhes da turma
- `POST /api/turmas` - Criar turma
- `PUT /api/turmas/:id` - Atualizar turma
- `DELETE /api/turmas/:id` - Eliminar turma

### Matrículas
- `GET /api/matriculas` - Listar matrículas
- `POST /api/matriculas` - Criar matrícula
- `PUT /api/matriculas/:id/cancelar` - Cancelar matrícula

### Encarregados
- `GET /api/encarregados` - Listar encarregados
- `GET /api/encarregados/:id` - Detalhes do encarregado
- `POST /api/encarregados` - Criar encarregado
- `PUT /api/encarregados/:id` - Atualizar encarregado
- `DELETE /api/encarregados/:id` - Eliminar encarregado

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/provincia` - Estatísticas provinciais
- `GET /api/dashboard/ocupacao` - Relatório de ocupação

## Design System

O design segue o padrão definido no DESIGN.md:
- **Cor Principal**: Azul (#2196F3)
- **Cor Institucional**: Azul Escuro (#0D47A1)
- **Sucesso**: Verde (#4CAF50)
- **Aviso**: Laranja (#FF9800)
- **Erro**: Vermelho (#F44336)
- **Tipografia**: Inter
- **Border Radius**: 8px padrão

## Licença

Desenvolvido para o projeto SIME (Educa Mais+) - Sistema Integrado de Monitorização Escolar, República de Angola.