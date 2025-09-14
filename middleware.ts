import {authkitMiddleware} from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
    middlewareAuth: {
        enabled: true,
        unauthenticatedPaths: ["/", "/auth/login", "/auth/callback", "/api/github/tokens"],
    },
});

// Match against the pages
export const config = {matcher: ["/:path*", "/account/:path*", "/dashboard"]};
