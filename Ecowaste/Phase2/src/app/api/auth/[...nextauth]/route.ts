import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "EcoSort",
      credentials: {
        pbToken: { label: "Token", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const PRODUCTION_PB_URL = 'https://ecowaste-pocketbase.onrender.com';
          const pbUrl = process.env.NODE_ENV === 'development' 
             ? 'https://ecowaste-pocketbase.onrender.com' 
             : PRODUCTION_PB_URL;

          // 1. Authenticate via token (AuthBridge flow)
          if (credentials?.pbToken) {
            const res = await fetch(`${pbUrl}/api/collections/users/auth-refresh`, {
              method: 'POST',
              headers: {
                'Authorization': credentials.pbToken,
                'Content-Type': 'application/json'
              }
            });

            if (res.ok) {
              const data = await res.json();
              const user = data.record;
              return {
                id: user.id,
                email: user.email,
                name: user.name || 'User',
                role: user.role === 'ROLE_ADMIN' ? 'admin' : (user.role === 'ROLE_RECEIVER' ? 'collector' : 'user')
              };
            }
            return null;
          }

          // 2. Authenticate via local Express backend
          if (credentials?.email && credentials?.password) {
            const res = await fetch('http://127.0.0.1:3002/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
              })
            });

            if (res.ok) {
              const data = await res.json();
              const user = data.user;
              // Hardcoded admin check matching server.js fallback
              if (user.email === 'rohanipawar16@gmail.com') {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name || 'Admin',
                  role: 'admin',
                  token: data.token // Optional if we want to pass the token down
                };
              }
              // If not admin, deny access
              return null;
            }
            return null;
          }

          return null;
        } catch (error) {
          console.error("Auth Error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/sign-up-login-screen',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
