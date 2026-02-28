import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tierra_esperanza',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDB() {
  try {
    // Verificar conexión al iniciar
    const connection = await pool.getConnection();
    connection.release();
    console.log('MySQL Pool initialized and connection verified');
  } catch (error) {
    console.error('MySQL connection failed during initialization:', error);
    throw error;
  }
}

export async function readDB() {
  const [users] = await pool.query('SELECT * FROM users');
  const [config] = await pool.query('SELECT * FROM config LIMIT 1');
  const [members] = await pool.query('SELECT * FROM members');
  const [transactions] = await pool.query('SELECT * FROM transactions');
  const [board] = await pool.query('SELECT * FROM board');
  const [assemblies] = await pool.query('SELECT * FROM assemblies');
  const [documents] = await pool.query('SELECT * FROM documents');

  // Mapeo de vuelta al formato de objeto único que espera la app
  return {
    users: users,
    config: (config as any[])[0] || {},
    members: members,
    transactions: transactions,
    board: (board as any[]).map(b => ({
      role: b.role,
      primary: { name: b.primary_name, rut: b.primary_rut, phone: b.primary_phone },
      substitute: { name: b.substitute_name, rut: b.substitute_rut, phone: b.substitute_phone }
    })),
    boardPeriod: '2025 - 2027', // Esto podría estar en config
    assemblies: assemblies,
    documents: documents
  };
}

export async function writeDB(data: any) {
  // Esta función es compleja en MySQL porque el frontend envía TODO el estado.
  // En una app real, tendríamos endpoints específicos para cada tabla.
  // Para mantener compatibilidad con la arquitectura actual:
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Actualizar Config
    if (data.config) {
      const c = data.config;
      await connection.query(
        'UPDATE config SET legalName=?, tradeName=?, rut=?, email=?, phone=?, municipalRes=?, legalRes=?, language=?, logoUrl=? WHERE id=1',
        [c.legalName, c.tradeName, c.rut, c.email, c.phone, c.municipalRes, c.legalRes, c.language, c.logoUrl]
      );
    }

    // Para tablas dinámicas (members, transactions, etc.), lo ideal sería sincronizar.
    // Como el frontend envía el estado completo, una forma "bruta" pero efectiva para esta demo
    // es limpiar y reinsertar, o usar ON DUPLICATE KEY UPDATE.

    // Sincronizar Miembros
    if (data.members) {
      for (const m of data.members) {
        await connection.query(
          'INSERT INTO members (id, rut, name, joinDate, status, email, address, comuna, region, phone, photoUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE rut=VALUES(rut), name=VALUES(name), status=VALUES(status), email=VALUES(email), phone=VALUES(phone)',
          [m.id, m.rut, m.name, m.joinDate, m.status, m.email, m.address, m.comuna, m.region, m.phone, m.photoUrl]
        );
      }
    }

    // Sincronizar Transacciones
    if (data.transactions) {
      for (const t of data.transactions) {
        await connection.query(
          'INSERT INTO transactions (id, date, amount, type, paymentMethod, referenceNumber, description, memberId) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE amount=VALUES(amount), description=VALUES(description)',
          [t.id, t.date, t.amount, t.type, t.paymentMethod, t.referenceNumber, t.description, t.memberId]
        );
      }
    }

    // Sincronizar Documentos
    if (data.documents) {
      for (const d of data.documents) {
        await connection.query(
          'INSERT INTO documents (id, folioNumber, year, type, title, date, addressee, subject, content, status, lastUpdate) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE content=VALUES(content), status=VALUES(status), lastUpdate=VALUES(lastUpdate)',
          [d.id, d.folioNumber, d.year, d.type, d.title, d.date, d.addressee, d.subject, d.content, d.status, d.lastUpdate]
        );
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
