"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction(storeSlug: string) {
  // 1. Access the secure cookies
  const cookieStore = await cookies();
  
  // 2. Destroy the session
  cookieStore.delete("tenant_session");
  
  // 3. Kick the user back to the login page
  redirect(`/${storeSlug}/login`);
}