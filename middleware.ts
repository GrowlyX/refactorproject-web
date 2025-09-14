import {authkitMiddleware} from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
    middlewareAuth: {
        enabled: true,
        unauthenticatedPaths: ["/", "/auth/login", "/auth/callback", "/mcp", "/sse",
            "/.well-known/oauth-authorization-server", "/api/github/tokens"],
    },
});

// Match against the pages
export const config = {matcher: ["/:path*", "/account/:path*", "/dashboard"]};
