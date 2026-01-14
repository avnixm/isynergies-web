import { db } from '../app/db';
import { adminUsers } from '../app/db/schema';
import 'dotenv/config';

async function createAdmin() {
  try {
    // Hash for password 'admin'
    const hashedPassword = '$2b$10$E.IS0qmOstLphqDhsTaCH.vuQcWcDOZ5GwbETQsuQndvBbBbP8cIK';

    await db.insert(adminUsers).values({
      username: 'nikka',
      password: hashedPassword,
      email: 'nikka@isynergies.com',
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: nikka');
    console.log('Password: admin');
    console.log('Email: nikka@isynergies.com');
    console.log('\nYou can now login at: http://localhost:3000/admin/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

