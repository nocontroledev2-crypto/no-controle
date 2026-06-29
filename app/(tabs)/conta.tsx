import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { getAllExpenses } from "../storage/expenseStorage";

const USER_PROFILE_KEY = "@no-controle:user-profile";

type UserProfile = {
  nome: string;
  email: string;
};

export default function Conta() {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const savedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
        const expenses = await getAllExpenses();

        if (savedProfile) {
     const parsed = JSON.parse(savedProfile);
     setNome(parsed.nome || "");
     setEmail(parsed.email || "");
     setPerfilSalvo(true);
     } else {
     setPerfilSalvo(false);
      }

        setTotalRegistros(expenses.length);
      }

      load();
    }, [])
  );

  async function salvarPerfil() {
    if (!nome.trim()) {
      alert("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      alert("Informe seu e-mail.");
      return;
    }

    const profile: UserProfile = {
      nome: nome.trim(),
      email: email.trim(),
    };

    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

    setPerfilSalvo(true);
    setMensagem("Perfil salvo com sucesso.");

    setTimeout(() => {
      setMensagem("");
    }, 2500);
  }

  return (
    <View
      style={[
        styles.container,
        isMobile && styles.containerMobile,
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Minha Conta</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Perfil do usuário</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.saveButton} onPress={salvarPerfil}>
            <Text style={styles.saveButtonText}>
             {perfilSalvo ? "💾 Atualizar perfil" : "💾 Salvar perfil"}
             </Text>
          </TouchableOpacity>

          {mensagem ? (
            <Text style={styles.successText}>{mensagem}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Meu No Controle</Text>

          <Text style={styles.infoText}>
            Registros salvos neste dispositivo:
          </Text>

          <Text style={styles.bigNumber}>{totalRegistros}</Text>

          <Text style={styles.infoText}>
            Seus dados financeiros estão vinculados ao armazenamento local deste
            navegador/dispositivo nesta versão MVP.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔐 Status da conta</Text>

          <Text style={styles.infoText}>
            Versão atual: MVP local
          </Text>

          <Text style={styles.infoText}>
            Nesta etapa, o No Controle salva os dados localmente. Em uma próxima
            evolução, a conta poderá ter login real e sincronização em nuvem.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Importante</Text>

          <Text style={styles.warningText}>
            Se você abrir o app em outro navegador, janela anônima ou outro
            dispositivo, os registros podem não aparecer porque ainda não existe
            sincronização em nuvem.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  containerMobile: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },

  scrollContent: {
    paddingBottom: 90,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A8F55",
    textAlign: "center",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#E8EAEE",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },

  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
    color: "#333",
  },

  saveButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 2,
  },

  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },

  successText: {
    textAlign: "center",
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },

  infoText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 8,
  },

  bigNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0A8F55",
    marginBottom: 8,
  },

  warningCard: {
    backgroundColor: "#FFF8E6",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#F3D58A",
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A6400",
    marginBottom: 8,
  },

  warningText: {
    fontSize: 13,
    color: "#6B5200",
    lineHeight: 18,
  },
});
