import { Session, User } from "@supabase/supabase-js";
import { createClient } from "./server";

export async function verifyUserAuthenticated(): Promise<
  { user: User; session: Session } | undefined
> {
  const supabase = await createClient();
  
  // Get authenticated user data (this is secure)
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return undefined;
  }
  
  // We still need the session for some functionality
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return undefined;
  }
  
  return { user: userData.user, session };
}

