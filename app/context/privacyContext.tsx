import React, {
    createContext,
    useContext,
    useState,
} from "react";

type PrivacyContextType = {
  ocultarValores: boolean;
  setOcultarValores: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

const PrivacyContext =
  createContext<PrivacyContextType | null>(null);

export function PrivacyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ocultarValores, setOcultarValores] =
    useState(false);

  return (
    <PrivacyContext.Provider
      value={{
        ocultarValores,
        setOcultarValores,
      }}
    >
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