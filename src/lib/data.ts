import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { db } from '@/db/drizzle';
import { customers, invoices, revenue } from '@/db/schema';
import { count, desc, eq, sum, sql, ilike, or} from 'drizzle-orm';

// const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchRevenue() {
  try {
    const data: Revenue[] = await db.select().from(revenue);

    return data;
  } catch (error) {
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {

    const data: LatestInvoiceRaw[] = await db.select({
      amount: invoices.amount, name: customers.name, 
      image_url: customers.image_url, email: customers.email, id: invoices.id})
      .from(invoices).innerJoin(customers, eq(invoices.customer_id, customers.id))
      .orderBy(desc(invoices.date))
      .limit(5);

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise = db.select({count: count()}).from(invoices);
    // const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const customerCountPromise = db.select({count: count()}).from(customers);
    const invoiceStatusPromise = db.select({paid: sql<number>`sum(case when ${invoices.status} = 'paid' then ${invoices.amount} else 0 end)`,
    pending: sql<number>`sum(case when ${invoices.status} = 'pending' then ${invoices.amount} else 0 end)`}).from(invoices);

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoicesData = await db.select({id: invoices.id, amount: invoices.amount,
            date: invoices.date, status: invoices.status, name: customers.name,
            email: customers.email, image_url: customers.image_url}).from(invoices)
            .innerJoin(customers, eq(invoices.customer_id, customers.id))
            .where(or(ilike(customers.name, `%${query}%`), ilike(customers.email, `%${query}%`), 
            ilike(sql`${invoices.amount}::text`,  `%${query}%`), ilike(sql`${invoices.amount}::text`, `%${query}%`),
            ilike(invoices.status, `%${query}%`))).orderBy(desc(invoices.date)).limit(ITEMS_PER_PAGE)
            .offset(offset);

    return invoicesData;
  } catch (error) {
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {

    const data = await db.select({count: count()}).from(invoices)
    .innerJoin(customers, eq(invoices.customer_id, customers.id))
    .where(or(ilike(customers.name, `%${query}%`), ilike(customers.email, `%${query}%`), 
    ilike(sql`${invoices.amount}::text`,  `%${query}%`), ilike(sql`${invoices.amount}::text`, `%${query}%`),
    ilike(invoices.status, `%${query}%`)));

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {

    const data = await db.select({id: invoices.id, customer_id: invoices.customer_id, amount: invoices.amount, status: invoices.status})
                          .from(invoices).where(eq(invoices.id, id));

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {

    const customerData: CustomerField[] = await db.select({id: customers.id, name: customers.name}).from(customers).orderBy(customers.name);

    return customerData;
  } catch (err) {
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {

    const data = await db.select({id: customers.id, name: customers.name, email: customers.email,
                                image_url: customers.image_url, total_invoices: count(invoices.id),
                              total_pending: sql<number>`sum(case when ${invoices.status} = 'pending' then ${invoices.amount} else 0 end)`,
                            total_paid: sql<number>`sum(case when ${invoices.status} = 'paid' then ${invoices.amount} else 0 end)`})
                          .from(customers)
                          .leftJoin(invoices, eq(customers.id, invoices.customer_id))
                          .where(or(ilike(customers.name, `%${query}%`), ilike(customers.email, `%${query}%`)))
                          .groupBy(customers.id, customers.name, customers.email, customers.image_url)
                          .orderBy(customers.name);

    const customerData = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    throw new Error('Failed to fetch customer table.');
  }
}
