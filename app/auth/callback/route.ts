import { handleAuth } from "@workos-inc/authkit-nextjs";

export const GET = handleAuth({
    baseURL: "https://refactor.liftgate.io/"
});
