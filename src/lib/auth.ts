import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Fail fast if credentials are not configured
if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
  throw new Error(
    "ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be set in environment variables. " +
    "See .env.example for required configuration."
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === ADMIN_USERNAME) {
          const isValid = await compare(
            credentials.password as string,
            ADMIN_PASSWORD_HASH
          );

          if (isValid) {
            return {
              id: "1",
              name: "Admin",
              email: "admin@yoom.com"
            };
          }
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
};
