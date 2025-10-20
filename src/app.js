import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './database.js'; // Importa a pool de conexões do arquivo database.js

// Definindo __filename e __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregando variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, 'variaveis.env') }); 
console.log({
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
});

const app = express();

// Testando a conexão ao banco de dados
(async () => {
  try {
    await pool.query('SELECT NOW()'); // Consulta simples para testar a conexão
    console.log('Conexão bem-sucedida ao banco de dados!');
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
})();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas do servidor
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/livros', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'livros.html'));
});
app.get('/artigos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'artigos.html'));
});
// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando no endereço http://localhost:${PORT}`);
});

// Obter lista paginada de projetos do portfólio (com filtros)
app.get('/api/portifolio', async (req, res) => { // 'Autenticado' foi removido daqui
   // Parâmetros de paginação e filtros
   // O limit = 10 aqui já define 10 como padrão
   const { page = 1, limit = 15, tematica, coordenador } = req.query;

   // Validação dos parâmetros de paginação
   const pageInt = parseInt(page, 10);
   const limitInt = parseInt(limit, 10);

   if (isNaN(pageInt) || isNaN(limitInt) || limitInt <= 0 || pageInt <= 0) {
     return res.status(400).json({ error: 'Os parâmetros de página e limite devem ser números inteiros positivos.' });
   }

   // Limite máximo de itens por página
   const MAX_LIMIT = 100;
   const finalLimit = Math.min(limitInt, MAX_LIMIT);
   const offset = (pageInt - 1) * finalLimit;

   try {
     let query = `
       SELECT 
         p.id,
         p.processo,
         p.titulo,
         p.tematica,
         c.nome_coordenador
       FROM 
         portifolio p
       JOIN 
         coordenadores c ON p.coordenador_id = c.coordenador_id
     `;
     
     const params = [];
     const whereClauses = [];

     // Adiciona filtro por temática (busca parcial, case-insensitive)
     if (tematica) {
       params.push(`%${tematica}%`);
       whereClauses.push(`p.tematica ILIKE $${params.length}`);
     }

     // Adiciona filtro por nome do coordenador (busca parcial, case-insensitive)
     if (coordenador) {
       params.push(`%${coordenador}%`);
       whereClauses.push(`c.nome_coordenador ILIKE $${params.length}`);
     }

     if (whereClauses.length > 0) {
       query += ` WHERE ${whereClauses.join(' AND ')}`;
     }
     
     // --- Contagem do total de itens com os filtros aplicados ---
     let countQuery = `SELECT COUNT(*) as total FROM portifolio p JOIN coordenadores c ON p.coordenador_id = c.coordenador_id`;
     if (whereClauses.length > 0) {
       countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
     }
     const countResult = await pool.query(countQuery, params);
     const totalItems = parseInt(countResult.rows[0].total, 15);
     const totalPages = Math.ceil(totalItems / finalLimit);
     
     // --- Adiciona ordenação e paginação à consulta principal ---
     // CORREÇÃO: Usando LOWER(p.titulo) para ordenação case-insensitive
     query += ` ORDER BY LOWER(p.titulo) ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
     params.push(finalLimit, offset);

     const { rows } = await pool.query(query, params);

     res.json({
       data: rows,
       totalItems,
       totalPages,
       currentPage: pageInt,
     });
   } catch (error) {
     console.error('Erro ao obter portfólio:', error);
     res.status(500).json({ error: 'Erro no servidor ao obter portfólio.' });
   }
});

// Obter a lista completa de coordenadores
app.get('/api/coordenadores', async (req, res) => { // 'Autenticado' foi removido daqui
    try {
        const { rows } = await pool.query('SELECT * FROM coordenadores ORDER BY nome_coordenador ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter coordenadores:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter coordenadores.' });
    }
});

// Rota para obter a lista de livros com os nomes dos coordenadores
app.get('/api/livros', async (req, res) => {
    try {
        const query = `
            SELECT 
                l.id,
                l.titulo,
                l.descricao,
                l.link_livro,
                l.link_capa,
                c.nome_coordenador
            FROM 
                livro l
            JOIN 
                coordenadores c ON l.coordenador_id = c.coordenador_id
            WHERE 
                l.link_capa IS NOT NULL AND l.link_capa != '' -- Adicionado este filtro
            ORDER BY 
                l.id;
        `;
        
        const { rows } = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar livros.' });
    }
});

// Rota para obter a lista de artigos com seus autores
app.get('/api/artigos', async (req, res) => {
    try {
        // A função STRING_AGG agrupa os nomes dos autores de um mesmo artigo, separados por vírgula
        const query = `
            SELECT 
                a.id,
                a.titulo,
                a.link_artigo,
                STRING_AGG(c.nome_coordenador, ', ') AS autores
            FROM 
                artigos a
            LEFT JOIN 
                artigo_autor aa ON a.id = aa.artigo_id
            LEFT JOIN 
                coordenadores c ON aa.coordenador_id = c.coordenador_id
            GROUP BY 
                a.id, a.titulo, a.link_artigo
            ORDER BY 
                a.titulo ASC;
        `;
        
        const { rows } = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar artigos:', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar artigos.' });
    }
});

// ROTA PARA DADOS DO GRÁFICO DE TEMÁTICAS
app.get('/api/stats/tematicas', async (req, res) => {
    try {
        const query = `
            SELECT 
                tematica, 
                COUNT(*) as total_projetos
            FROM 
                portifolio
            WHERE
                tematica IS NOT NULL AND tematica <> ''
            GROUP BY 
                tematica
            ORDER BY 
                total_projetos DESC;
        `;

        const { rows } = await pool.query(query);
        res.json(rows); // Retorna um array como: [{ tematica: 'IA', total_projetos: '10' }, ...]

    } catch (error) {
        console.error('Erro ao obter estatísticas por temática:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter estatísticas.' });
    }
});
// ROTA PARA DADOS DO GRÁFICO DE COORDENADORES
app.get('/api/stats/coordenadores', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.nome_coordenador, 
                COUNT(p.id) as total_projetos
            FROM 
                portifolio p
            JOIN 
                coordenadores c ON p.coordenador_id = c.coordenador_id
            GROUP BY 
                c.nome_coordenador
            ORDER BY 
                total_projetos DESC;
        `;

        const { rows } = await pool.query(query);
        // Retorna um array como: [{ nome_coordenador: 'Ana Silva', total_projetos: '5' }, ...]
        res.json(rows);

    } catch (error) {
        console.error('Erro ao obter estatísticas por coordenador:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter estatísticas.' });
    }
});
export default app;