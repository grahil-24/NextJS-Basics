'use server';

import { db } from '@/db/drizzle';
import { invoices } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import z from 'zod';

const FormSchema = z.object({
    customerId: z.string(),
    amount: z.coerce.number(), //change from string to number while also validating the type
    status: z.enum(['pending', 'paid']),
    date: z.string(),
    id: z.string()
})

const CreateInvoice = FormSchema.omit({id: true, date: true})

export async function createInvoice(formData: FormData){
    const {customerId, amount, status} = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await db.insert(invoices).values({customer_id: customerId, amount, status, date});

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}
