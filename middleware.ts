import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  middlewareAuth: {
    unauthenticatedPaths: ["/", "/auth/login", "/auth/callback"],
  },
});

// Match against the pages
export const config = { matcher: ["/:path*", "/account/:path*", "/api/:path*", "/dashboard"] };
