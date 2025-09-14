import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const GET = async () => {
  const baseUrl = 'https://refactor.liftgate.io';
  const signInUrl = await getSignInUrl({
    redirectUri: `${baseUrl}/dashboard`,
  });

  return redirect(signInUrl);
};
