import type {NextAuthConfig} from 'next-auth';


export const authConfig = {
  pages: {
    signIn: '/login',
  },
  /*proxy to verify authentication. if logged out and trying to access /dashboard, redirect to /login
    If logged in, then redirect to /dashboard on initial load
  */
  callbacks: {
    authorized({auth, request: {nextUrl}}){
        const isLoggedIn = !!auth?.user;
        const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
        if(isOnDashboard){
            if(isLoggedIn) return true;
            return false; //redirect unauthenticated users to login page
        }else if(isLoggedIn){
            return Response.redirect(new URL('/dashboard', nextUrl.origin));
        }
        return true;
    }
  },
  providers: []
} satisfies NextAuthConfig;