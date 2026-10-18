import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const MASCARA_VALOR_PRIVADO = "R$ ••••••";
export const MASCARA_PERCENTUAL_PRIVADO = "••%";

const PRIVACY_STORAGE_KEY =
  "@enxergai:privacy-hidden";

type PrivacyContextType = {
  ocultarValores: boolean;
  setOcultarValores: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  alternarPrivacidade: () => void;
  formatarValorVisivel: (
    valor: number | null | undefined
  ) => string;
  formatarPercentualVisivel: (
    percentual: number | null | undefined
  ) => string;
};

const PrivacyContext =
  createContext<PrivacyContextType | null>(null);

function formatarReal(
  valor: number | null | undefined
) {
  const valorSeguro = Number(valor);

  return (
    Number.isFinite(valorSeguro)
      ? valorSeguro
      : 0
  ).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PrivacyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ocultarValores, setOcultarValores] =
    useState(false);

  const [preferenciaCarregada, setPreferenciaCarregada] =
    useState(false);

  useEffect(() => {
    let providerAtivo = true;

    async function carregarPreferencia() {
      try {
        const valorSalvo = await AsyncStorage.getItem(
          PRIVACY_STORAGE_KEY
        );

        if (!providerAtivo) {
          return;
        }

        setOcultarValores(valorSalvo === "true");
      } catch (error) {
        console.error(
          "Erro ao carregar preferencia de privacidade:",
          error
        );
      } finally {
        if (providerAtivo) {
          setPreferenciaCarregada(true);
        }
      }
    }

    void carregarPreferencia();

    return () => {
      providerAtivo = false;
    };
  }, []);

  useEffect(() => {
    if (!preferenciaCarregada) {
      return;
    }

    async function salvarPreferencia() {
      try {
        await AsyncStorage.setItem(
          PRIVACY_STORAGE_KEY,
          String(ocultarValores)
        );
      } catch (error) {
        console.error(
          "Erro ao salvar preferencia de privacidade:",
          error
        );
      }
    }

    void salvarPreferencia();
  }, [
    ocultarValores,
    preferenciaCarregada,
  ]);

  const alternarPrivacidade = useCallback(() => {
    setOcultarValores((estadoAtual) => !estadoAtual);
  }, []);

  const formatarValorVisivel = useCallback(
    (valor: number | null | undefined) => {
      return ocultarValores
        ? MASCARA_VALOR_PRIVADO
        : formatarReal(valor);
    },
    [ocultarValores]
  );

  const formatarPercentualVisivel = useCallback(
    (percentual: number | null | undefined) => {
      if (ocultarValores) {
        return MASCARA_PERCENTUAL_PRIVADO;
      }

      const percentualSeguro = Number(percentual);

      if (
        !Number.isFinite(percentualSeguro) ||
        percentualSeguro <= 0
      ) {
        return "0%";
      }

      if (percentualSeguro < 1) {
        return "<1%";
      }

      return `${percentualSeguro.toFixed(0)}%`;
    },
    [ocultarValores]
  );

  const valorContexto = useMemo(
    () => ({
      ocultarValores,
      setOcultarValores,
      alternarPrivacidade,
      formatarValorVisivel,
      formatarPercentualVisivel,
    }),
    [
      ocultarValores,
      alternarPrivacidade,
      formatarValorVisivel,
      formatarPercentualVisivel,
    ]
  );

  if (!preferenciaCarregada) {
    return null;
  }

  return (
    <PrivacyContext.Provider value={valorContexto}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);

  if (!context) {
    throw new Error(
      "usePrivacy deve ser usado dentro do PrivacyProvider"
    );
  }

  return context;
}
