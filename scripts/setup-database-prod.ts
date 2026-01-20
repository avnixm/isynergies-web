import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { adminUsers } from '../app/db/schema';
import { eq } from 'drizzle-orm';
import * as schema from '../app/db/schema';

const execAsync = promisify(exec);

// Prefer environment variables; fall back to known production defaults
const PROD_DB_CONFIG = {
  host: process.env.DB_HOST ?? 'isyn-cieloes.l.aivencloud.com',
  port: Number(process.env.DB_PORT ?? 26771),
  user: process.env.DB_USER ?? 'avnadmin',
  password: process.env.DB_PASSWORD ?? 'AVNS_nTTBVH-I7yN49JekEuK',
  database: process.env.DB_NAME ?? 'defaultdb',
  ssl:
    (process.env.DB_SSL ?? 'true') === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
};

async function pushSchema() {
  console.log('📦 Pushing database schema to Aiven MySQL...');
  try {
    // Set environment variables for drizzle-kit
    process.env.DB_HOST = PROD_DB_CONFIG.host;
    process.env.DB_PORT = String(PROD_DB_CONFIG.port);
    process.env.DB_USER = PROD_DB_CONFIG.user;
    process.env.DB_PASSWORD = PROD_DB_CONFIG.password;
    process.env.DB_NAME = PROD_DB_CONFIG.database;
    process.env.DB_SSL = PROD_DB_CONFIG.ssl ? 'true' : 'false';
    
    const { stdout, stderr } = await execAsync('npx drizzle-kit push', {
      cwd: process.cwd(),
      env: process.env,
    });
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      // drizzle-kit sometimes outputs to stderr even on success
      if (!stderr.includes('error') && !stderr.includes('Error')) {
        console.log(stderr);
      } else {
        throw new Error(stderr);
      }
    }
    console.log('✅ Schema pushed successfully to production database!\n');
    return true;
  } catch (error: any) {
    console.error('❌ Error pushing schema:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function createDefaultAdmin() {
  console.log('👤 Creating default admin user in production database...');
  
  let pool;
  let db;
  
  try {
    // Create connection pool
    pool = mysql.createPool(PROD_DB_CONFIG);
    db = drizzle(pool, { schema, mode: 'default' });
    
    // Hash for password 'admin'
    const hashedPassword = '$2b$10$E.IS0qmOstLphqDhsTaCH.vuQcWcDOZ5GwbETQsuQndvBbBbP8cIK';
    
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, 'admin'))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user "admin" already exists in production database');
      console.log('Username: admin');
      console.log('Password: admin');
      console.log('Email: admin@isynergies.com');
      return false;
    }
    
    await db.insert(adminUsers).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@isynergies.com',
    });
    
    console.log('✅ Admin user created successfully in production database!');
    console.log('📋 Login Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin');
    console.log('  Email: admin@isynergies.com');
    console.log('  URL: https://your-domain.com/admin/login');
    
    return true;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
      console.log('⚠️  Admin user "admin" already exists in production database');
      console.log('Username: admin');
      console.log('Password: admin');
      return false;
    }
    console.error('❌ Error creating admin:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

async function setupProductionDatabase() {
  try {
    console.log('🚀 Starting production database setup...\n');
    console.log('📍 Target: Aiven for MySQL (Production)\n');
    
    // Step 1: Push schema
    await pushSchema();
    
    // Step 2: Create default admin
    await createDefaultAdmin();
    
    console.log('\n✅ Production database setup completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Production database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupProductionDatabase();

