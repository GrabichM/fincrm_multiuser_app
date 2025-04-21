require('dotenv').config();
const { Pool } = require('pg');

// Pool-Instanz erstellen
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Testverbindung zur Datenbank
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Erfolgreich mit der PostgreSQL-Datenbank verbunden!');
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Serverzeit:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Fehler bei der Verbindung zur Datenbank:', error.message);
  }
}

testConnection();
