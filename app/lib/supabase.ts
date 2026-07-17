import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://udiencdsidiqxinxqgjs.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_mOvzmivp33ka-tgZxS7QJg_YgEvakg3";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);