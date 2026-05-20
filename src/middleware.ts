import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Protected routes
  callbacks: {
    authorized({ token }) {
      return !!token;
    },
  },
});

export const config = {
  // Protect these routes
  matcher: ["/watch/:path*", "/api/upload", "/api/upload-complete/:path*", "/recorder"],
};
