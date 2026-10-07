import { Redirect } from "expo-router";
import { Platform } from "react-native";
import PublicLandingPage from "../components/public/PublicLandingPage";

export default function Index() {
  if (Platform.OS === "web") {
    return <PublicLandingPage />;
  }

  return <Redirect href="/(tabs)/home" />;
}
