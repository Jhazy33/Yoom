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
  // Protect these routes (NOTE: /watch/[key] is public for shared links)
  matcher: ["/api/upload", "/api/upload-complete/:path*", "/recorder"],
};
