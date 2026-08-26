import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createClient,
  processLock,
} from "@supabase/supabase-js";
import {
  AppState,
  Platform,
} from "react-native";

const SUPABASE_URL = "https://udiencdsidiqxinxqgjs.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_mOvzmivp33ka-tgZxS7QJg_YgEvakg3";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      ...(Platform.OS !== "web"
        ? {
            storage: AsyncStorage,
            lock: processLock,
          }
        : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  }
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void supabase.auth.startAutoRefresh();
      return;
    }

    void supabase.auth.stopAutoRefresh();
  });
}
