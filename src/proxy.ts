import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

export default NextAuth(authConfig).auth;


export const config = {
    /* by default proxy runs before every request. auth proxy might block requests for static content like image
    optimization, assets in public directory, 
    */
   matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],

}