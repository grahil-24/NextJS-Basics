import NextAuth from "next-auth";
import { authConfig } from "../auth.config";
import Credentials from "next-auth/providers/credentials";
import z from "zod";
import bcrypt from 'bcrypt'
import type { User } from '@/lib/definitions'
import { db } from "./db/drizzle";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const getUser = async(email: string): Promise<User | undefined> => {
    try {
        const user: User[] = await db.select().from(users).where(eq(users.email, email));
        return user[0];
    }catch(error){
        console.log("error fetching user ", error);
        throw new Error('Failed to fetch user');
    }
}

export const {auth, signIn, signOut} = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials){
                const parsedCredentials = z.object({email: z.string().email(), password: z.string().length(6)})
                                            .safeParse(credentials);

                if(parsedCredentials.success){
                    const {email, password} = parsedCredentials.data;
                    const user: User | undefined = await getUser(email);
                    if(!user) return null
                    const passwordMatch = await bcrypt.compare(password, user.password);
                    if(passwordMatch) return user;
                    return null;
                }
                return null;
            }
        })
    ]
});