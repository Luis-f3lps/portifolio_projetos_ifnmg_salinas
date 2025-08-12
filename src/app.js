import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg'; // Importa o pacote pg
import PDFDocument from 'pdfkit';
import fs from 'fs';
import session from 'express-session';
import bcrypt from 'bcrypt';
import connectPgSimple from 'connect-pg-simple'; // Importa a integração do express-session com o PostgreSQL
import pool from './database.js'; // Importa a pool de conexões do arquivo database.js

// Definindo __filename e __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Carregando variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, 'variaveis.env') }); // Ajuste o caminho conforme necessário
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

// Usando connect-pg-simple para armazenar sessões no PostgreSQL
const PGSession = connectPgSimple(session);

app.use(
  session({
    store: new PGSession({
      pool: pool, // Conexão com o banco PostgreSQL
      tableName: 'session', // Nome da tabela de sessões
    }),
    secret: 'seuSegredo',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Altere para true em produção com HTTPS
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Configurar middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas do servidor
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando no endereço http://localhost:${PORT}`);
});

// Rota para a página Relatório
app.get('/Relatorio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'relatorio.html'));
  });


app.get('/Usuarios', Autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});

app.get('/Produto', Autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Produto.html'));
});

app.get('/MovimentacaoProduto', Autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'MovimentacaoProduto.html'));
});

app.get('/EditarMovimentacoes', Autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'EditarMovimentacoes.html'));
});

app.get('/Inventario', Autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Inventario.html'));
});

app.get('/Laboratorio', Autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'laboratorio.html'));
});


// Endpoint para buscar consumos

app.get('/api/consumos', Autenticado, async (req, res) => {
  try {
    const { startDate, endDate, laboratorio } = req.query;

    // Validação do formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if ((startDate && !dateRegex.test(startDate)) || (endDate && !dateRegex.test(endDate))) {
      return res.status(400).json({ error: 'As datas devem estar no formato YYYY-MM-DD.' });
    }

    // Validação do intervalo de datas
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'A data de início não pode ser posterior à data de término.' });
    }

    let query = `
      SELECT 
        rc.id_consumo, 
        rc.data_consumo, 
        e.sigla, 
        e.nome_produto, 
        l.nome_laboratorio, 
        rc.quantidade, 
        e.tipo_unidade_produto, 
        rc.descricao 
      FROM 
        registro_consumo rc 
      JOIN 
        produto e ON rc.id_produto = e.id_produto 
      JOIN 
        laboratorio l ON rc.id_laboratorio = l.id_laboratorio
    `;

    const params = [];
    const whereClauses = [];

    // Filtrar por intervalo de datas
    if (startDate && endDate) {
      whereClauses.push('rc.data_consumo BETWEEN $1 AND $2');
      params.push(startDate, endDate);
    }

    // Filtrar por laboratório
    if (laboratorio && laboratorio !== 'todos') {
      whereClauses.push(`rc.id_laboratorio = $${params.length + 1}`);
      params.push(laboratorio);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY rc.data_consumo DESC;';

    // Executar a consulta
    const { rows: consumos } = await pool.query(query, params);

    // Retornar resultados
    res.json(consumos.length ? consumos : []);  // Retornar array vazio se não houver resultados
  } catch (error) {
    console.error('Erro ao buscar consumos:', error);
    res.status(500).json({ error: 'Erro ao buscar consumos' });
  }
});
  
  // Endpoint para buscar siglas
  app.get('/api/siglas', Autenticado, async (req, res) => {
    try {
      const { rows: siglas } = await pool.query(
        'SELECT id_produto, sigla FROM produto'
      );
  
      // Retorna um array vazio se não houver siglas
      res.json(siglas.length ? siglas : []);
    } catch (error) {
      console.error('Erro ao buscar siglas:', error);
      res.status(500).json({ error: 'Erro ao buscar siglas.' });
    }
  });
  
  app.post('/api/atualizar-responsavel', Autenticado, async (req, res) => {
    const { idLaboratorio, usuarioEmail } = req.body;
  
    if (!idLaboratorio || !usuarioEmail) {
      return res.status(400).json({ error: 'ID do laboratório e email do responsável são obrigatórios.' });
    }
  
    // Validação básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuarioEmail)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }
  
    try {
      // Verificar se o usuário existe
      const userResult = await pool.query('SELECT * FROM usuario WHERE email = $1', [usuarioEmail]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'O email do usuário não existe.' });
      }
  
      // Atualizar o responsável do laboratório
      const result = await pool.query(
        'UPDATE laboratorio SET usuario_email = $1 WHERE id_laboratorio = $2',
        [usuarioEmail, idLaboratorio]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Laboratório não encontrado.' });
      }
  
      res.json({ message: 'Responsável atualizado com sucesso', updatedResponsible: usuarioEmail });
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      res.status(500).json({ error: 'Erro no servidor ao atualizar responsável.' });
    }
  });
  


app.get('/api/produtoPag', Autenticado, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
  
    // Converter page e limit para inteiros
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
  
    if (isNaN(pageInt) || isNaN(limitInt) || limitInt <= 0 || pageInt <= 0) {
        return res.status(400).json({ error: 'Os parâmetros de página e limite devem ser números inteiros positivos.' });
    }
  
    // Limite máximo para o número de itens por página
    const MAX_LIMIT = 100;
    const finalLimit = Math.min(limitInt, MAX_LIMIT);
  
    const offset = (pageInt - 1) * finalLimit;
  
    try {
        // Consulta com paginação
        const [rows] = await connection.query(`
            SELECT sigla, concentracao, densidade, nome_produto, quantidade, tipo_unidade_produto, ncm
            FROM produto
            LIMIT ? OFFSET ?`, [finalLimit, offset]);
  
        // Conta o total de registros
        const [countResult] = await connection.query('SELECT COUNT(*) as total FROM produto');
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / finalLimit);
  
        res.json({
            data: rows,
            totalItems,
            totalPages,
            currentPage: pageInt,
        });
    } catch (error) {
        console.error('Erro ao obter produtos:', error);
        res.status(500).json({ error: 'Erro no servidor ao obter produtos.' });
    }
  });
  

// Obter registros de entrada com filtros de data
// Obter registros de entrada sem paginação
app.get('/api/tabelaregistraentradaInico', Autenticado, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validação do formato de data (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if ((startDate && !dateRegex.test(startDate)) || (endDate && !dateRegex.test(endDate))) {
            return res.status(400).json({ error: 'As datas devem estar no formato YYYY-MM-DD.' });
        }

        let query = `
            SELECT 
                r.id_entrada, 
                r.data_entrada, 
                r.quantidade, 
                e.nome_produto, 
                r.descricao
            FROM registro_entrada r
            JOIN produto e ON r.id_produto = e.id_produto
        `;
        
        const params = [];
        if (startDate && endDate) {
            query += ' WHERE r.data_entrada BETWEEN $1 AND $2'; // Usando placeholders do PostgreSQL
            params.push(startDate, endDate);
        }

        query += ' ORDER BY r.data_entrada DESC';

        // Usando pool.query() para executar a consulta no PostgreSQL
        const { rows } = await pool.query(query, params); // Correção aqui

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar registros de entrada:', error);
        res.status(500).json({ error: 'Erro ao buscar registros de entrada' });
    }
});

app.get('/api/tabelaregistraentrada', Autenticado, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    // Validação de página e limite
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    if (isNaN(pageInt) || pageInt <= 0 || isNaN(limitInt) || limitInt <= 0) {
      return res.status(400).json({ error: 'Os parâmetros de página e limite devem ser números inteiros positivos.' });
    }

    // Limitar o limite de itens por página
    const MAX_LIMIT = 100;
    const finalLimit = limitInt > MAX_LIMIT ? MAX_LIMIT : limitInt;

    const offset = (pageInt - 1) * finalLimit;

    // Validação do formato das datas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if ((startDate && !dateRegex.test(startDate)) || (endDate && !dateRegex.test(endDate))) {
      return res.status(400).json({ error: 'As datas devem estar no formato YYYY-MM-DD.' });
    }

    let query = `
      SELECT 
        r.id_entrada, 
        r.data_entrada, 
        r.quantidade, 
        e.nome_produto, 
        r.descricao
      FROM registro_entrada r
      JOIN produto e ON r.id_produto = e.id_produto
    `;
    
    const params = [];
    if (startDate && endDate) {
      query += ' WHERE r.data_entrada BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    query += ` ORDER BY r.data_entrada DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(finalLimit, offset);

    // Executar a query para obter os dados
    const { rows } = await pool.query(query, params);

    // Obter o total de registros
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM registro_entrada r 
      JOIN produto e ON r.id_produto = e.id_produto
    `;

    const countParams = [];
    if (startDate && endDate) {
      countQuery += ' WHERE r.data_entrada BETWEEN $1 AND $2';
      countParams.push(startDate, endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalItems / finalLimit);

    res.json({
      data: rows,
      totalItems,
      totalPages,
      currentPage: pageInt,
    });
  } catch (error) {
    console.error('Erro ao buscar registros de entrada:', error);
    res.status(500).json({ error: 'Erro ao buscar registros de entrada' });
  }
});
  
app.get('/api/tabelaregistraConsumo', Autenticado, async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 20 } = req.query;

        // Validação de página e limite
        const pageInt = parseInt(page, 10);
        const limitInt = parseInt(limit, 10);

        if (isNaN(pageInt) || pageInt <= 0 || isNaN(limitInt) || limitInt <= 0) {
            return res.status(400).json({ error: 'Os parâmetros de página e limite devem ser números inteiros positivos.' });
        }

        // Limitar o limite de itens por página
        const MAX_LIMIT = 100;
        const finalLimit = limitInt > MAX_LIMIT ? MAX_LIMIT : limitInt;

        const offset = (pageInt - 1) * finalLimit;

        // Validação de formato de data (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if ((startDate && !dateRegex.test(startDate)) || (endDate && !dateRegex.test(endDate))) {
            return res.status(400).json({ error: 'As datas devem estar no formato YYYY-MM-DD.' });
        }

        let query = `
            SELECT 
                rc.id_consumo, 
                rc.data_consumo, 
                e.sigla, 
                e.nome_produto, 
                l.nome_laboratorio, 
                rc.quantidade, 
                e.tipo_unidade_produto, 
                rc.descricao 
            FROM 
                registro_consumo rc 
            JOIN 
                produto e ON rc.id_produto = e.id_produto 
            JOIN 
                laboratorio l ON rc.id_laboratorio = l.id_laboratorio
        `;

        const params = [];
        if (startDate && endDate) {
            query += ' WHERE rc.data_consumo BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY rc.data_consumo DESC LIMIT $3 OFFSET $4';
        params.push(finalLimit, offset);

        const result = await pool.query(query, params); // Usando pool para execução da consulta

        // Contar o total de registros
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM registro_consumo rc 
            JOIN produto e ON rc.id_produto = e.id_produto
            JOIN laboratorio l ON rc.id_laboratorio = l.id_laboratorio
            ${startDate && endDate ? 'WHERE rc.data_consumo BETWEEN $1 AND $2' : ''}
        `;
        
        const countParams = startDate && endDate ? [startDate, endDate] : [];
        const countResult = await pool.query(countQuery, countParams); // Contando o total de registros

        const totalItems = countResult.rows[0].total;
        const totalPages = Math.ceil(totalItems / finalLimit);

        res.json({
            data: result.rows,
            totalItems,
            totalPages,
            currentPage: pageInt,
        });
    } catch (error) {
        console.error('Erro ao buscar registros de consumo:', error);
        res.status(500).json({ error: 'Erro ao buscar registros de consumo' });
    }
});

  app.post('/api/filter_records', Autenticado, async (req, res) => {
    try {
      const { startDate, endDate } = req.body; 
  
      // Verifica se as datas são fornecidas
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Data inicial e final são obrigatórias.' });
      }
  
      // Validação de formato de data (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({ error: 'Formato de data inválido. Utilize a data no formato YYYY-MM-DD.' });
      }
  
      // Converte as datas para objetos Date
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ error: 'Formato de data inválido.' });
      }
  
      // Verifica se a data final é posterior à data inicial
      if (start > end) {
        return res.status(400).json({ error: 'A data final não pode ser anterior à data inicial.' });
      }
  
      // Consulta para filtrar registros entre as datas
      const query = `
        SELECT r.id_entrada, r.data_entrada, r.quantidade, e.nome_produto, r.descricao
        FROM registro_entrada r
        JOIN produto e ON r.id_produto = e.id_produto
        WHERE r.data_entrada BETWEEN ? AND ?
        ORDER BY r.data_entrada DESC
      `;
  
      const [rows] = await pool.execute(query, [startDate, endDate]); // Alterado para usar pool
  
      // Retorna os registros encontrados
      res.status(200).json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      console.error('Erro ao filtrar registros:', error);
      res.status(500).json({ error: 'Erro ao filtrar registros.' });
    }
  });
  

export default app;
