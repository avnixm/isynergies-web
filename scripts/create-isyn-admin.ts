import 'dotenv/config';
import { db } from '../app/db';
import { adminUsers } from '../app/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../app/lib/auth';

const USERNAME = 'admin';
const PASSWORD = 'admin';
const EMAIL = 'isyn_admin@isynergies.com';

async function createIsynAdmin() {
  console.log(`Creating admin "${USERNAME}"...`);

  try {
    const hashedPassword = await hashPassword(PASSWORD);

    const [existing] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, USERNAME))
      .limit(1);

    if (existing) {
      await db
        .update(adminUsers)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(adminUsers.id, existing.id));
      console.log(`Admin "${USERNAME}" already existed; password updated.`);
    } else {
      await db.insert(adminUsers).values({
        username: USERNAME,
        password: hashedPassword,
        email: EMAIL,
      });
      console.log(`Admin "${USERNAME}" created.`);
    }

    console.log('');
    console.log('Login:');
    console.log(`  Username: ${USERNAME}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log(`  Email: ${EMAIL}`);
    console.log('  URL: /admin/login');
    process.exit(0);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
      console.log(`"${USERNAME}" exists; run again to reset password.`);
      process.exit(0);
    }
    console.error('Error:', err?.message ?? e);
    process.exit(1);
  }
}

createIsynAdmin();
