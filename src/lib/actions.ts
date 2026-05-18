'use server';

import { db } from '@/db/drizzle';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    try {
        await db.insert(invoices).values({customer_id: customerId, amount: amountInCents, status, date});
    }catch(error){
        console.log("error in creating invoice: ", error);
        return {
            message: 'Database error: Failed to create invoice'
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const EditSchema = FormSchema.omit({date: true, id: true});

export async function updateInvoice(id: string, formData: FormData){
    const {customerId, amount, status} = EditSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    const amountInCents = amount * 100;

    try {
        await db.update(invoices).set({customer_id: customerId, amount: amountInCents, status}).where(eq(invoices.id, id));
    }catch(error){
        console.log("error in updating invoice: ", error);
        return {
            message: 'Database error: Failed to update invoice'
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoiceWithId(id: string){
    throw Error("Error deleting invoice! Try again");
    try {
        await db.delete(invoices).where(eq(invoices.id, id));
    }catch(error){
        console.log("error in delete invoice: ", error);
        return {
            message: 'Database error: Failed to delete invoice'
        }
    }
    revalidatePath("/dashboard/invoices");
}