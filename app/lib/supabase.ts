import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "COLE_AQUI_SUA_PROJECT_URL";

const SUPABASE_ANON_KEY =
  sb_publishable_mOvzmivp33ka-tgZxS7QJg_YgEvakg3;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);