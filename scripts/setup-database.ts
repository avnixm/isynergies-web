import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '../app/db';
import { adminUsers } from '../app/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const execAsync = promisify(exec);

async function pushSchema() {
  console.log('📦 Pushing database schema...');
  try {
    const { stdout, stderr } = await execAsync('npx drizzle-kit push', {
      cwd: process.cwd(),
      env: process.env,
    });
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      
      if (!stderr.includes('error') && !stderr.includes('Error')) {
        console.log(stderr);
      } else {
        throw new Error(stderr);
      }
    }
    console.log('✅ Schema pushed successfully!\n');
    return true;
  } catch (error: any) {
    console.error('❌ Error pushing schema:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function createDefaultAdmin() {
  console.log('👤 Creating default admin user...');
  
  try {
    
    const hashedPassword = '$2b$10$E.IS0qmOstLphqDhsTaCH.vuQcWcDOZ5GwbETQsuQndvBbBbP8cIK';
    
    
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, 'admin'))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user "admin" already exists');
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
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Login Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin');
    console.log('  Email: admin@isynergies.com');
    console.log('  URL: http://localhost:3000/admin/login');
    return true;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
      console.log('⚠️  Admin user "admin" already exists');
      console.log('Username: admin');
      console.log('Password: admin');
      return false;
    }
    console.error('❌ Error creating admin:', error.message);
    throw error;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');
    
    
    await pushSchema();
    
    
    await createDefaultAdmin();
    
    console.log('\n✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}


setupDatabase();

