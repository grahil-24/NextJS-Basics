'use server';

import { db } from '@/db/drizzle';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import z from 'zod';

const FormSchema = z.object({
    customerId: z.string({
        invalid_type_error: 'Please select a customer'
    }),
    amount: z.coerce.number().gt(0, {message: 'Please enter an amount greater than 0'}), //change from string to number while also validating the type
    status: z.enum(['pending', 'paid'], {
        message: 'Please select an invoice status'
    }),
    date: z.string(),
    id: z.string()
})

const CreateInvoice = FormSchema.omit({id: true, date: true})

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData){
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to create invoice'
        }
    }
    const { customerId, amount, status } = validatedFields.data;
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

export async function updateInvoice(id: string, prevState: State, formData: FormData){
    const validatedFields = EditSchema.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to update invoice'
        }
    }

    const {customerId, amount, status} = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        await db.update(invoices).set({customer_id: customerId, amount: amountInCents, status}).where(eq(invoices.id, id));
    }catch(error){
        return {
            message: 'Database error: Failed to update invoice'
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoiceWithId(id: string){
    // throw Error("Error deleting invoice! Try again");
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