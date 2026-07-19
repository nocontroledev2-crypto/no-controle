import { useRouter } from "expo-router";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AuthRequiredCard() {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🔐 Entre na sua conta</Text>

      <Text style={styles.text}>
        Seus registros ficam protegidos na nuvem. Faça login para lançar,
        acompanhar e sincronizar suas despesas.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(tabs)/conta")}
      >
        <Text style={styles.buttonText}>Ir para Minha Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 0.5,
    borderColor: "#DDE3EA",
    marginTop: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0A8F55",
    marginBottom: 8,
  },

  text: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});