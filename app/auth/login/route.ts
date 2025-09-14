import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const GET = async () => {
  const signInUrl = await getSignInUrl({
    redirectUri: `https://refactor.liftgate.io/dashboard`,
  });

  return redirect(signInUrl);
};
