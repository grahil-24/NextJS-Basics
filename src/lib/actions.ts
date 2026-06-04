'use server';

import { signIn } from '@/auth';
import { db } from '@/db/drizzle';
import { invoices, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import z from 'zod';
import bcrypt from 'bcrypt';

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

const SignupFormSchema = z.object({
    email: z.string().email({message: 'Invalid email format'}),
    name: z.string().min(3),
    password: z.string().min(5)
        .regex(/^(?=.*[A-Z])(?=.*\d).+$/, {
            message: 'Password must include at least one uppercase letter and one number',
            }),
    confirmPassword: z.string().min(5),
    redirectTo: z.string()
}).superRefine(({confirmPassword, password}, ctx) => {
    if(confirmPassword !== password){
        ctx.addIssue({
            code: "custom",
            message: "The passwords did not match",
            path: ['confirmPassword']
        })
    }
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

export type SignupState = {
    errors?: {
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
        name?: string[]
    };
    message?: string | null
}

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
        // return {
        //     message: 'Database error: Failed to delete invoice'
        // }

        throw new Error('Failed to delete invoice');
    }
    revalidatePath("/dashboard/invoices");
}

export async function authenticate(prevState: string | undefined, formData: FormData){
    try {
        await signIn('credentials', formData);
    }catch(error){
        if(error instanceof AuthError){
            switch(error.type){
                case 'CredentialsSignin':
                    return 'Invalid credentials'
                default: 
                    return 'Something went wrong'
            }
        }else{
            throw error;
        }
    }
}

export async function signUp(prevState: SignupState | undefined, formData: FormData){
    try {
        const validatedFields = SignupFormSchema.safeParse({
            email: formData.get('email'),
            name: formData.get('name'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            redirectTo: formData.get('redirectTo')
        });
        if(!validatedFields.success){
            return {
                errors: validatedFields.error.flatten().fieldErrors,
                message: 'Invalid fields, failed to create user'
            }
        }
        const {password, email, name, redirectTo} = validatedFields.data;
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.insert(users).values({password: hashedPassword, email, name});
        await signIn('credentials', {email, password, redirectTo});
    }catch(error: any){
        if(error instanceof AuthError){
            switch(error.type){
                case 'CredentialsSignin':
                    return { message: 'Invalid credentials' }
                default: 
                    return { message: 'Something went wrong' }
            }
        }else if(error.cause?.code === '23505'){
            return { message: 'User with the email already exists' }
        }else{
            throw error;
        }
    }
}