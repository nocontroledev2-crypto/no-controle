import React, { createContext, useContext, useState } from "react";

export type Period =
  | "today"
  | "week"
  | "weekPrev"
  | "month"
  | "monthPrev"
  | "year"
  | "lastYear"
  | "all"
  | "custom";

type PeriodContextType = {
  period: Period;
  customStartDate: string | null;
  customEndDate: string | null;
  setPeriod: (period: Period) => void;
  setCustomPeriod: (startDate: string, endDate: string) => void;
};

const PeriodContext = createContext<PeriodContextType | null>(null);

export function PeriodProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [period, setPeriodState] = useState<Period>("month");
  const [customStartDate, setCustomStartDate] =
    useState<string | null>(null);
  const [customEndDate, setCustomEndDate] =
    useState<string | null>(null);

  function setPeriod(nextPeriod: Period) {
    setPeriodState(nextPeriod);

    if (nextPeriod !== "custom") {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  }

  function setCustomPeriod(startDate: string, endDate: string) {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setPeriodState("custom");
  }

  return (
    <PeriodContext.Provider
      value={{
        period,
        customStartDate,
        customEndDate,
        setPeriod,
        setCustomPeriod,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);

  if (!context) {
    throw new Error(
      "usePeriod deve ser usado dentro do PeriodProvider"
    );
  }

  return context;
}
