import bcrypt from 'bcrypt';
import { db } from "@/db/drizzle";
import { users, customers, invoices, revenue } from "@/db/schema";
import { users as users_pd, invoices as invoices_pd, customers as customers_pd,  revenue as revenue_pd} from '@/lib/placeholder-data';

async function seedUsers() {

  const insertedUsers = await Promise.all(
    users_pd.map(async (usr) => {
      const hashedPassword = await bcrypt.hash(usr.password, 10);
      await db.insert(users).values({...usr, password: hashedPassword});
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {
  // await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // await sql`
  //   CREATE TABLE IF NOT EXISTS invoices (
  //     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  //     customer_id UUID NOT NULL,
  //     amount INT NOT NULL,
  //     status VARCHAR(255) NOT NULL,
  //     date DATE NOT NULL
  //   );
  // `;

  // const insertedInvoices = await Promise.all(
  //   invoices.map(
  //     (invoice) => sql`
  //       INSERT INTO invoices (customer_id, amount, status, date)
  //       VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
  //       ON CONFLICT (id) DO NOTHING;
  //     `,
  //   ),
  // );

  const insertedInvoices = await db.insert(invoices).values(
    invoices_pd.map((invoice) => ({
      ...invoice,
      status: invoice.status as 'pending' | 'paid', 
    }))
  ).onConflictDoNothing();

  return insertedInvoices;
}

async function seedCustomers() {
  // await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // await sql`
  //   CREATE TABLE IF NOT EXISTS customers (
  //     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  //     name VARCHAR(255) NOT NULL,
  //     email VARCHAR(255) NOT NULL,
  //     image_url VARCHAR(255) NOT NULL
  //   );
  // `;

  // const insertedCustomers = await Promise.all(
  //   customers.map(
  //     (customer) => sql`
  //       INSERT INTO customers (id, name, email, image_url)
  //       VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
  //       ON CONFLICT (id) DO NOTHING;
  //     `,
  //   ),
  // );
  const insertedCustomers = await db.insert(customers).values(customers_pd).onConflictDoNothing();

  return insertedCustomers;
}

async function seedRevenue() {
  // await sql`
  //   CREATE TABLE IF NOT EXISTS revenue (
  //     month VARCHAR(4) NOT NULL UNIQUE,
  //     revenue INT NOT NULL
  //   );
  // `;

  // const insertedRevenue = await Promise.all(
  //   revenue.map(
  //     (rev) => sql`
  //       INSERT INTO revenue (month, revenue)
  //       VALUES (${rev.month}, ${rev.revenue})
  //       ON CONFLICT (month) DO NOTHING;
  //     `,
  //   ),
  // );

  const insertedRevenue = await db.insert(revenue).values(revenue_pd).onConflictDoNothing();

  return insertedRevenue;
}

export async function GET() {
  try {
    const result = await db.transaction(async (db) => [
      seedUsers(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
