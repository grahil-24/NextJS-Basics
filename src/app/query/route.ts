import { db } from "@/db/drizzle";
import { customers, invoices } from "@/db/schema";
import { Invoice } from "@/lib/definitions";
import { eq } from "drizzle-orm";

async function listInvoices() {
	// const data = await sql`
  //   SELECT invoices.amount, customers.name
  //   FROM invoices
  //   JOIN customers ON invoices.customer_id = customers.id
  //   WHERE invoices.amount = 666;
  // `;

  const data = await db.select({amount: invoices.amount, name: customers.name})
                        .from(invoices)
                        .innerJoin(customers, eq(customers.id, invoices.customer_id))
                        .where(eq(invoices.amount, 666));

	return data;
}

export async function GET() {
  try {
  	return Response.json(await listInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}
