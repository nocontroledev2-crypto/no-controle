import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const MASCARA_VALOR_PRIVADO = "R$ ••••••";
export const MASCARA_PERCENTUAL_PRIVADO = "••%";

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
