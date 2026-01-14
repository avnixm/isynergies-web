import { db } from '../app/db';
import { adminUsers } from '../app/db/schema';
import { hashPassword } from '../app/lib/auth';
import 'dotenv/config';

async function createAdmin() {
  try {
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const email = process.argv[4] || 'admin@isynergies.com';

    const hashedPassword = await hashPassword(password);

    const [newAdmin] = await db.insert(adminUsers).values({
      username,
      password: hashedPassword,
      email,
    }).$returningId();

    console.log('✅ Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

