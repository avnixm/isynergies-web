const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertAdmin() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'isynergies',
    });

    console.log('✅ Connected to database');

    // Insert admin user
    const [result] = await connection.execute(
      `INSERT INTO admin_users (username, password, email, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [
        'nikka',
        '$2b$10$E.IS0qmOstLphqDhsTaCH.vuQcWcDOZ5GwbETQsuQndvBbBbP8cIK',
        'nikka@isynergies.com'
      ]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📊 Insert ID:', result.insertId);
    console.log('');
    console.log('Login Credentials:');
    console.log('  Username: nikka');
    console.log('  Password: admin');
    console.log('  URL: http://localhost:3000/admin/login');

    // Verify
    const [rows] = await connection.execute(
      'SELECT id, username, email FROM admin_users WHERE username = ?',
      ['nikka']
    );
    
    console.log('\n✅ Verification:');
    console.log(rows);

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  User "nikka" already exists in database');
      console.log('Login Credentials:');
      console.log('  Username: nikka');
      console.log('  Password: admin');
      console.log('  URL: http://localhost:3000/admin/login');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

insertAdmin();

