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
app.get('/antigos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'antigos.html'));
});
app.get('/resumos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resumos_simples.html'));
});
app.get('/relatorio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'relatorio.html'));
});
// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando no endereço http://localhost:${PORT}`);
});

app.get('/api/portifolio', async (req, res) => {
    const { page = 1, limit = 15, tematica, coordenador, ano, titulo } = req.query;

    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    if (isNaN(pageInt) || isNaN(limitInt) || limitInt <= 0 || pageInt <= 0) {
        return res.status(400).json({ error: 'Os parâmetros de página e limite devem ser números inteiros positivos.' });
    }
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
            c.nome_coordenador,
            p.ano
        FROM 
            portifolio p
        JOIN 
            coordenadores c ON p.coordenador_id = c.coordenador_id
        `;

        const params = [];
        const whereClauses = [];
if (titulo) {
            params.push(`%${titulo}%`);
            whereClauses.push(`p.titulo ILIKE $${params.length}`);
        }
        // filtro por temática
        if (tematica) {
            params.push(`%${tematica}%`);
            whereClauses.push(`p.tematica ILIKE $${params.length}`);
        }

        // filtro por nome do coordenador
        if (coordenador) {
            params.push(`%${coordenador}%`);
            whereClauses.push(`c.nome_coordenador ILIKE $${params.length}`);
        }

        // filtro de ano
        if (ano) {
            console.log('--- [DEBUG] FILTRO DE ANO ATIVADO ---'); // <-- Queremos ver isso
            params.push(ano);
            whereClauses.push(`p.ano = $${params.length}::SMALLINT`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }


        let countQuery = `SELECT COUNT(*) as total FROM portifolio p JOIN coordenadores c ON p.coordenador_id = c.coordenador_id`;

        if (whereClauses.length > 0) {
            countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        const countResult = await pool.query(countQuery, params);

        const totalItems = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalItems / finalLimit);

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
        console.error('--- O SERVIDOR TRAVOU ---', error);
        res.status(500).json({ error: 'Erro no servidor ao obter portfólio.' });
    }
});

// Obter a lista completa de coordenadores
app.get('/api/coordenadores', async (req, res) => {
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
                l.id DESC;
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

app.get('/api/tematicas', async (req, res) => {
    try {
        const query = `
      SELECT DISTINCT tematica 
      FROM portifolio 
      WHERE tematica IS NOT NULL AND tematica <> '' 
      ORDER BY tematica ASC
    `;
        const { rows } = await pool.query(query);

        const tematicas = rows.map(item => item.tematica);
        res.json(tematicas);

    } catch (error) {
        console.error('Erro ao obter temáticas:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter temáticas.' });
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
        res.json(rows);

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
        res.json(rows);

    } catch (error) {
        console.error('Erro ao obter estatísticas por coordenador:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter estatísticas.' });
    }
});

app.get('/api/anos', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT DISTINCT ano FROM portifolio WHERE ano IS NOT NULL ORDER BY ano DESC'
        );

        const anos = rows.map(row => row.ano.toString());
        res.json(anos);

    } catch (error) {
        console.error('Erro ao obter anos:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter anos.' });
    }
});
app.get('/api/resumos-simples', async (req, res) => {
    try {
        const query = `
    SELECT 
        r.id,
        r.titulo,
        r.autores,
        r.link_pdf,
        e.nome AS evento,
        e.link_imagem_fundo
    FROM 
        resumos_simples r
    LEFT JOIN 
        eventos e ON r.evento_id = e.id
    ORDER BY 
        e.nome ASC, r.titulo ASC; -- Alterado: Primeiro agrupa por Evento, depois ordena Títulos
`;

        const { rows } = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar resumos simples:', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar resumos simples.' });
    }
}); app.get('/api/eventos', async (req, res) => {
    try {
        const query = `SELECT id, nome, sigla, link_imagem_fundo FROM eventos ORDER BY nome ASC`;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        res.status(500).json({ error: 'Erro ao buscar eventos.' });
    }
});
app.get('/api/graficos/eventos', async (req, res) => {
    try {
        const query = `
            WITH EventosCount AS (
                SELECT evento, COUNT(id) as total
                FROM produto
                WHERE evento IS NOT NULL
                GROUP BY evento
            ),
            Top10 AS (  -- Mudamos o nome para Top10
                SELECT evento, total, 1 as ordem
                FROM EventosCount
                ORDER BY total DESC
                LIMIT 10  -- AQUI MUDOU: Agora limitamos a 10
            ),
            Outros AS (
                SELECT 'Outros' as evento, SUM(total) as total, 2 as ordem
                FROM EventosCount
                WHERE evento NOT IN (SELECT evento FROM Top10) -- Referência atualizada
                HAVING SUM(total) IS NOT NULL
            )
            SELECT evento, total, ordem FROM Top10
            UNION ALL
            SELECT evento, total, ordem FROM Outros
            ORDER BY ordem ASC, total DESC;
        `;

        const { rows } = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao obter estatísticas por evento:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter estatísticas de eventos.' });
    }
});
app.get('/api/graficos/tipos', async (req, res) => {
    try {
        const query = `
            SELECT 
                tipo_produto, 
                COUNT(id) as total
            FROM 
                produto
            WHERE 
                tipo_produto IS NOT NULL
            GROUP BY 
                tipo_produto
            ORDER BY 
                total DESC;
        `;

        const { rows } = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao obter estatísticas por tipo:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter estatísticas de tipos.' });
    }
});
app.get('/api/graficos/status-produtos', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(DISTINCT p.id) FILTER (WHERE pr.id IS NOT NULL) as com_produto,
                COUNT(DISTINCT p.id) FILTER (WHERE pr.id IS NULL) as sem_produto
            FROM 
                portifolio p
            LEFT JOIN 
                produto pr ON p.id = pr.portifolio_id;
        `;

        const { rows } = await pool.query(query);
        res.json(rows[0]);

    } catch (error) {
        console.error('Erro ao obter status dos produtos:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter status.' });
    }
});
app.get('/api/graficos/eventos-agrupados', async (req, res) => {
    try {
        const query = `
            WITH DadosCategorizados AS (
                SELECT 
                    CASE 
                        -- Agrupa tudo que tem "SIC" seguido de ano ou espaço
                        WHEN evento ILIKE 'SIC %' OR evento ILIKE '% SIC%' THEN 'SIC (Todos)'
                        -- Agrupa as Semanas Nacionais
                        WHEN evento ILIKE '%Semana Nacional de Ciência e Tecnologia%' THEN 'Semana Nacional de C&T(Todos)'
                        -- Mantém o resto como está
                        ELSE evento 
                    END as nome_grupo,
                    COUNT(id) as total
                FROM produto
                WHERE evento IS NOT NULL
                GROUP BY nome_grupo
            ),
            Top10 AS (
                SELECT nome_grupo, total, 1 as ordem
                FROM DadosCategorizados
                ORDER BY total DESC
                LIMIT 10
            ),
            Outros AS (
                SELECT 'Outros' as nome_grupo, SUM(total) as total, 2 as ordem
                FROM DadosCategorizados
                WHERE nome_grupo NOT IN (SELECT nome_grupo FROM Top10)
                HAVING SUM(total) IS NOT NULL
            )
            SELECT nome_grupo as evento, total, ordem FROM Top10
            UNION ALL
            SELECT nome_grupo, total, ordem FROM Outros
            ORDER BY ordem ASC, total DESC;
        `;

        const { rows } = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao obter eventos agrupados:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});
app.get('/api/produtos', async (req, res) => {
    try {
        const { busca } = req.query;
        let query = `
            SELECT 
                p.titulo AS nome_projeto,
                c.nome_coordenador AS nome_professor,
                pr.link_resumo AS link_produto
            FROM produto pr
            INNER JOIN portifolio p ON pr.portifolio_id = p.id
            INNER JOIN coordenadores c ON p.coordenador_id = c.coordenador_id
            WHERE pr.link_resumo IS NOT NULL
        `;

        const params = [];
        if (busca) {
            query += ` AND p.titulo ILIKE $1`;
            params.push(`%${busca}%`);
        }

        query += ` ORDER BY p.titulo ASC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados." });
    }
});

app.get('/api/graficos/anos', async (req, res) => {
    try {
        const query = `
            SELECT 
                ano, 
                COUNT(id) as total
            FROM portifolio
            WHERE ano IS NOT NULL 
            GROUP BY ano
            ORDER BY ano ASC;
        `;

        const { rows } = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao obter estatísticas por ano:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter estatísticas de anos.' });
    }
});

app.get('/api/projetos-antigos', async (req, res) => {
    try {
        const { busca } = req.query;
        let query = `
            SELECT 
                id,
                coordenador,
                titulo,
                data,
                protocolo
            FROM projetos_antigos
        `;

        const params = [];
        
        if (busca) {
            query += ` WHERE titulo ILIKE $1 OR coordenador ILIKE $1`;
            params.push(`%${busca}%`);
        }

        query += ` ORDER BY titulo ASC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados." });
    }
});
export default app;