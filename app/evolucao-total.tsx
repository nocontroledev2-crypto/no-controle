import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { BarChart, LineChart } from "react-native-chart-kit";
import { Text as SvgText } from "react-native-svg";
import { getAllExpenses } from "./storage/expenseStorage";


export default function EvolucaoTotal() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [period, setPeriod] = useState<string>(
    (params.period as string) || "month"
  );

  const [expenses, setExpenses] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInsightsPopup, setShowInsightsPopup] = useState(false);
  const [modoInsights, setModoInsights] = useState<
  "essencial" | "completo" | "comparativo"
>("essencial");

  const [chartType, setChartType] = useState<"line" | "bar">("bar");
  const [selectedPoint, setSelectedPoint] = useState<{
  label: string;
  value: number;
} | null>(null);

  const [showCustomBox, setShowCustomBox] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

 const now = new Date();
 const { width } = useWindowDimensions();

 const isMobile = width < 480;
 const isTablet = width >= 480 && width < 900;
 const isDesktop = width >= 900;

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const data = await getAllExpenses();
        setExpenses(data || []);
      }

      load();
    }, [])
  );


    useEffect(() => {
     if (!menuOpen) return;
     if (typeof window === "undefined") return;

     function handleKeyDown(event: any) {
     if (event.key === "Escape") {
      setMenuOpen(false);
      }
     }

     window.addEventListener("keydown", handleKeyDown);

     return () => {
     window.removeEventListener("keydown", handleKeyDown);
     };
     }, [menuOpen]);


  function parseDateSafe(dateStr: string) {
    const [ano, mes, dia] = dateStr.split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }


  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getEndOfWeek(date: Date) {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  function formatMoney(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatCustomDate(dateStr: string) {
    if (!dateStr) return "--/--/----";
    return parseDateSafe(dateStr).toLocaleDateString("pt-BR");
  }

  const labelsMonth = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const labelsMonthFull = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

  /* ===============================
     HELPERS DO GRÁFICO
  =============================== */

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function buildDayLabels(days: number) {
    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;

      if (day === 1 || day === days || day % 5 === 0) {
        return String(day);
      }

      return "";
    });
  }

  function buildDailyDataForMonth(year: number, month: number) {
    const days = getDaysInMonth(year, month);
    const values = Array(days).fill(0);

    expenses.forEach((item: any) => {
      const d = parseDateSafe(item.data);

      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayIndex = d.getDate() - 1;
        values[dayIndex] += Number(item.valor);
      }
    });

    return values;
  }

  function buildMonthlyDataForYear(year: number) {
    const values = Array(12).fill(0);

    expenses.forEach((item: any) => {
      const d = parseDateSafe(item.data);

      if (d.getFullYear() === year) {
        values[d.getMonth()] += Number(item.valor);
      }
    });

    return values;
  }

  function buildYearlyData() {
    const map: Record<string, number> = {};

    expenses.forEach((item: any) => {
      const d = parseDateSafe(item.data);
      const year = String(d.getFullYear());

      map[year] = (map[year] || 0) + Number(item.valor);
    });

    const years = Object.keys(map).sort();

    return {
      labels: years,
      values: years.map((year) => map[year]),
    };
  }

  function buildSingleYearMonthlyRange() {
    const yearsWithData = Array.from(
      new Set(
        expenses.map((item: any) => {
          const d = parseDateSafe(item.data);
          return d.getFullYear();
        })
      )
    ).sort((a, b) => a - b);

    if (yearsWithData.length !== 1) {
      return {
        labels: [] as string[],
        values: [] as number[],
      };
    }

    const onlyYear = yearsWithData[0];

    const monthsWithData = expenses
      .map((item: any) => {
        const d = parseDateSafe(item.data);

        if (d.getFullYear() !== onlyYear) {
          return null;
        }

        return d.getMonth();
      })
      .filter((month) => month !== null) as number[];

    if (monthsWithData.length === 0) {
      return {
        labels: [] as string[],
        values: [] as number[],
      };
    }

    const firstMonthWithData = Math.min(...monthsWithData);
    const lastMonthWithData = Math.max(...monthsWithData);

    let endMonth = lastMonthWithData;

    if (onlyYear === now.getFullYear()) {
      endMonth = Math.max(now.getMonth(), lastMonthWithData);
    }

    const fullYearValues = buildMonthlyDataForYear(onlyYear);

    return {
      labels: labelsMonth.slice(firstMonthWithData, endMonth + 1),
      values: fullYearValues.slice(firstMonthWithData, endMonth + 1),
    };
  }

  function buildCustomRangeData() {
    if (!startDateInput || !endDateInput) {
      return {
        labels: ["Sem dados"],
        values: [0],
      };
    }

    const start = parseDateSafe(startDateInput);
    const end = parseDateSafe(endDateInput);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start.getTime() > end.getTime()) {
      return {
        labels: ["Inválido"],
        values: [0],
      };
    }

    const diffDays =
      Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    const monthDiff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1;

    // Até 31 dias: gráfico por dia
    if (diffDays <= 31) {
      const labels: string[] = [];
      const values: number[] = Array(diffDays).fill(0);

      for (let i = 0; i < diffDays; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);

        if (diffDays <= 14) {
          labels.push(
            current.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })
          );
        } else {
          const day = i + 1;

          if (day === 1 || day === diffDays || day % 5 === 0) {
            labels.push(
              current.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })
            );
          } else {
            labels.push("");
          }
        }
      }

      expenses.forEach((item: any) => {
        const d = parseDateSafe(item.data);
        d.setHours(0, 0, 0, 0);

        if (d >= start && d <= end) {
          const diff = Math.floor(
            (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diff >= 0 && diff < diffDays) {
            values[diff] += Number(item.valor);
          }
        }
      });

      return { labels, values };
    }

    // Até 12 meses: gráfico por mês
    if (monthDiff <= 12) {
      const labels: string[] = [];
      const values: number[] = Array(monthDiff).fill(0);

      for (let i = 0; i < monthDiff; i++) {
        const current = new Date(
          start.getFullYear(),
          start.getMonth() + i,
          1
        );

        labels.push(
          `${labelsMonth[current.getMonth()]}/${String(
            current.getFullYear()
          ).slice(2)}`
        );
      }

      expenses.forEach((item: any) => {
        const d = parseDateSafe(item.data);

        if (d >= start && d <= end) {
          const index =
            (d.getFullYear() - start.getFullYear()) * 12 +
            (d.getMonth() - start.getMonth());

          if (index >= 0 && index < monthDiff) {
            values[index] += Number(item.valor);
          }
        }
      });

      return { labels, values };
    }

    // Mais de 12 meses: gráfico por ano
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const yearsCount = endYear - startYear + 1;

    const labels: string[] = [];
    const values: number[] = Array(yearsCount).fill(0);

    for (let year = startYear; year <= endYear; year++) {
      labels.push(String(year));
    }

    expenses.forEach((item: any) => {
      const d = parseDateSafe(item.data);

      if (d >= start && d <= end) {
        const index = d.getFullYear() - startYear;

        if (index >= 0 && index < yearsCount) {
          values[index] += Number(item.valor);
        }
      }
    });

    return { labels, values };
  }

  /* ===============================
     DADOS DE HOJE
  =============================== */

  const last7DaysData: number[] = Array(7).fill(0);
  const labelsLast7Days: string[] = [];

  const startLast7Days = new Date(now);
  startLast7Days.setDate(now.getDate() - 6);
  startLast7Days.setHours(0, 0, 0, 0);

  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startLast7Days);
    currentDay.setDate(startLast7Days.getDate() + i);

    if (i === 6) {
      labelsLast7Days.push("HOJE");
    } else {
      labelsLast7Days.push(
        currentDay.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        })
      );
    }
  }

  expenses.forEach((item: any) => {
    const d = parseDateSafe(item.data);
    d.setHours(0, 0, 0, 0);

    if (d >= startLast7Days && d <= endToday) {
      const diffDays = Math.floor(
        (d.getTime() - startLast7Days.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 0 && diffDays < 7) {
        last7DaysData[diffDays] += Number(item.valor);
      }
    }
  });

  /* ===============================
     DADOS SEMANAIS
  =============================== */

  const weeklyData: number[] = Array(7).fill(0);

  const weekReference = new Date(now);

  if (period === "weekPrev") {
    weekReference.setDate(now.getDate() - 7);
  }

  const startWeek = getStartOfWeek(weekReference);
  const endWeek = getEndOfWeek(weekReference);

  expenses.forEach((item: any) => {
    const d = parseDateSafe(item.data);

    if (d >= startWeek && d <= endWeek) {
      const jsDay = d.getDay();
      const index = jsDay === 0 ? 6 : jsDay - 1;

      weeklyData[index] += Number(item.valor);
    }
  });

  const labelsWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  /* ===============================
     DADOS POR MÊS / ANO
  =============================== */

  const currentMonthData = buildDailyDataForMonth(
    now.getFullYear(),
    now.getMonth()
  );

  const currentMonthLabels = buildDayLabels(
    getDaysInMonth(now.getFullYear(), now.getMonth())
  );

  const previousMonthDate = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const previousMonthData = buildDailyDataForMonth(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth()
  );

  const previousMonthLabels = buildDayLabels(
    getDaysInMonth(
      previousMonthDate.getFullYear(),
      previousMonthDate.getMonth()
    )
  );

  const currentYearData = buildMonthlyDataForYear(now.getFullYear());

  const previousYearData = buildMonthlyDataForYear(now.getFullYear() - 1);

  const yearlyData = buildYearlyData();

  const singleYearMonthlyRange = buildSingleYearMonthlyRange();

  const customRangeData = buildCustomRangeData();

  /* ===============================
     ESCOLHA DINÂMICA DO GRÁFICO
  =============================== */

  let chartLabels: string[] = [];
  let chartValues: number[] = [];

  if (period === "today") {
    chartLabels = labelsLast7Days;
    chartValues = last7DaysData;
  } else if (period === "week" || period === "weekPrev") {
    chartLabels = labelsWeek;
    chartValues = weeklyData;
  } else if (period === "month") {
    chartLabels = currentMonthLabels;
    chartValues = currentMonthData;
  } else if (period === "monthPrev") {
    chartLabels = previousMonthLabels;
    chartValues = previousMonthData;
  } else if (period === "year") {
    chartLabels = labelsMonth;
    chartValues = currentYearData;
  } else if (period === "lastYear") {
    chartLabels = labelsMonth;
    chartValues = previousYearData;
  } else if (period === "all") {
    if (yearlyData.labels.length > 1) {
      chartLabels = yearlyData.labels;
      chartValues = yearlyData.values;
    } else {
      chartLabels = singleYearMonthlyRange.labels;
      chartValues = singleYearMonthlyRange.values;
    }
  } else if (period === "custom") {
    chartLabels = customRangeData.labels;
    chartValues = customRangeData.values;
  } else {
    chartLabels = labelsMonth;
    chartValues = currentYearData;
  }

 const safeChartLabels = chartLabels.length > 0 ? chartLabels : ["Sem dados"];
 const safeChartValues = chartValues.length > 0 ? chartValues : [0];

 const isDenseChart = safeChartValues.length > 12;
 const isBarBlockedOnMobile = isMobile && isDenseChart;
 useEffect(() => {
  if (isBarBlockedOnMobile && chartType === "bar") {
    setChartType("line");
  }
}, [isBarBlockedOnMobile, chartType]);

const shouldUseHorizontalScroll =
  !isDesktop && isDenseChart;

const baseChartWidth = isMobile
  ? width - 24
  : isTablet
  ? Math.min(width - 48, 760)
  : 860;

const pointWidth =
  chartType === "bar"
    ? 42
    : 34;

const chartWidth = shouldUseHorizontalScroll
  ? Math.max(baseChartWidth, safeChartValues.length * pointWidth)
  : baseChartWidth;
  const chartHeight = isMobile ? 210 : 220;

  const showBarValuesOnTop = !(isMobile && isDenseChart);

 const totalGrafico = chartValues.reduce((sum, value) => sum + value, 0);
 const todayValue = last7DaysData[6] ?? 0;
 const maxValue = Math.max(...safeChartValues);

  const chartData = {
  labels: safeChartLabels,
  datasets: [
    {
      data: safeChartValues,
      colors: safeChartValues.map((value) => {
        const numericValue = Number(value);

        let color = "#CFE8DB"; // baixo

if (numericValue >= maxValue * 0.8) {
  color = "#043D27"; // top
} else if (numericValue >= maxValue * 0.4) {
  color = "#0A8F55"; // médio
}

        return () => color;
      }),
    },
  ],
};

const barChartData = {
  labels: safeChartLabels,
  datasets: [
    {
      data: safeChartValues.map((value) => {
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
          return 0;
        }

        // Arredonda os valores exibidos no topo das colunas
        return Number(numericValue.toFixed(0));
      }),

      colors: safeChartValues.map((value) => {
        const numericValue = Number(value);

        let color = "#CFE8DB"; // baixo

        if (numericValue >= maxValue * 0.8) {
          color = "#043D27"; // top
        } else if (numericValue >= maxValue * 0.4) {
          color = "#0A8F55"; // médio
        }

        return () => color;
      }),
    },
  ],
};
    
    const topLabelIndexes = safeChartValues
  .map((value, index) => ({
    value: Number(value),
    index,
  }))
  .filter((item) => item.value > 0)
  .sort((a, b) => b.value - a.value)
  .slice(0, 5)
  .map((item) => item.index);

  const mobileBarHighlights = topLabelIndexes
  .filter((index) => Number(safeChartValues[index]) > 0)
  .slice(0, 3)
  .map((index) => ({
    label: safeChartLabels[index],
    value: Number(safeChartValues[index]),
  }));
 
  const rankingFinanceiro = safeChartValues
  .map((value, index) => {
   
    let label = `Dia ${index + 1}`;


    
if (period === "today") {
  const currentDate = new Date(startLast7Days);

  currentDate.setDate(
    startLast7Days.getDate() + index
  );

  const hoje =
    currentDate.toDateString() ===
    now.toDateString();

  label = hoje
    ? `Hoje (${currentDate.toLocaleDateString("pt-BR")})`
    : currentDate.toLocaleDateString("pt-BR");
}

if (period === "month") {
  const currentDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    index + 1
  );

  const hoje =
    currentDate.toDateString() ===
    now.toDateString();

  label = hoje
    ? `Hoje (${currentDate.toLocaleDateString("pt-BR")})`
    : currentDate.toLocaleDateString("pt-BR");
}

if (period === "monthPrev") {
  const currentDate = new Date(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth(),
    index + 1
  );

  label = currentDate.toLocaleDateString("pt-BR");
}

if (
  period === "year" ||
  period === "lastYear"
) {
  const anoRanking =
    period === "year"
      ? now.getFullYear()
      : now.getFullYear() - 1;

  label = `${labelsMonthFull[index]}/${anoRanking}`;
}

if (
  period === "custom" &&
  safeChartLabels.length <= 12 &&
  safeChartLabels[0]?.includes("/")
) {
  label = safeChartLabels[index];
}

if (period === "week" || period === "weekPrev") {
  const weekReference =
    period === "week"
      ? now
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7
        );


  const startWeek = getStartOfWeek(weekReference);

  const currentDate = new Date(startWeek);
  currentDate.setDate(startWeek.getDate() + index);

  label = `${labelsWeek[index]} (${currentDate.toLocaleDateString(
    "pt-BR"
  )})`;
}

if (
  period === "custom" &&
  startDateInput &&
  endDateInput
) {
  const start = parseDateSafe(startDateInput);
  const end = parseDateSafe(endDateInput);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const diffDays =
    Math.floor(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  if (diffDays <= 31) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + index);

    const hoje =
      currentDate.toDateString() ===
      now.toDateString();

    label = hoje
      ? `Hoje (${currentDate.toLocaleDateString("pt-BR")})`
      : currentDate.toLocaleDateString("pt-BR");
  } else {
    label = safeChartLabels[index] || label;
  }
}

if (
  period === "custom" &&
  startDateInput &&
  endDateInput
) {
  const start = parseDateSafe(startDateInput);
  const end = parseDateSafe(endDateInput);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const diffDays =
    Math.floor(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  if (diffDays <= 31) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + index);

    const hoje =
      currentDate.toDateString() ===
      now.toDateString();

    label = hoje
      ? `Hoje (${currentDate.toLocaleDateString("pt-BR")})`
      : currentDate.toLocaleDateString("pt-BR");
  } else {
    label = safeChartLabels[index] || label;
  }
}

if (period === "all") {
  label = safeChartLabels[index] || label;
}


    return {
      label,
      value: Number(value),
    };
  })
  .filter((item) => item.value > 0)
  .sort((a, b) => b.value - a.value)
  .slice(0, 3);

  const diasComGasto = safeChartValues.filter(
  (value) => Number(value) > 0
).length;

const pontosFinanceiros = diasComGasto;
let unidadeSingular = "dia";
let unidadePlural = "dias";

const primeiroLabel = safeChartLabels[0] || "";

const labelPareceMesAno =
  /^[A-Za-zÀ-ÿ]{3}\/\d{2}$/.test(primeiroLabel);

const labelPareceAno =
  /^\d{4}$/.test(primeiroLabel);

if (
  period === "year" ||
  period === "lastYear"
) {
  unidadeSingular = "mês";
  unidadePlural = "meses";
}

if (
  period === "custom" &&
  labelPareceMesAno
) {
  unidadeSingular = "mês";
  unidadePlural = "meses";
}

if (
  period === "custom" &&
  labelPareceAno
) {
  unidadeSingular = "ano";
  unidadePlural = "anos";
}

if (
  period === "all" &&
  yearlyData.labels.length > 1
) {
  unidadeSingular = "ano";
  unidadePlural = "anos";
}

if (
  period === "all" &&
  yearlyData.labels.length <= 1 &&
  safeChartLabels.length > 0
) {
  unidadeSingular = "mês";
  unidadePlural = "meses";
}

let tituloImpacto = "Dias que Mais Impactaram o Período";

if (unidadeSingular === "mês") {
  tituloImpacto = "Meses que Mais Impactaram o Período";
}

if (unidadeSingular === "ano") {
  tituloImpacto = "Anos que Mais Impactaram o Período";
}

let nivelMaturidade = 0;

if (pontosFinanceiros === 0) {
  nivelMaturidade = 0;
} else if (pontosFinanceiros === 1) {
  nivelMaturidade = 1;
} else if (unidadeSingular === "mês") {
  nivelMaturidade = pontosFinanceiros >= 3 ? 3 : 2;
} else if (unidadeSingular === "ano") {
  nivelMaturidade = pontosFinanceiros >= 2 ? 3 : 2;
} else if (pontosFinanceiros <= 3) {
  nivelMaturidade = 2;
} else {
  nivelMaturidade = 3;
}

const despesasPeriodoTurbo = expenses.filter((item: any) => {
  const d = parseDateSafe(item.data);
  d.setHours(0, 0, 0, 0);

  if (period === "today") {
    return d >= startLast7Days && d <= endToday;
  }

  if (period === "week" || period === "weekPrev") {
    return d >= startWeek && d <= endWeek;
  }

  if (period === "month") {
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === "monthPrev") {
    return (
      d.getMonth() === previousMonthDate.getMonth() &&
      d.getFullYear() === previousMonthDate.getFullYear()
    );
  }

  if (period === "year") {
    return d.getFullYear() === now.getFullYear();
  }

  if (period === "lastYear") {
    return d.getFullYear() === now.getFullYear() - 1;
  }

  if (period === "all") {
    return true;
  }

  if (
    period === "custom" &&
    startDateInput &&
    endDateInput
  ) {
    const start = parseDateSafe(startDateInput);
    const end = parseDateSafe(endDateInput);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return d >= start && d <= end;
  }

  return false;
});

const hojeBaseTurbo = new Date(now);
hojeBaseTurbo.setHours(0, 0, 0, 0);

const lancamentosFuturosPeriodo = despesasPeriodoTurbo.filter(
  (item: any) => {
    const d = parseDateSafe(item.data);
    d.setHours(0, 0, 0, 0);

    return d > hojeBaseTurbo;
  }
);

const totalLancamentosFuturos = lancamentosFuturosPeriodo.reduce(
  (sum, item: any) => sum + Number(item.valor || 0),
  0
);

const percentualLancamentosFuturos =
  totalGrafico > 0
    ? (totalLancamentosFuturos / totalGrafico) * 100
    : 0;

const deveMostrarAvisoLancamentosFuturos =
  totalLancamentosFuturos > 0;

  
const categoriasPeriodo = Object.entries(
  despesasPeriodoTurbo.reduce(
    (acc: Record<string, number>, item: any) => {
      const categoria = item.categoria || "Outros";

      acc[categoria] =
        (acc[categoria] || 0) + Number(item.valor || 0);

      return acc;
    },
    {}
  )
)
  .map(([categoria, total]) => ({
    categoria,
    total: Number(total),
  }))
  .sort((a, b) => b.total - a.total);

const categoriaDominante = categoriasPeriodo[0];

const percentualCategoriaDominante =
  categoriaDominante && totalGrafico > 0
    ? (categoriaDominante.total / totalGrafico) * 100
    : 0;

   const resumoCategoriaDominantePeriodoAnterior = (() => {
  let despesasAnterior: any[] = [];

  if (period === "month") {
    despesasAnterior = expenses.filter((item: any) => {
      const d = parseDateSafe(item.data);

      return (
        d.getMonth() === previousMonthDate.getMonth() &&
        d.getFullYear() === previousMonthDate.getFullYear()
      );
    });
  }

  if (period === "week") {
    const inicioSemanaAnterior = new Date(startWeek);
    inicioSemanaAnterior.setDate(startWeek.getDate() - 7);

    const fimSemanaAnterior = new Date(endWeek);
    fimSemanaAnterior.setDate(endWeek.getDate() - 7);

    despesasAnterior = expenses.filter((item: any) => {
      const d = parseDateSafe(item.data);

      return d >= inicioSemanaAnterior && d <= fimSemanaAnterior;
    });
  }

  if (period === "year") {
    despesasAnterior = expenses.filter((item: any) => {
      const d = parseDateSafe(item.data);

      return d.getFullYear() === now.getFullYear() - 1;
    });
  }

  const totalAnterior = despesasAnterior.reduce(
    (sum, item: any) => sum + Number(item.valor || 0),
    0
  );

  const categoriasAnterior = Object.entries(
    despesasAnterior.reduce(
      (acc: Record<string, number>, item: any) => {
        const categoria = item.categoria || "Outros";

        acc[categoria] =
          (acc[categoria] || 0) + Number(item.valor || 0);

        return acc;
      },
      {}
    )
  )
    .map(([categoria, total]) => ({
      categoria,
      total: Number(total),
    }))
    .sort((a, b) => b.total - a.total);

  const dominante = categoriasAnterior[0];

  if (!dominante || totalAnterior <= 0) {
    return null;
  }

  return {
    categoria: dominante.categoria,
    total: dominante.total,
    percentual: (dominante.total / totalAnterior) * 100,
  };
})();

const categoriaDominantePeriodoAnterior =
  resumoCategoriaDominantePeriodoAnterior?.percentual ?? null;

const nomeCategoriaDominantePeriodoAnterior =
  resumoCategoriaDominantePeriodoAnterior?.categoria ?? "";

  const despesasPeriodoAnteriorComparacao = (() => {
  let despesasAnterior: any[] = [];

  if (period === "month") {
    despesasAnterior = expenses.filter((item: any) => {
      const d = parseDateSafe(item.data);

      return (
        d.getMonth() === previousMonthDate.getMonth() &&
        d.getFullYear() === previousMonthDate.getFullYear()
      );
    });
  }

  if (period === "week") {
    const inicioSemanaAnterior = new Date(startWeek);
    inicioSemanaAnterior.setDate(startWeek.getDate() - 7);

    const fimSemanaAnterior = new Date(endWeek);
    fimSemanaAnterior.setDate(endWeek.getDate() - 7);

    despesasAnterior = expenses.filter((item: any) => {
      const d = parseDateSafe(item.data);

      return d >= inicioSemanaAnterior && d <= fimSemanaAnterior;
    });
  }

  if (period === "year") {
    despesasAnterior = expenses.filter((item: any) => {
      const d = parseDateSafe(item.data);

      return d.getFullYear() === now.getFullYear() - 1;
    });
  }

  return despesasAnterior;
})();

const totalPeriodoAnteriorComparacao =
  despesasPeriodoAnteriorComparacao.reduce(
    (sum, item: any) => sum + Number(item.valor || 0),
    0
  );

const mapaCategoriasAtual = categoriasPeriodo.reduce(
  (acc: Record<string, number>, item: any) => {
    acc[item.categoria] = Number(item.total || 0);
    return acc;
  },
  {}
);

const mapaCategoriasAnterior =
  despesasPeriodoAnteriorComparacao.reduce(
    (acc: Record<string, number>, item: any) => {
      const categoria = item.categoria || "Outros";

      acc[categoria] =
        (acc[categoria] || 0) + Number(item.valor || 0);

      return acc;
    },
    {}
  );

  const categoriasParaComparar = Array.from(
  new Set([
    ...Object.keys(mapaCategoriasAtual),
    ...Object.keys(mapaCategoriasAnterior),
  ])
).filter((categoria) => categoria !== "Outros");

const comparacaoCategorias = categoriasParaComparar.map((categoria) => {
  const totalAtualCategoria = mapaCategoriasAtual[categoria] || 0;
  const totalAnteriorCategoria = mapaCategoriasAnterior[categoria] || 0;

  const percentualAtual =
    totalGrafico > 0
      ? (totalAtualCategoria / totalGrafico) * 100
      : 0;

  const percentualAnterior =
    totalPeriodoAnteriorComparacao > 0
      ? (totalAnteriorCategoria / totalPeriodoAnteriorComparacao) * 100
      : 0;

  return {
    categoria,
    percentualAtual,
    percentualAnterior,
    diferenca: percentualAtual - percentualAnterior,
  };
});

const categoriaQueMaisGanhouEspaco =
  comparacaoCategorias
    .filter(
      (item) =>
        item.percentualAtual >= 20 &&
        item.diferenca >= 15
    )
    .sort((a, b) => b.diferenca - a.diferenca)[0];

const categoriaQueMaisPerdeuEspaco =
  comparacaoCategorias
    .filter(
      (item) =>
        item.percentualAnterior >= 20 &&
        item.diferenca <= -15
    )
    .sort((a, b) => a.diferenca - b.diferenca)[0];

const houveMelhoraDistribuicao =
  categoriaDominantePeriodoAnterior !== null &&
  percentualCategoriaDominante > 0 &&
  percentualCategoriaDominante <
    categoriaDominantePeriodoAnterior - 10;

const deveMostrarCategoriaDominante =
  nivelMaturidade >= 3 &&
  !!categoriaDominante &&
  categoriaDominante.categoria !== "Outros" &&
  percentualCategoriaDominante >= 35;

let diasConsiderados = safeChartValues.length;

if (period === "month") {
  diasConsiderados = now.getDate();
}

if (period === "week") {
  const diaSemana = now.getDay();

  diasConsiderados =
    diaSemana === 0
      ? 7
      : diaSemana;
}

if (period === "weekPrev") {
  diasConsiderados = 7;
}

const diasSemGasto =
  diasConsiderados - diasComGasto;

  const percentualDiasSemGasto =
  diasConsiderados > 0
    ? (diasSemGasto / diasConsiderados) * 100
    : 0;

const top3Total = rankingFinanceiro
  .slice(0, 3)
  .reduce(
    (sum, item) => sum + item.value,
    0
  );

const percentualTop3 =
  totalGrafico > 0
    ? (top3Total / totalGrafico) * 100
    : 0;

const maiorDia = rankingFinanceiro[0];

const percentualMaiorDia =
  maiorDia && totalGrafico > 0
    ? (maiorDia.value / totalGrafico) * 100
    : 0;

let primeiraMetade = 0;
let segundaMetade = 0;

safeChartValues.forEach((value, index) => {
  if (Number(value) <= 0) return;

  if (index < safeChartValues.length / 2) {
    primeiraMetade += Number(value);
  } else {
    segundaMetade += Number(value);
  }
});

function escolherTexto(opcoes: string[], chave: string) {
  if (opcoes.length === 0) {
    return "";
  }

  const soma = chave
    .split("")
    .reduce((total, letra) => total + letra.charCodeAt(0), 0);

  return opcoes[soma % opcoes.length];
}

const chaveInsights = `${period}-${safeChartValues.join("|")}-${Math.round(
  totalGrafico
)}-${diasComGasto}`;

const contextoPeriodoInsight = (() => {
  if (period === "today") {
    return "nos últimos 7 dias";
  }

  if (period === "week") {
    return "nesta semana";
  }

  if (period === "weekPrev") {
    return "na semana passada";
  }

  if (period === "month") {
    return "neste mês";
  }

  if (period === "monthPrev") {
    return "no mês passado";
  }

  if (period === "year") {
    return "neste ano";
  }

  if (period === "lastYear") {
    return "no ano passado";
  }

  if (period === "custom") {
    return "no período personalizado";
  }

  if (period === "all") {
    return "desde o início";
  }

  return "neste período";
})();

const contextoPeriodoHumano = (() => {
  if (period === "today") {
    return "nos últimos 7 dias";
  }

  if (period === "week") {
    return "nesta semana";
  }

  if (period === "weekPrev") {
    return "na semana passada";
  }

  if (period === "month") {
    return "neste mês";
  }

  if (period === "monthPrev") {
    return "no mês passado";
  }

  if (period === "year") {
    return "ao longo deste ano";
  }

  if (period === "lastYear") {
    return "ao longo do ano passado";
  }

  if (period === "custom") {
    return "dentro do período selecionado";
  }

  if (period === "all") {
    return "em todo o histórico disponível";
  }

  return "neste período";
})();

const contextoPeriodoComDe = (() => {
  if (period === "today") {
    return "dos últimos 7 dias";
  }

  if (period === "week") {
    return "desta semana";
  }

  if (period === "weekPrev") {
    return "da semana passada";
  }

  if (period === "month") {
    return "deste mês";
  }

  if (period === "monthPrev") {
    return "do mês passado";
  }

  if (period === "year") {
    return "deste ano";
  }

  if (period === "lastYear") {
    return "do ano passado";
  }

  if (period === "custom") {
    return "do período personalizado";
  }

  if (period === "all") {
    return "desde o início";
  }

  return "deste período";
})();

const periodoAnteriorHumano = (() => {
  if (period === "week") {
    return "semana passada";
  }

  if (period === "month") {
    return "mês passado";
  }

  if (period === "year") {
    return "ano passado";
  }

  return "período anterior";
})();

const periodoAnteriorComPreposicao = (() => {
  if (period === "week") {
    return "à semana passada";
  }

  if (period === "month") {
    return "ao mês passado";
  }

  if (period === "year") {
    return "ao ano passado";
  }

  return "ao período anterior";
})();

const periodoAnteriorComparativo = (() => {
  if (period === "week") {
    return "a semana passada";
  }

  if (period === "month") {
    return "o mês passado";
  }

  if (period === "year") {
    return "o ano passado";
  }

  return "o período anterior";
})();

const periodoAnteriorComEm = (() => {
  if (period === "week") {
    return "na semana passada";
  }

  if (period === "month") {
    return "no mês passado";
  }

  if (period === "year") {
    return "no ano passado";
  }

  return "no período anterior";
})();

const periodoAtualComparativo = (() => {
  if (period === "week") {
    return "nesta semana";
  }

  if (period === "month") {
    return "neste mês";
  }

  if (period === "year") {
    return "neste ano";
  }

  return "agora";
})();

const textoSemMovimentacao = escolherTexto(
  [
    "Nenhuma movimentação financeira foi identificada neste período.",

    "Ainda não há gastos registrados no período selecionado.",

    "O Enxergaí não encontrou movimentações financeiras para este período.",

    "Este período ainda está vazio. Assim que houver registros, o Enxergaí começa a mostrar o que está acontecendo.",

    "Por enquanto, não há movimentações para analisar neste período.",

    "Ainda não apareceu nenhum gasto aqui. Quando você registrar, o Enxergaí vai começar a transformar esses dados em entendimento.",

    "Sem registros neste período, ainda não há caminho financeiro para enxergar.",

    "Este período ainda não tem dados suficientes para mostrar movimentações.",
  ],
  `${chaveInsights}-sem-movimentacao`
);

const textoDesbloquearAnalises = escolherTexto(
  [
    "Registre seus gastos para desbloquear análises inteligentes do Enxergaí.",

    "Assim que houver registros, o Enxergaí começará a transformar seus dados em entendimento.",

    "Com novos registros, o Enxergaí poderá gerar análises mais úteis para você.",

    "Cada gasto registrado ajuda o Enxergaí a enxergar melhor seu comportamento financeiro.",

    "Comece registrando os gastos do dia. Aos poucos, o Enxergaí mostrará padrões que talvez passem despercebidos.",

    "Quanto mais você registra, mais fácil fica entender para onde o dinheiro está indo.",

    "O primeiro passo é simples: registrar. Depois disso, o Enxergaí ajuda você a enxergar o que os números querem dizer.",

    "Com alguns registros, o Enxergaí já começa a montar uma visão mais clara do período.",
  ],
  `${chaveInsights}-desbloquear`
);

const textoPrimeiraMovimentacao = escolherTexto(
  [
    `Apenas um ${unidadeSingular} com movimentação financeira foi identificado neste período.`,

    `Este período ainda possui somente um ${unidadeSingular} com gasto registrado.`,

    `Até agora, há movimentação financeira em apenas um ${unidadeSingular} deste período.`,

    `O Enxergaí já encontrou o primeiro ponto com gasto neste período, mas ainda precisa de mais registros para enxergar padrões.`,

    `Existe apenas um ${unidadeSingular} com movimentação. É um começo, mas ainda é cedo para conclusões maiores.`,

    `O primeiro registro já apareceu. Com mais movimentações, o Enxergaí conseguirá mostrar uma leitura mais completa.`,

    `Ainda temos pouca base neste período: só um ${unidadeSingular} com gasto registrado.`,

    `Por enquanto, este período mostra apenas um ponto de movimentação financeira.`,
  ],
  `${chaveInsights}-primeira`
);

const textoContinuarRegistrando = escolherTexto(
  [
    "Continue registrando seus gastos para que o Enxergaí possa identificar padrões e gerar análises mais completas.",

    "Com mais registros, o Enxergaí conseguirá enxergar melhor seu comportamento financeiro.",

    "Quanto mais informações forem registradas, mais precisas serão as análises do Enxergaí.",

    "Continue alimentando o Enxergaí com seus gastos. Aos poucos, os padrões começam a aparecer.",

    "Registrar com constância ajuda o Enxergaí a separar gasto pontual de comportamento repetido.",

    "Cada novo registro melhora a leitura do período e aproxima o Enxergaí de uma análise mais útil.",

    "Com poucos registros, o Enxergaí ainda enxerga pouco. Com mais dados, a leitura fica muito mais clara.",

    "Continue registrando. O valor do Enxergaí cresce conforme ele aprende com seus próprios dados.",
  ],
  `${chaveInsights}-continuar`
);

const textoDadosInsuficientes = escolherTexto(
  [
    "Ainda não existem dados suficientes para gerar análises financeiras confiáveis.",

    "O período ainda possui poucos dados para conclusões financeiras mais completas.",

    "O Enxergaí ainda precisa de mais movimentações neste período para gerar uma análise confiável.",

    "Ainda é cedo para tirar grandes conclusões. Com mais registros, o Enxergaí poderá enxergar padrões com mais segurança.",

    "Os dados deste período ainda são poucos. O ideal é continuar registrando para melhorar a leitura.",

    "Por enquanto, o Enxergaí evita conclusões fortes porque ainda há pouca informação registrada.",

    "Ainda falta volume de dados para uma análise mais firme. Continue registrando para liberar leituras mais completas.",

    "O Enxergaí prefere esperar mais dados a mostrar uma conclusão apressada.",
  ],
  `${chaveInsights}-insuficiente`
);

const textoProximoPassoPoucosDados = escolherTexto(
  [
    "Continue registrando seus gastos para que o Enxergaí consiga identificar padrões com mais segurança.",

    "Com mais alguns registros, a leitura do período ficará mais clara e útil.",

    "O próximo passo é simples: manter os registros em dia para o Enxergaí enxergar melhor o período.",

    "Quanto mais o período for preenchido, mais fácil será separar gasto pontual de comportamento repetido.",

    "Mais registros ajudam o Enxergaí a transformar movimentações soltas em uma leitura financeira mais completa.",

    "Continue alimentando o Enxergaí. Aos poucos, os números começam a mostrar um caminho mais claro.",
  ],
  `${chaveInsights}-proximo-passo-poucos-dados`
);

const labelMaiorImpactoCorrigido = (() => {
  if (!maiorDia?.label) {
    return "";
  }

  if (unidadeSingular === "mês") {
    const partesLabel = maiorDia.label.split("/");
    const mesOriginal = partesLabel[0];
    const anoOriginal = partesLabel[1];

    const mapaMeses: Record<string, string> = {
      Jan: "Janeiro",
      Fev: "Fevereiro",
      Mar: "Março",
      Abr: "Abril",
      Mai: "Maio",
      Jun: "Junho",
      Jul: "Julho",
      Ago: "Agosto",
      Set: "Setembro",
      Out: "Outubro",
      Nov: "Novembro",
      Dez: "Dezembro",
    };

    const mesCompleto =
      mapaMeses[mesOriginal] || mesOriginal;

    if (anoOriginal && anoOriginal.length === 4) {
      return `${mesCompleto}/${anoOriginal}`;
    }

    if (anoOriginal && anoOriginal.length === 2) {
      return `${mesCompleto}/20${anoOriginal}`;
    }

    if (period === "year") {
      return `${mesCompleto}/${now.getFullYear()}`;
    }

    if (period === "lastYear") {
      return `${mesCompleto}/${now.getFullYear() - 1}`;
    }

    return mesCompleto;
  }

  return maiorDia.label;
})();

const textoMaiorImpacto = maiorDia
  ? escolherTexto(
      [
        `O ${unidadeSingular} de maior impacto financeiro deste período foi ${labelMaiorImpactoCorrigido}, responsável por ${percentualMaiorDia.toFixed(
          1
        )}% do total gasto.`,

        `${labelMaiorImpactoCorrigido} concentrou ${percentualMaiorDia.toFixed(
          1
        )}% de todo o valor gasto neste período.`,

        `O maior impacto financeiro do período ocorreu no ${labelMaiorImpactoCorrigido}, representando ${percentualMaiorDia.toFixed(
          1
        )}% do total.`,

        `${labelMaiorImpactoCorrigido} foi o ponto que mais pesou no período, com ${percentualMaiorDia.toFixed(
          1
        )}% do total gasto.`,

        `O principal peso financeiro apareceu em ${labelMaiorImpactoCorrigido}, que respondeu por ${percentualMaiorDia.toFixed(
          1
        )}% do total.`,

        `Se for olhar por onde começar, ${labelMaiorImpactoCorrigido} merece atenção: esse ponto representou ${percentualMaiorDia.toFixed(
          1
        )}% dos gastos do período.`,

        `${labelMaiorImpactoCorrigido} teve o maior peso dentro do período analisado, concentrando ${percentualMaiorDia.toFixed(
          1
        )}% do dinheiro gasto.`,

        `O gasto ficou mais forte em ${labelMaiorImpactoCorrigido}, que sozinho representou ${percentualMaiorDia.toFixed(
          1
        )}% do total.`,
      ],
      `${chaveInsights}-maior-impacto`
    )
  : "";

const textoTop3Impacto = escolherTexto(
  [
    `Os 3 ${unidadePlural} que mais impactaram o período representam ${percentualTop3.toFixed(
      0
    )}% de todo o valor gasto.`,

    `A soma dos 3 principais ${unidadePlural} representa ${percentualTop3.toFixed(
      0
    )}% dos gastos do período.`,

    `Os 3 maiores impactos financeiros concentram ${percentualTop3.toFixed(
      0
    )}% do total analisado.`,

    `Boa parte do dinheiro ficou nos 3 principais ${unidadePlural}, que juntos somaram ${percentualTop3.toFixed(
      0
    )}% do total.`,

    `Os 3 pontos de maior peso responderam por ${percentualTop3.toFixed(
      0
    )}% dos gastos do período.`,

    `Quando olhamos os principais impactos, os 3 maiores ${unidadePlural} concentraram ${percentualTop3.toFixed(
      0
    )}% do dinheiro gasto.`,

    `O período teve uma concentração importante nos 3 maiores ${unidadePlural}, que somaram ${percentualTop3.toFixed(
      0
    )}% do total.`,

    `Os maiores pesos do período ficaram em 3 ${unidadePlural}, responsáveis por ${percentualTop3.toFixed(
      0
    )}% dos gastos.`,
  ],
  `${chaveInsights}-top3`
);


const deveMostrarTop3Impacto =
  !(unidadeSingular !== "dia" && pontosFinanceiros <= 3);

  const deveMostrarMaiorImpacto =
  !(unidadeSingular !== "dia" && pontosFinanceiros <= 3);

 const maiorDiaLabelCorrigido = (() => {
  if (!maiorDia?.label) {
    return "";
  }

  if (unidadeSingular === "mês") {
    const partesLabel = maiorDia.label.split("/");
    const mesOriginal = partesLabel[0];
    const anoOriginal = partesLabel[1];

    const mapaMeses: Record<string, string> = {
      Jan: "Janeiro",
      Fev: "Fevereiro",
      Mar: "Março",
      Abr: "Abril",
      Mai: "Maio",
      Jun: "Junho",
      Jul: "Julho",
      Ago: "Agosto",
      Set: "Setembro",
      Out: "Outubro",
      Nov: "Novembro",
      Dez: "Dezembro",

      Janeiro: "Janeiro",
      Fevereiro: "Fevereiro",
      Março: "Março",
      Abril: "Abril",
      Maio: "Maio",
      Junho: "Junho",
      Julho: "Julho",
      Agosto: "Agosto",
      Setembro: "Setembro",
      Outubro: "Outubro",
      Novembro: "Novembro",
      Dezembro: "Dezembro",
    };

    const mesCompleto =
      mapaMeses[mesOriginal] || mesOriginal;

    if (anoOriginal && anoOriginal.length === 4) {
      return `${mesCompleto}/${anoOriginal}`;
    }

    if (anoOriginal && anoOriginal.length === 2) {
      return `${mesCompleto}/20${anoOriginal}`;
    }

    if (period === "year") {
      return `${mesCompleto}/${now.getFullYear()}`;
    }

    if (period === "lastYear") {
      return `${mesCompleto}/${now.getFullYear() - 1}`;
    }

    return mesCompleto;
  }

  return maiorDia.label;
})();

const textoPoucosPontosMensais = escolherTexto(
  [
    `O período analisado possui movimentação em ${pontosFinanceiros} ${unidadePlural}, com maior impacto em ${maiorDiaLabelCorrigido}.`,
    `Entre os ${unidadePlural} analisados, ${maiorDiaLabelCorrigido} foi o principal ponto de impacto financeiro.`,
    `${maiorDiaLabelCorrigido} se destacou como o ${unidadeSingular} de maior peso dentro deste período.`,
  ],
  `${chaveInsights}-poucos-pontos-mensais`
);

const textoConcentracaoAlta = escolherTexto(
  [
    `Grande parte dos gastos ${contextoPeriodoInsight} ficou concentrada nos pontos de maior valor. Isso mostra onde o dinheiro pesou mais.`,

    `Boa parte do dinheiro gasto ${contextoPeriodoInsight} apareceu nos maiores registros do período.`,

    `Os maiores valores puxaram boa parte dos gastos ${contextoPeriodoInsight}. Vale olhar esses registros com mais atenção.`,

    `Uma parte importante do dinheiro gasto ${contextoPeriodoInsight} ficou nos pontos de maior impacto. É por ali que a análise deve começar.`,

    `Alguns registros tiveram peso maior no resultado ${contextoPeriodoInsight}. Enxergar esses pontos ajuda a entender o que mais mexeu no total.`,

    `O gasto ${contextoPeriodoInsight} teve alguns pontos de maior valor. Esses registros explicam boa parte do resultado do período.`,

    `Os maiores impactos ${contextoPeriodoInsight} vieram dos registros de maior peso. Eles ajudam a mostrar onde o dinheiro ficou mais concentrado.`,

    `O dinheiro gasto ${contextoPeriodoInsight} teve alguns picos importantes. Vale olhar com atenção o que aconteceu nesses registros.`,
  ],
  `${chaveInsights}-concentracao-alta`
);

const textoConcentracaoBaixa = escolherTexto(
  [
    `Os gastos ${contextoPeriodoInsight} ficaram mais divididos, sem um único ponto puxando grande parte do total.`,

    `Não houve um ponto isolado dominando os gastos ${contextoPeriodoInsight}. Isso deixa a leitura do período mais equilibrada.`,

    `O dinheiro gasto ${contextoPeriodoInsight} apareceu de forma mais distribuída entre os registros.`,

    `Os gastos ficaram mais espalhados ao longo do período, sem um único registro dominando muito o total.`,

    `O dinheiro gasto ${contextoPeriodoInsight} não ficou preso em poucos registros de maior peso.`,

    `Não existiu um único momento puxando quase todo o gasto ${contextoPeriodoInsight}. Isso ajuda a enxergar o período com mais equilíbrio.`,

    `Os gastos ${contextoPeriodoInsight} ficaram mais abertos, sem depender tanto de poucos pontos de maior valor.`,

    `O período teve uma distribuição mais equilibrada dos gastos, sem um pico dominando muito o total.`,
  ],
  `${chaveInsights}-concentracao-baixa`
);

const textoConcentracaoModerada = escolherTexto(
  [
    `Os gastos ${contextoPeriodoInsight} não ficaram totalmente concentrados, mas os principais registros ainda tiveram peso importante no período.`,

    `Alguns pontos tiveram peso maior ${contextoPeriodoInsight}, mesmo sem dominar todo o resultado. Vale observar os maiores registros.`,

    `O dinheiro ${contextoPeriodoInsight} ficou parcialmente concentrado nos maiores impactos. Isso mostra onde começar a análise sem ignorar o restante.`,

    `Os principais registros tiveram bastante influência ${contextoPeriodoInsight}, mas não chegaram a carregar quase todo o período sozinhos.`,

    `Existe uma concentração moderada dos gastos ${contextoPeriodoInsight}: os maiores pontos pesaram, mas o restante do período também teve participação.`,
  ],
  `${chaveInsights}-concentracao-moderada`
);

const deveMostrarConcentracaoModerada =
  percentualTop3 >= 50 &&
  percentualTop3 < 70;

const diferencaEntreMetades =
  primeiraMetade > 0
    ? ((segundaMetade - primeiraMetade) / primeiraMetade) * 100
    : segundaMetade > 0
    ? 100
    : 0;

let tipoTendenciaPeriodo:
  | "aumento-forte"
  | "aumento-moderado"
  | "queda-forte"
  | "queda-moderada"
  | "estavel" = "estavel";

if (diferencaEntreMetades >= 40) {
  tipoTendenciaPeriodo = "aumento-forte";
} else if (diferencaEntreMetades >= 15) {
  tipoTendenciaPeriodo = "aumento-moderado";
} else if (diferencaEntreMetades <= -40) {
  tipoTendenciaPeriodo = "queda-forte";
} else if (diferencaEntreMetades <= -15) {
  tipoTendenciaPeriodo = "queda-moderada";
}

const textoTendenciaPeriodo = escolherTexto(
  tipoTendenciaPeriodo === "aumento-forte"
    ? [
        "Os gastos ficaram mais fortes na parte final do período. Vale observar se esse aumento foi planejado ou se aconteceu sem perceber.",
        `A parte final ${contextoPeriodoComDe} concentrou mais gastos. Esse é um bom ponto para revisar se houve contas concentradas, compras extras ou gastos não planejados.`,
        `Os gastos cresceram bastante na parte final ${contextoPeriodoComDe}, indicando um aumento importante no impacto financeiro mais recente.`,
      ]
    : tipoTendenciaPeriodo === "aumento-moderado"
    ? [
        "Houve aumento nos gastos na parte final do período, mas sem uma mudança muito brusca.",
        `Os gastos ficaram um pouco mais altos na parte final ${contextoPeriodoComDe}. Vale acompanhar se isso começa a se repetir.`,
        "A parte final do período teve mais gastos que a parte inicial, indicando uma leve alta no comportamento financeiro.",
      ]
    : tipoTendenciaPeriodo === "queda-forte"
    ? [
        `Os gastos diminuíram bastante na parte final ${contextoPeriodoComDe}. Se essa redução foi intencional, pode ser um bom sinal de controle.`,
        `A parte final ${contextoPeriodoComDe} teve bem menos gastos que a parte inicial. Vale observar se isso representa economia ou apenas menos registros.`,
        `Houve uma queda importante nos gastos na parte final ${contextoPeriodoComDe}, reduzindo o impacto financeiro mais recente.`,
      ]
    : tipoTendenciaPeriodo === "queda-moderada"
    ? [
        "Os gastos apresentaram queda na parte final do período.",
        "A parte final do período teve menos gastos que a parte inicial, indicando uma redução moderada.",
        "Os valores ficaram menores na parte final do período. Isso pode ajudar no planejamento, se a redução foi intencional.",
      ]

    : [
  `O começo e o fim ${contextoPeriodoComDe} ficaram parecidos em valor, sem uma virada forte nos gastos.`,

  "Não houve grande diferença entre a primeira e a segunda parte do período analisado.",

  "Os gastos ficaram próximos entre o começo e o fim do período, o que indica uma leitura mais estável.",

  `Os valores ficaram mais equilibrados entre as duas partes ${contextoPeriodoComDe}, sem uma mudança brusca no comportamento dos gastos.`,

  "O período não mostrou uma grande aceleração nem uma grande queda entre o começo e o fim.",
],

  `${chaveInsights}-tendencia-periodo`
);

const pontosComMovimentacao = safeChartValues
  .map((value, index) => ({
    value: Number(value),
    index,
  }))
  .filter((item) => item.value > 0);

const ultimoPontoComMovimentacao =
  pontosComMovimentacao[pontosComMovimentacao.length - 1];

const penultimoPontoComMovimentacao =
  pontosComMovimentacao[pontosComMovimentacao.length - 2];

const variacaoMovimentoRecente =
  penultimoPontoComMovimentacao &&
  penultimoPontoComMovimentacao.value > 0
    ? ((ultimoPontoComMovimentacao.value -
        penultimoPontoComMovimentacao.value) /
        penultimoPontoComMovimentacao.value) *
      100
    : 0;

const movimentoRecenteRepeteTendencia =
  tipoTendenciaPeriodo === "aumento-forte" ||
  tipoTendenciaPeriodo === "queda-forte";

const deveMostrarMovimentoRecente =
  nivelMaturidade >= 3 &&
  pontosComMovimentacao.length >= 2 &&
  !!ultimoPontoComMovimentacao &&
  !!penultimoPontoComMovimentacao &&
  !movimentoRecenteRepeteTendencia;

let tipoMovimentoRecente:
  | "subiu-forte"
  | "subiu-moderado"
  | "caiu-forte"
  | "caiu-moderado"
  | "estavel" = "estavel";

if (variacaoMovimentoRecente >= 40) {
  tipoMovimentoRecente = "subiu-forte";
} else if (variacaoMovimentoRecente >= 15) {
  tipoMovimentoRecente = "subiu-moderado";
} else if (variacaoMovimentoRecente <= -40) {
  tipoMovimentoRecente = "caiu-forte";
} else if (variacaoMovimentoRecente <= -15) {
  tipoMovimentoRecente = "caiu-moderado";
}

const finalDoPeriodoComMuitosZeros = (() => {
  if (safeChartValues.length < 6) {
    return false;
  }

  const ultimoIndiceComGasto = safeChartValues.reduce(
    (ultimo, value, index) =>
      Number(value) > 0 ? index : ultimo,
    -1
  );

  if (ultimoIndiceComGasto < 0) {
    return false;
  }

  const pontosSemGastoNoFinal =
    safeChartValues.length - 1 - ultimoIndiceComGasto;

  if (unidadeSingular === "mês") {
    return pontosSemGastoNoFinal >= 2;
  }

  if (unidadeSingular === "dia") {
    return pontosSemGastoNoFinal >= 3;
  }

  return false;
})();

const deveTratarQuedaComoPossivelFaltaRegistro =
  finalDoPeriodoComMuitosZeros &&
  (
    tipoTendenciaPeriodo === "queda-forte" ||
    tipoTendenciaPeriodo === "queda-moderada"
  );

const alvoComparacaoMovimento =
  unidadeSingular === "mês"
    ? "os dois últimos meses com gasto neste período"
    : unidadeSingular === "ano"
    ? "os dois últimos anos com gasto neste período"
    : "os dois últimos dias com gasto neste período";

const alvoComparacaoMovimentoComEntre =
  unidadeSingular === "mês"
    ? "entre os dois últimos meses com gasto neste período"
    : unidadeSingular === "ano"
    ? "entre os dois últimos anos com gasto neste período"
    : "entre os dois últimos dias com gasto neste período";

const textoMovimentoRecente = escolherTexto(
  tipoMovimentoRecente === "subiu-forte"
    ? [
        `Entre os dois últimos ${unidadePlural} com gasto, o valor mais recente foi bem maior. Vale observar o que aconteceu nesse ${unidadeSingular}.`,
        `O último ${unidadeSingular} com gasto ficou bem acima do anterior. Esse é um ponto que merece atenção.`,
        `Houve uma alta forte entre os dois últimos ${unidadePlural} com gasto. Vale conferir se foi algo planejado ou um gasto que passou despercebido.`,
      ]
    : tipoMovimentoRecente === "subiu-moderado"
    ? [
        `Entre os dois últimos ${unidadePlural} com gasto, o valor mais recente ficou um pouco maior.`,
        `O último ${unidadeSingular} com gasto ficou acima do anterior, mas sem uma mudança muito brusca.`,
        `Houve uma alta moderada entre os dois últimos ${unidadePlural} com movimentação.`,
      ]
    : tipoMovimentoRecente === "caiu-forte"
    ? [
        `Entre os dois últimos ${unidadePlural} com gasto, o valor mais recente foi bem menor. Se essa redução foi intencional, pode ser um bom sinal.`,
        `O último ${unidadeSingular} com gasto ficou bem abaixo do anterior. Vale observar se isso representa economia ou apenas menos registros.`,
        `Houve uma queda forte entre os dois últimos ${unidadePlural} com gasto.`,
      ]
    : tipoMovimentoRecente === "caiu-moderado"
    ? [
        `Entre os dois últimos ${unidadePlural} com gasto, o valor mais recente ficou menor.`,
        `O último ${unidadeSingular} com gasto ficou abaixo do anterior, indicando uma redução moderada.`,
        `Houve uma redução moderada entre os dois últimos ${unidadePlural} com movimentação.`,
      ]
    : [
        `Entre os dois últimos ${unidadePlural} com gasto, os valores ficaram próximos.`,
        `O último ${unidadeSingular} com gasto ficou parecido com o anterior.`,
        `Não houve grande diferença entre os dois últimos ${unidadePlural} com movimentação.`,
      ],
  `${chaveInsights}-movimento-recente`
);

const periodoTemTendenciaDeQueda =
  tipoTendenciaPeriodo === "queda-forte" ||
  tipoTendenciaPeriodo === "queda-moderada";

const deveMostrarAlertaTendencia =
  nivelMaturidade >= 3 &&
  !deveMostrarAvisoLancamentosFuturos &&
  !deveTratarQuedaComoPossivelFaltaRegistro &&
  !periodoTemTendenciaDeQueda &&
  (
    tipoTendenciaPeriodo === "aumento-forte" ||
    tipoTendenciaPeriodo === "aumento-moderado" ||
    tipoMovimentoRecente === "subiu-forte" ||
    tipoMovimentoRecente === "subiu-moderado"
  );

const textoAlertaTendencia = escolherTexto(
  tipoTendenciaPeriodo === "aumento-forte" ||
    tipoMovimentoRecente === "subiu-forte"
    ? [
        "Esse aumento merece atenção. Vale olhar os maiores registros do fim do período e separar o que foi planejado do que apareceu fora do esperado.",

        "Quando os gastos sobem com força, o melhor caminho é identificar o que puxou essa alta: conta concentrada, compra necessária ou gasto por impulso.",

        "A alta no fim do período pode esconder poucos gastos grandes. Enxergar esses registros ajuda a entender se foi algo pontual ou um novo padrão.",

        "Esse crescimento dos gastos é um sinal para revisar os últimos lançamentos e entender se houve necessidade, oportunidade ou falta de planejamento.",
      ]
    : [
        "Houve aumento nos gastos. Vale acompanhar se isso foi algo pontual ou se começa a se repetir nos próximos períodos.",

        "Esse crescimento não parece tão brusco, mas já merece atenção para evitar que vire um padrão.",

        "Os gastos subiram um pouco. Observar os registros mais recentes pode ajudar a entender o que mudou.",

        "Quando os gastos começam a subir, acompanhar cedo ajuda a corrigir o caminho antes que o valor pese mais.",
      ],
  `${chaveInsights}-alerta-tendencia`
);

const deveMostrarLeituraReducao =
  nivelMaturidade >= 3 &&
  !deveMostrarAvisoLancamentosFuturos &&
  (
    tipoTendenciaPeriodo === "queda-forte" ||
    tipoTendenciaPeriodo === "queda-moderada" ||
    tipoMovimentoRecente === "caiu-forte" ||
    tipoMovimentoRecente === "caiu-moderado"
  );

const textoLeituraReducao = escolherTexto(
  tipoTendenciaPeriodo === "queda-forte" ||
    tipoMovimentoRecente === "caiu-forte"
    ? [
        "Essa queda precisa ser lida com cuidado: pode ser economia real, mas também pode indicar falta de registros.",

        "Se essa redução veio de escolhas conscientes, pode ser um bom sinal. Se veio de falta de lançamento, a leitura fica menos confiável.",

        "Antes de entender essa queda como melhora, vale confirmar se os registros estão completos e se os gastos realmente diminuíram.",

        "A redução pode indicar avanço no controle, mas o Enxergaí precisa de registros completos para enxergar isso com mais segurança.",

        "Quando os valores caem bastante, o ideal é separar duas possibilidades: menor consumo de verdade ou registros que ficaram de fora.",
      ]
    : [
        "Houve redução nos gastos. Se essa queda foi intencional, pode ser um sinal positivo de controle.",

        "Os valores ficaram menores, mas vale acompanhar se isso representa economia real ou apenas menos registros.",

        "Essa redução pode ajudar no planejamento, principalmente se veio de escolhas conscientes.",

        "Quando os valores diminuem, observar a constância dos registros ajuda a entender se houve economia ou apenas menos movimentações anotadas.",

        "A queda foi mais moderada. Vale acompanhar os próximos registros para entender se isso vira um padrão.",
      ],
  `${chaveInsights}-leitura-reducao`
);

const textoPossivelFaltaRegistroNoFinal = escolherTexto(
  [
    "A parte final do período aparece com pouca ou nenhuma movimentação registrada. Antes de entender isso como queda nos gastos, vale confirmar se os registros estão completos.",

    "O fim do período está com vários pontos sem movimentação. Isso pode indicar menos consumo, mas também pode ser falta de registros.",

    "Como o final do período tem muitos pontos zerados, o Enxergaí evita tratar isso automaticamente como economia.",

    "Antes de interpretar a queda no fim do período como melhora, vale conferir se os gastos realmente diminuíram ou se alguns lançamentos ficaram de fora.",
  ],
  `${chaveInsights}-possivel-falta-registro-final`
);

  const subcategoriasDaCategoriaDominante =
  categoriaDominante
    ? Object.entries(
        despesasPeriodoTurbo
          .filter(
            (item: any) =>
              (item.categoria || "Outros") ===
              categoriaDominante.categoria
          )
          .reduce(
            (
              acc: Record<string, number>,
              item: any
            ) => {
              const subcategoria =
                item.subcategoria || "Sem detalhe";

              acc[subcategoria] =
                (acc[subcategoria] || 0) +
                Number(item.valor || 0);

              return acc;
            },
            {}
          )
      )
        .map(([subcategoria, total]) => ({
          subcategoria,
          total: Number(total),
        }))
        .sort((a, b) => b.total - a.total)
    : [];

const subcategoriaDominante =
  subcategoriasDaCategoriaDominante[0];

const percentualSubcategoriaDominante =
  categoriaDominante &&
  subcategoriaDominante &&
  categoriaDominante.total > 0
    ? (subcategoriaDominante.total /
        categoriaDominante.total) *
      100
    : 0;

const deveMostrarSubcategoriaDominante =
  deveMostrarCategoriaDominante &&
  !!subcategoriaDominante &&
  subcategoriaDominante.subcategoria !== "Sem detalhe" &&
  percentualSubcategoriaDominante >= 40;

const textoSubcategoriaDominante =
  subcategoriaDominante
    ? escolherTexto(
        percentualSubcategoriaDominante >= 70
          ? [
              `Dentro de ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} apareceu como principal destino dos valores registrados.`,

              `${subcategoriaDominante.subcategoria} se destacou dentro de ${categoriaDominante?.categoria}, representando ${percentualSubcategoriaDominante.toFixed(
                0
              )}% dessa categoria.`,

              `Ao detalhar ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} aparece como o destaque financeiro mais relevante.`,

              `A maior parte dos gastos em ${categoriaDominante?.categoria} ficou ligada a ${subcategoriaDominante.subcategoria}. Esse detalhe merece atenção.`,

              `${subcategoriaDominante.subcategoria} puxou boa parte do valor dentro de ${categoriaDominante?.categoria}. Isso mostra onde o dinheiro mais pesou nessa categoria.`,

              `Quando olhamos só para ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} aparece como o ponto mais forte.`,

              `${subcategoriaDominante.subcategoria} ficou no centro dos gastos de ${categoriaDominante?.categoria}, mostrando onde houve maior impacto dentro dessa área.`,

              `O principal detalhe dentro de ${categoriaDominante?.categoria} foi ${subcategoriaDominante.subcategoria}. É ali que vale olhar com mais calma.`,
            ]
          : [
              `Dentro de ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} foi o detalhe que mais pesou.`,

              `${subcategoriaDominante.subcategoria} teve o maior impacto dentro de ${categoriaDominante?.categoria}.`,

              `Ao detalhar ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} aparece como o principal ponto de atenção.`,

              `${subcategoriaDominante.subcategoria} foi o detalhe mais relevante dentro de ${categoriaDominante?.categoria}.`,

              `Entre os detalhes de ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} foi o que mais chamou atenção.`,

              `${subcategoriaDominante.subcategoria} aparece como o principal detalhe para entender melhor os gastos em ${categoriaDominante?.categoria}.`,

              `O maior peso dentro de ${categoriaDominante?.categoria} ficou em ${subcategoriaDominante.subcategoria}.`,

              `Ao abrir melhor ${categoriaDominante?.categoria}, o destaque ficou com ${subcategoriaDominante.subcategoria}.`,
            ],
        `${chaveInsights}-subcategoria-dominante`
      )
    : "";

    function gerarOrientacaoPraticaCategoria(
  categoria?: string,
  subcategoria?: string
) {
  if (!categoria || !subcategoria) {
    return "";
  }

if (
  categoria === "Alimentação" &&
  subcategoria === "Supermercado"
) {
  return escolherTexto(
    [
      "Para começar de forma simples, observe se as compras estão sendo feitas com lista e se alguns itens podem ser trocados por opções mais econômicas.",
      "Pequenas trocas em itens comprados com frequência podem gerar economia sem mudar tudo de uma vez.",
      "Lista de compras, comparação de preços e atenção aos itens repetidos podem ajudar a enxergar oportunidades no supermercado.",
    ],
    `${chaveInsights}-orientacao-supermercado`
  );
}

  if (
    categoria === "Alimentação" &&
    (subcategoria === "Restaurante" ||
      subcategoria === "Delivery" ||
      subcategoria === "Lanche")
  ) {
    return escolherTexto(
      [
        "Vale observar a frequência desses gastos. Às vezes, reduzir poucas compras fora de casa já melhora o resultado do mês.",
        "Esse detalhe pode esconder gastos pequenos que se repetem. Observar a frequência pode ajudar a encontrar economia.",
        "Se esse tipo de gasto aparece muitas vezes, pode ser um bom ponto para ajustar sem precisar cortar tudo.",
      ],
      `${chaveInsights}-orientacao-alimentacao-fora`
    );
  }

  if (
    categoria === "Transporte" &&
    (subcategoria === "Gasolina" ||
      subcategoria === "Etanol" ||
      subcategoria === "Diesel")
  ) {
    return escolherTexto(
      [
        "Vale observar se os deslocamentos estão concentrando muito dinheiro. Planejar trajetos pode ajudar a reduzir gastos com combustível.",
        "Combustível costuma pesar quando os deslocamentos aumentam. Olhar rotas e frequência pode mostrar oportunidades de economia.",
        "Se o combustível está pesando, pode valer revisar deslocamentos repetidos e pensar em alternativas quando possível.",
      ],
      `${chaveInsights}-orientacao-combustivel`
    );
  }

  if (
    categoria === "Transporte" &&
    (subcategoria === "Uber" ||
      subcategoria === "99" ||
      subcategoria === "Táxi")
  ) {
    return escolherTexto(
      [
        "Vale observar se as corridas estão acontecendo por necessidade ou por hábito. Algumas trocas podem reduzir o gasto sem grande esforço.",
        "Corridas por aplicativo podem parecer pequenas separadas, mas somadas podem pesar. Vale acompanhar a frequência.",
        "Se esse gasto aparece muito, pode ser um bom ponto para planejar melhor alguns deslocamentos.",
      ],
      `${chaveInsights}-orientacao-aplicativo-transporte`
    );
  }

  if (
    categoria === "Contas da Casa" &&
    subcategoria === "Energia Elétrica"
  ) {
    return escolherTexto(
      [
        "Energia elétrica é um bom ponto para observar hábitos da casa. Pequenas mudanças no uso diário podem ajudar no resultado.",
        "Vale acompanhar se a conta de energia está subindo. Isso pode indicar mudança de consumo ou algum aparelho pesando mais.",
        "Se energia está entre os maiores gastos, observar horários, equipamentos e uso diário pode trazer boas pistas.",
      ],
      `${chaveInsights}-orientacao-energia`
    );
  }

  if (
    categoria === "Contas da Casa" &&
    (subcategoria === "Internet" ||
      subcategoria === "Celular")
  ) {
    return escolherTexto(
      [
        "Vale revisar se o plano contratado ainda faz sentido para o uso atual. Às vezes existe economia sem perder o serviço.",
        "Planos de internet e celular mudam bastante. Comparar opções de tempos em tempos pode evitar pagar mais do que precisa.",
        "Se esse gasto pesa, pode valer conferir se existe plano mais adequado ao consumo real.",
      ],
      `${chaveInsights}-orientacao-planos`
    );
  }

  if (
    categoria === "Educação" &&
    (subcategoria === "Faculdade" ||
      subcategoria === "Cursos" ||
      subcategoria === "Idiomas")
  ) {
    return escolherTexto(
      [
        "Educação pode ser investimento importante. O ideal é acompanhar esse gasto para garantir que ele cabe no planejamento.",
        "Esse tipo de gasto pode trazer retorno no futuro, mas precisa caber no orçamento para não virar aperto no presente.",
        "Vale separar esse gasto no planejamento, porque educação costuma ser recorrente e precisa de previsibilidade.",
      ],
      `${chaveInsights}-orientacao-educacao`
    );
  }

  if (
    categoria === "Saúde" &&
    (subcategoria === "Farmácia" ||
      subcategoria === "Medicamentos")
  ) {
    return escolherTexto(
      [
        "Gastos com saúde merecem cuidado. Vale acompanhar a recorrência, sem cortar cuidados importantes.",
        "Se farmácia aparece com frequência, observar os itens recorrentes pode ajudar no planejamento, sempre mantendo os cuidados necessários.",
        "Esse gasto pode ser essencial. O ponto é enxergar a frequência para se planejar melhor.",
      ],
      `${chaveInsights}-orientacao-saude`
    );
  }

  if (
    categoria === "Moradia" &&
    (subcategoria === "Aluguel" ||
      subcategoria === "Condomínio" ||
      subcategoria === "Financiamento Imobiliário")
  ) {
    return escolherTexto(
      [
        "Moradia costuma ser gasto fixo e pesado. Acompanhar esse valor ajuda a entender quanto sobra para as outras áreas.",
        "Quando moradia pesa muito, o planejamento precisa considerar esse valor como prioridade fixa do mês.",
        "Esse tipo de gasto geralmente não muda rápido, mas precisa estar bem visível no planejamento.",
      ],
      `${chaveInsights}-orientacao-moradia`
    );
  }

  return escolherTexto(
  [
    `Como ${subcategoria} foi o ponto que mais pesou dentro de ${categoria}, vale olhar os maiores lançamentos desse detalhe e procurar padrões: valor alto, repetição ou compras não planejadas.`,

    `${subcategoria} apareceu como principal detalhe dentro de ${categoria}. Observar frequência e valores maiores pode ajudar a entender melhor para onde o dinheiro está indo.`,

    `Vale olhar com atenção os registros de ${subcategoria}. Às vezes, a economia começa quando percebemos quais gastos se repetem mais vezes.`,

    `Esse detalhe teve peso importante dentro de ${categoria}. Um bom começo é observar se os maiores valores foram planejados ou se aconteceram sem perceber.`,

    `Ao enxergar melhor ${subcategoria}, fica mais fácil identificar se o gasto foi pontual, recorrente ou algo que merece ajuste no planejamento.`,

    `Se ${subcategoria} apareceu com força dentro de ${categoria}, vale conferir se os gastos foram necessários, planejados ou se alguns aconteceram no impulso.`,

    `${subcategoria} merece atenção porque ajudou a puxar o resultado de ${categoria}. Olhar os registros maiores pode mostrar onde existe chance de ajuste.`,

    `Esse detalhe pode revelar um padrão importante. Veja se ${subcategoria} aparece por necessidade, por hábito ou por compras concentradas em poucos momentos.`,

    `Quando ${subcategoria} pesa dentro de ${categoria}, o primeiro passo é enxergar os maiores valores e entender se eles fazem sentido para o seu momento.`,

    `Observar ${subcategoria} com calma pode ajudar a separar gasto essencial, gasto planejado e gasto que talvez possa ser reduzido.`,
  ],
  `${chaveInsights}-orientacao-generica`
);
}

const textoOrientacaoPraticaCategoria =
  deveMostrarSubcategoriaDominante
    ? gerarOrientacaoPraticaCategoria(
        categoriaDominante?.categoria,
        subcategoriaDominante?.subcategoria
      )
    : "";

const deveMostrarOrientacaoPraticaCategoria =
  !!textoOrientacaoPraticaCategoria;

  const tipoEducacaoContextual = (() => {
  if (
    unidadeSingular !== "dia" &&
    pontosFinanceiros <= 3 &&
    pontosFinanceiros > 0
  ) {
    return "poucos-pontos-temporais";
  }

  if (percentualTop3 >= 75) {
    return "concentracao";
  }

  if (
    categoriaDominante &&
    percentualCategoriaDominante >= 50
  ) {
    return "categoria-dominante";
  }

  if (
    deveMostrarSubcategoriaDominante &&
    subcategoriaDominante
  ) {
    return "subcategoria";
  }

  if (
    tipoTendenciaPeriodo === "aumento-forte" ||
    tipoTendenciaPeriodo === "aumento-moderado"
  ) {
    return "aumento";
  }

  if (
    tipoTendenciaPeriodo === "queda-forte" ||
    tipoTendenciaPeriodo === "queda-moderada"
  ) {
    return "queda";
  }

  return "";
})();

const deveMostrarEducacaoContextual =
  nivelMaturidade >= 3 &&
  percentualLancamentosFuturos < 40 &&
  tipoEducacaoContextual !== "";

  const textoEducacaoContextual = escolherTexto(
  tipoEducacaoContextual === "poucos-pontos-temporais"
    ? [
        `Como o período possui movimentação em apenas ${pontosFinanceiros} ${unidadePlural}, a leitura ainda é mais geral. Mesmo assim, já dá para enxergar onde o dinheiro pesou mais.`,

        `Com poucos ${unidadePlural} registrados, o Enxergaí evita conclusões exageradas. O melhor é olhar primeiro o ${unidadeSingular} de maior impacto.`,

        `Este período ainda tem poucos ${unidadePlural} com movimentação. A análise ajuda a mostrar o maior peso, mas fica melhor conforme mais registros aparecem.`,

        `Quando há poucos ${unidadePlural} com gasto, o principal é entender qual deles puxou mais o total antes de tirar conclusões maiores.`,
      ]
    : tipoEducacaoContextual === "concentracao"
  
    ? [
        "Quando poucos pontos concentram boa parte dos gastos, o segredo não é olhar tudo de uma vez. Primeiro, vale entender o que aconteceu nesses momentos principais.",

        "Se poucos dias puxaram grande parte do total, eles merecem mais atenção do que os dias com valores pequenos. É ali que o dinheiro mais pesou.",

        "Quando o gasto fica concentrado em poucos momentos, uma boa estratégia é revisar esses registros maiores antes de tentar cortar tudo ao mesmo tempo.",

        "A concentração mostra onde começar. Em vez de olhar todos os gastos, foque primeiro nos pontos que mais mexeram no total.",
      ]
    : tipoEducacaoContextual === "categoria-dominante"
    ? [
        `Quando ${categoriaDominante?.categoria} domina os gastos, revisar essa área pode trazer mais resultado do que tentar ajustar pequenos valores espalhados.`,

        `Se ${categoriaDominante?.categoria} ficou com a maior parte do dinheiro, essa categoria virou um ponto-chave para entender o período.`,

        `Uma categoria dominante mostra onde o dinheiro mais se concentrou. Olhar ${categoriaDominante?.categoria} com atenção pode ajudar a encontrar oportunidades de ajuste.`,

        `Quando uma área pesa muito, como ${categoriaDominante?.categoria}, o primeiro passo é entender se esse gasto veio de necessidade, rotina ou decisão pontual.`,
      ]
    : tipoEducacaoContextual === "subcategoria"
    ? [
        `Quando ${subcategoriaDominante?.subcategoria} aparece como principal detalhe, isso ajuda a sair da visão geral e enxergar onde o dinheiro realmente pesou dentro da categoria.`,

        `A subcategoria mostra o detalhe por trás do gasto. Nesse caso, olhar ${subcategoriaDominante?.subcategoria} ajuda a entender melhor o comportamento financeiro.`,

        `Às vezes a categoria parece grande, mas o motivo está em um detalhe específico. Aqui, ${subcategoriaDominante?.subcategoria} merece atenção.`,

        `O detalhe mais importante costuma mostrar onde existe mais chance de entender, ajustar ou planejar melhor. Neste período, esse detalhe foi ${subcategoriaDominante?.subcategoria}.`,
      ]
    : tipoEducacaoContextual === "aumento"
    ? [
        "Quando os gastos começam a subir, o mais importante é descobrir o motivo antes que isso vire um padrão difícil de controlar.",

        "Uma alta nos gastos não significa automaticamente problema, mas merece atenção para entender se foi algo planejado ou fora do esperado.",

        "Subida de gasto é um sinal para investigar. O objetivo não é cortar tudo, mas entender o que está puxando o aumento.",

        "Quando o valor cresce no fim do período, vale observar se houve concentração de contas, compras necessárias ou decisões por impulso.",
      ]
    : tipoEducacaoContextual === "queda"
    ? [
        "Quando os gastos caem, isso pode indicar controle, mas o ideal é confirmar se a queda veio de escolhas conscientes e não de falta de registros.",

        "Redução nos gastos pode ser positiva, principalmente quando vem de planejamento e constância nos registros.",

        "Gastar menos pode ser um bom sinal, mas o Enxergaí precisa de registros consistentes para enxergar se foi economia real.",

        "Uma queda nos valores ajuda no planejamento quando ela representa menor consumo de verdade, e não apenas menos lançamentos anotados.",
      ]
    : [""],
  `${chaveInsights}-educacao-contextual`
);

const textoAvisoLancamentosFuturos = escolherTexto(
  percentualLancamentosFuturos >= 40
    ? [
        `Este período inclui ${formatMoney(
          totalLancamentosFuturos
        )} em lançamentos futuros, representando ${percentualLancamentosFuturos.toFixed(
          0
        )}% do total. Esses valores ajudam a enxergar compromissos próximos, mas ainda não são gastos já realizados.`,

        `Uma parte importante do total vem de lançamentos futuros: ${formatMoney(
          totalLancamentosFuturos
        )}. Vale separar mentalmente o que já aconteceu do que ainda está previsto.`,

        `Há ${formatMoney(
          totalLancamentosFuturos
        )} em registros futuros neste período. Isso ajuda no planejamento, mas precisa ser lido como compromisso previsto.`,

        `Atenção: uma parte relevante deste período ainda está no futuro. São ${formatMoney(
          totalLancamentosFuturos
        )} previstos, então vale diferenciar gasto realizado de compromisso que ainda vai acontecer.`,

        `Os lançamentos futuros têm peso importante neste período. Eles somam ${formatMoney(
          totalLancamentosFuturos
        )}, então a leitura precisa considerar que nem tudo já aconteceu.`,

        `O Enxergaí encontrou ${formatMoney(
          totalLancamentosFuturos
        )} em valores futuros neste período. Isso pode ajudar no planejamento, mas não deve ser lido como gasto já realizado.`,
      ]
    : [
        `Este período inclui ${formatMoney(
          totalLancamentosFuturos
        )} em lançamentos futuros. Eles ajudam a antecipar compromissos, mas ainda não representam gastos já realizados.`,

        `Há alguns registros futuros neste período, somando ${formatMoney(
          totalLancamentosFuturos
        )}. Isso pode ajudar no planejamento dos próximos dias.`,

        `O período mistura gastos já registrados com lançamentos futuros. A parte futura soma ${formatMoney(
          totalLancamentosFuturos
        )}.`,

        `Existem lançamentos futuros neste período, somando ${formatMoney(
          totalLancamentosFuturos
        )}. Eles ajudam a enxergar o que vem pela frente.`,

        `Além dos gastos já registrados, há ${formatMoney(
          totalLancamentosFuturos
        )} previstos para os próximos dias dentro deste período.`,

        `O Enxergaí identificou ${formatMoney(
          totalLancamentosFuturos
        )} em valores futuros. Use essa informação como apoio para se preparar, não como gasto já confirmado.`,
      ],
  `${chaveInsights}-lancamentos-futuros`
);

const textoCategoriaDominante =
  categoriaDominante
    ? escolherTexto(
        percentualCategoriaDominante >= 50
          ? [
              `${categoriaDominante.categoria} representa mais da metade dos gastos ${contextoPeriodoInsight}. Esse é um ponto importante para observar com atenção.`,

              `Mais de 50% dos gastos ${contextoPeriodoInsight} ficaram em ${categoriaDominante.categoria}. Pode ser um bom lugar para procurar oportunidades de economia.`,

              `${categoriaDominante.categoria} recebeu a maior parte do dinheiro gasto ${contextoPeriodoInsight}.`,

              `${categoriaDominante.categoria} teve um peso muito forte ${contextoPeriodoInsight}. Se a ideia for economizar, esse pode ser um dos primeiros lugares para olhar.`,

              `A maior parte do dinheiro ${contextoPeriodoInsight} foi para ${categoriaDominante.categoria}. Isso mostra que essa área teve grande influência no resultado.`,

              `${categoriaDominante.categoria} puxou mais da metade dos gastos ${contextoPeriodoInsight}. Vale entender se esse peso veio de necessidade, rotina ou gasto fora do planejado.`,

              `O principal peso financeiro ${contextoPeriodoInsight} ficou em ${categoriaDominante.categoria}. Essa categoria merece atenção especial neste período.`,

              `${categoriaDominante.categoria} dominou os gastos ${contextoPeriodoInsight}. Enxergar isso ajuda a saber por onde começar uma possível revisão.`,
            ]
          : [
              `${categoriaDominante.categoria} foi a categoria de maior peso ${contextoPeriodoInsight}, representando ${percentualCategoriaDominante.toFixed(
                0
              )}% dos gastos.`,

              `A categoria ${categoriaDominante.categoria} teve o maior impacto ${contextoPeriodoInsight}, com ${percentualCategoriaDominante.toFixed(
                0
              )}% do total gasto.`,

              `${categoriaDominante.categoria} foi o destino financeiro mais relevante ${contextoPeriodoInsight}.`,

              `Entre todas as categorias, ${categoriaDominante.categoria} teve o maior impacto ${contextoPeriodoInsight}.`,

              `${categoriaDominante.categoria} apareceu como a área de maior peso ${contextoPeriodoInsight}. Isso ajuda a entender para onde foi a maior parte do dinheiro.`,

              `O maior destaque entre as categorias ${contextoPeriodoInsight} foi ${categoriaDominante.categoria}. Essa área merece ser observada com atenção.`,

              `${categoriaDominante.categoria} ficou no topo dos gastos ${contextoPeriodoInsight}, com ${percentualCategoriaDominante.toFixed(
                0
              )}% do total.`,

              `A categoria que mais apareceu no resultado financeiro ${contextoPeriodoInsight} foi ${categoriaDominante.categoria}.`,
            ],
        `${chaveInsights}-categoria-dominante`
      )
    : "";

    
const indiceHojeNoGrafico = (() => {
  if (period === "today") {
    return safeChartValues.length - 1;
  }

  if (period === "week") {
    const diaSemana = now.getDay();

    return diaSemana === 0 ? 6 : diaSemana - 1;
  }

  if (period === "month") {
    return now.getDate() - 1;
  }

  if (
    period === "custom" &&
    startDateInput &&
    endDateInput
  ) {
    const start = parseDateSafe(startDateInput);
    const end = parseDateSafe(endDateInput);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const hoje = new Date(now);
    hoje.setHours(0, 0, 0, 0);

    const diffDays =
      Math.floor(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    if (
      diffDays <= 31 &&
      hoje >= start &&
      hoje <= end
    ) {
      return Math.floor(
        (hoje.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }
  }

  return -1;
})();

const valorHojeNoGrafico =
  indiceHojeNoGrafico >= 0
    ? Number(safeChartValues[indiceHojeNoGrafico] || 0)
    : 0;

const mediaDiasComMovimentacao =
  diasComGasto > 0
    ? totalGrafico / diasComGasto
    : 0;

const percentualHojeVsMedia =
  mediaDiasComMovimentacao > 0
    ? ((valorHojeNoGrafico - mediaDiasComMovimentacao) /
        mediaDiasComMovimentacao) *
      100
    : 0;

const deveMostrarHojeVsMedia =
  nivelMaturidade >= 3 &&
  valorHojeNoGrafico > 0 &&
  mediaDiasComMovimentacao > 0 &&
  indiceHojeNoGrafico >= 0;

  
const textoHojeVsMedia = escolherTexto(
  percentualHojeVsMedia >= 20
    ? [
        `Hoje está ${percentualHojeVsMedia.toFixed(
          0
        )}% acima da média dos dias com movimentação deste período.`,
        `O gasto de hoje ficou ${percentualHojeVsMedia.toFixed(
          0
        )}% acima da média dos dias em que houve movimentação.`,
        `Hoje está apresentando um gasto acima da média dos dias movimentados do período, com diferença de ${percentualHojeVsMedia.toFixed(
          0
        )}%.`,
      ]
    : percentualHojeVsMedia <= -20
    ? [
        `Hoje está ${Math.abs(percentualHojeVsMedia).toFixed(
          0
        )}% abaixo da média dos dias com movimentação deste período.`,
        `O gasto de hoje ficou abaixo da média dos dias movimentados em ${Math.abs(
          percentualHojeVsMedia
        ).toFixed(0)}%.`,
        `Hoje teve um impacto menor que a média dos dias com movimentação do período.`,
      ]
    : [
        "Hoje está próximo da média dos dias com movimentação deste período.",
        "O gasto de hoje ficou em uma faixa próxima da média dos dias movimentados.",
        "Hoje não se distanciou muito da média dos dias em que houve gastos.",
      ],
  `${chaveInsights}-hoje-media`
);


const temDistribuicaoSaudavel =
  percentualCategoriaDominante > 0 &&
  percentualCategoriaDominante < 50;

const unidadeTempoPositiva =
  unidadeSingular === "mês"
    ? "meses"
    : unidadeSingular === "ano"
    ? "anos"
    : "dias";

const textoFeedbackPositivo = escolherTexto(
  temDistribuicaoSaudavel
  ? (
      tipoEducacaoContextual === "poucos-pontos-temporais"
        ? [
            "Com os registros disponíveis, nenhuma categoria dominou claramente os gastos.",

            "Mesmo com uma base ainda pequena, os gastos não ficaram presos em uma única categoria.",

            "Pelos dados registrados até aqui, o dinheiro apareceu dividido entre diferentes áreas.",

            "A leitura inicial mostra gastos distribuídos entre categorias, sem uma única área carregando quase tudo.",

            "Com poucos registros no período, já dá para ver que os gastos não ficaram concentrados em apenas uma categoria.",
          ]
        :

      period === "year"
        ? [
  "Neste ano, seu dinheiro não ficou concentrado em uma única categoria. Os gastos ficaram mais divididos entre diferentes áreas da sua vida.",

  "Ao longo deste ano, nenhuma categoria dominou seus gastos, o que ajuda a manter uma visão mais equilibrada do dinheiro.",

  "Seus registros deste ano mostram que o dinheiro foi distribuído entre diferentes categorias, sem ficar preso a uma única área.",
]

        : period === "all"
        ? [
  "O histórico completo mostra que seu dinheiro não ficou concentrado em uma única categoria ao longo do tempo.",

  "Observando todos os registros do Enxergaí, nenhuma categoria dominou a maior parte dos seus gastos.",

  "Ao longo de todo o histórico disponível, seus gastos ficaram distribuídos entre diferentes áreas da sua vida financeira.",
]

        : period === "custom"
        ?  [
           "Durante o período escolhido, seu dinheiro não ficou preso em uma única categoria. Os gastos ficaram mais divididos entre diferentes áreas.",

             "No período analisado, nenhuma categoria dominou seus gastos. Isso ajuda a enxergar melhor para onde o dinheiro está indo.",

             "Os gastos ficaram distribuídos entre diferentes categorias, sem que uma única área consumisse a maior parte do seu dinheiro.",
            ]

        : [
            "Você distribuiu seus gastos entre várias categorias, sem que uma única área dominasse grande parte do total.",

            "Seu dinheiro ficou mais equilibrado entre diferentes categorias, evitando grande dependência de uma única área.",

            "Os gastos ficaram mais espalhados entre diferentes categorias, o que pode facilitar a visualização e o controle do seu dinheiro.",
          ]
    )

   

  : percentualDiasSemGasto >= 40
    ? [
  `Boa parte dos ${unidadeTempoPositiva} ${contextoPeriodoHumano} não apresentou movimentação financeira registrada. Se isso refletir menor consumo, pode ser um sinal positivo de controle. Se faltou registrar, vale manter os lançamentos em dia.`,

  `Houve vários ${unidadeTempoPositiva} sem movimentação financeira registrada ${contextoPeriodoHumano}. Se esses períodos realmente tiveram menos gastos, isso pode representar avanço; se não, o ideal é completar os registros.`,

  `O período apresentou diversos ${unidadeTempoPositiva} sem movimentação financeira registrada ${contextoPeriodoHumano}. Isso pode indicar menor consumo, mas também pode apontar falta de registros.`,

  `Muitos ${unidadeTempoPositiva} ficaram sem movimentação registrada ${contextoPeriodoHumano}. Para o Enxergaí enxergar melhor, é importante manter os registros completos.`,

  `A ausência de movimentação em vários ${unidadeTempoPositiva} pode ser um bom sinal quando representa menos consumo de verdade. Se foi esquecimento, vale registrar para manter a leitura confiável.`,
]

: [
  "Você está criando uma base cada vez mais rica de informações para entender seus hábitos financeiros.",

  "Seus registros ajudam o Enxergaí a enxergar padrões mais úteis para apoiar suas decisões.",

  "Quanto mais você registra, mais o Enxergaí consegue transformar movimentações em aprendizados sobre seu comportamento financeiro.",
],

  `${chaveInsights}-feedback-positivo`
);


const textoConquistaEntrePeriodos = escolherTexto(
  [
    `A principal categoria perdeu peso em relação ${periodoAnteriorComPreposicao}, indicando uma distribuição mais equilibrada dos gastos.`,

    `Os gastos ficaram menos dependentes de uma única categoria quando comparados com ${periodoAnteriorComparativo}.`,

    `O dinheiro ficou mais distribuído entre diferentes áreas em relação ${periodoAnteriorComPreposicao}.`,
  ],
  `${chaveInsights}-conquista-periodo`
);

const mudouCategoriaDominante =
  nivelMaturidade >= 3 &&
  percentualLancamentosFuturos < 40 &&
  !!categoriaDominante?.categoria &&
  !!nomeCategoriaDominantePeriodoAnterior &&
  categoriaDominante.categoria !== nomeCategoriaDominantePeriodoAnterior &&
  percentualCategoriaDominante >= 35 &&
  (categoriaDominantePeriodoAnterior ?? 0) >= 35;

const deveMostrarComparacaoCategorias =
  nivelMaturidade >= 3 &&
  totalPeriodoAnteriorComparacao > 0 &&
  percentualLancamentosFuturos < 40;

  const textoMudancaCategoriaDominante = escolherTexto(
  [
    `A categoria que mais pesou mudou em relação ${periodoAnteriorComPreposicao}: antes o maior peso estava em ${nomeCategoriaDominantePeriodoAnterior}, agora está em ${categoriaDominante?.categoria}.`,

    `O dinheiro mudou de direção quando comparado com ${periodoAnteriorComparativo}: ${nomeCategoriaDominantePeriodoAnterior} perdeu espaço e ${categoriaDominante?.categoria} passou a pesar mais.`,

    `Houve uma mudança no foco dos gastos: antes ${nomeCategoriaDominantePeriodoAnterior} tinha o maior impacto, agora ${categoriaDominante?.categoria} aparece como principal categoria.`,
  ],
  `${chaveInsights}-mudanca-categoria-dominante`
);

const textoCategoriaGanhouEspaco =
  categoriaQueMaisGanhouEspaco
    ? escolherTexto(
        categoriaQueMaisGanhouEspaco.percentualAnterior <= 0.5
          ? [
              `${categoriaQueMaisGanhouEspaco.categoria} praticamente não aparecia antes e agora passou a representar ${categoriaQueMaisGanhouEspaco.percentualAtual.toFixed(
                0
              )}% dos gastos.`,

              `${categoriaQueMaisGanhouEspaco.categoria} ganhou espaço no período atual: antes quase não tinha participação, agora chegou a ${categoriaQueMaisGanhouEspaco.percentualAtual.toFixed(
                0
              )}% do total.`,

              `Antes, ${categoriaQueMaisGanhouEspaco.categoria} quase não pesava nos gastos. Agora essa categoria aparece com ${categoriaQueMaisGanhouEspaco.percentualAtual.toFixed(
                0
              )}% do total.`,
            ]
          : [
              `${categoriaQueMaisGanhouEspaco.categoria} ganhou mais espaço nos gastos: antes representava: antes representava ${categoriaQueMaisGanhouEspaco.percentualAnterior.toFixed(
                0
              )}%; agora chegou a ${categoriaQueMaisGanhouEspaco.percentualAtual.toFixed(
                0
              )}%.`,

              `${categoriaQueMaisGanhouEspaco.categoria} passou a pesar mais: saiu de ${categoriaQueMaisGanhouEspaco.percentualAnterior.toFixed(
                0
              )}% para ${categoriaQueMaisGanhouEspaco.percentualAtual.toFixed(
                0
              )}% do total.`,

              `O peso de ${categoriaQueMaisGanhouEspaco.categoria} aumentou: antes era ${categoriaQueMaisGanhouEspaco.percentualAnterior.toFixed(
                0
              )}%; agora é ${categoriaQueMaisGanhouEspaco.percentualAtual.toFixed(
                0
              )}%.`,
            ],
        `${chaveInsights}-categoria-ganhou-espaco`
      )
    : "";


    const textoCategoriaPerdeuEspaco =
  categoriaQueMaisPerdeuEspaco
    ? escolherTexto(
        categoriaQueMaisPerdeuEspaco.percentualAtual <= 0.5
          ? [
              `${categoriaQueMaisPerdeuEspaco.categoria} perdeu espaço nos gastos: antes representava ${categoriaQueMaisPerdeuEspaco.percentualAnterior.toFixed(
                0
              )}% e agora praticamente não aparece neste período.`,

              `${categoriaQueMaisPerdeuEspaco.categoria} tinha peso importante antes, mas agora quase não aparece nos gastos registrados.`,

              `O peso de ${categoriaQueMaisPerdeuEspaco.categoria} caiu bastante: antes era ${categoriaQueMaisPerdeuEspaco.percentualAnterior.toFixed(
                0
              )}% e agora ficou praticamente zerado.`,
            ]
          : [
              `${categoriaQueMaisPerdeuEspaco.categoria} perdeu peso nos gastos: antes representava ${categoriaQueMaisPerdeuEspaco.percentualAnterior.toFixed(
                0
              )}%; agora ficou em ${categoriaQueMaisPerdeuEspaco.percentualAtual.toFixed(
                0
              )}%.`,

              `${categoriaQueMaisPerdeuEspaco.categoria} passou a pesar menos: caiu de ${categoriaQueMaisPerdeuEspaco.percentualAnterior.toFixed(
                0
              )}% para ${categoriaQueMaisPerdeuEspaco.percentualAtual.toFixed(
                0
              )}% do total.`,

              `O peso de ${categoriaQueMaisPerdeuEspaco.categoria} diminuiu: antes era ${categoriaQueMaisPerdeuEspaco.percentualAnterior.toFixed(
                0
              )}%; agora é ${categoriaQueMaisPerdeuEspaco.percentualAtual.toFixed(
                0
              )}%.`,
            ],
        `${chaveInsights}-categoria-perdeu-espaco`
      )
    : "";

    const variacaoCategoriaGanhouEspaco =
  categoriaQueMaisGanhouEspaco
    ? categoriaQueMaisGanhouEspaco.percentualAtual -
      categoriaQueMaisGanhouEspaco.percentualAnterior
    : 0;

const variacaoCategoriaPerdeuEspaco =
  categoriaQueMaisPerdeuEspaco
    ? categoriaQueMaisPerdeuEspaco.percentualAnterior -
      categoriaQueMaisPerdeuEspaco.percentualAtual
    : 0;

const deveMostrarComparacaoInteligente =
  deveMostrarComparacaoCategorias &&
  !!categoriaQueMaisGanhouEspaco &&
  !!categoriaQueMaisPerdeuEspaco &&
  variacaoCategoriaGanhouEspaco >= 15 &&
  variacaoCategoriaPerdeuEspaco >= 15;

  const textoComparacaoInteligente =
  deveMostrarComparacaoInteligente
    ? escolherTexto(
        period === "week"
          ? [
              `Na prática, esta semana mostrou uma mudança clara: ${categoriaQueMaisGanhouEspaco?.categoria} ganhou espaço e ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu força.`,

              `Comparando com a semana passada, o dinheiro mudou de lugar: saiu mais de ${categoriaQueMaisPerdeuEspaco?.categoria} e passou a aparecer mais em ${categoriaQueMaisGanhouEspaco?.categoria}.`,

              `O principal ponto desta semana foi essa troca: menos peso em ${categoriaQueMaisPerdeuEspaco?.categoria} e mais peso em ${categoriaQueMaisGanhouEspaco?.categoria}.`,

              `Esta semana trouxe uma mudança importante no destino do dinheiro: ${categoriaQueMaisGanhouEspaco?.categoria} cresceu, enquanto ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu participação.`,

              `O que mais chama atenção nesta semana é a virada entre categorias: ${categoriaQueMaisGanhouEspaco?.categoria} passou a pesar mais e ${categoriaQueMaisPerdeuEspaco?.categoria} ficou mais leve.`,
            ]
          : period === "month"
          ? [
              `Na prática, este mês mostra que o dinheiro mudou de direção: ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu espaço e ${categoriaQueMaisGanhouEspaco?.categoria} passou a pesar mais.`,

              `O principal movimento deste mês foi a troca de peso entre categorias: menos em ${categoriaQueMaisPerdeuEspaco?.categoria} e mais em ${categoriaQueMaisGanhouEspaco?.categoria}.`,

              `Comparando com o mês passado, o dinheiro foi menos para ${categoriaQueMaisPerdeuEspaco?.categoria} e ganhou força em ${categoriaQueMaisGanhouEspaco?.categoria}. Esse é o ponto principal para observar.`,

              `Este mês mostra uma mudança no destino do dinheiro: ${categoriaQueMaisGanhouEspaco?.categoria} ganhou força, enquanto ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu espaço.`,

              `O ponto mais importante deste mês é enxergar essa troca: ${categoriaQueMaisGanhouEspaco?.categoria} passou a ocupar mais espaço nos gastos e ${categoriaQueMaisPerdeuEspaco?.categoria} ficou menor.`,
            ]
          : period === "year"
          ? [
              `Neste ano, o dinheiro mudou de direção em relação ao ano passado: ${categoriaQueMaisGanhouEspaco?.categoria} ganhou espaço e ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu força.`,

              `Olhando o ano como um todo, a principal mudança foi essa: menos peso em ${categoriaQueMaisPerdeuEspaco?.categoria} e mais peso em ${categoriaQueMaisGanhouEspaco?.categoria}.`,

              `Esse comparativo mostra uma virada importante no comportamento dos gastos: ${categoriaQueMaisGanhouEspaco?.categoria} passou a pesar mais, enquanto ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu participação.`,

              `Ao comparar com o ano passado, fica claro que o dinheiro passou a aparecer mais em ${categoriaQueMaisGanhouEspaco?.categoria} e menos em ${categoriaQueMaisPerdeuEspaco?.categoria}.`,

              `A leitura principal do ano é essa: ${categoriaQueMaisGanhouEspaco?.categoria} ganhou mais espaço na sua vida financeira, enquanto ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu peso.`,
            ]
          : [
              `Na prática, o dinheiro saiu mais de ${categoriaQueMaisPerdeuEspaco?.categoria} e passou a pesar mais em ${categoriaQueMaisGanhouEspaco?.categoria}. Esse é o principal movimento para observar neste período.`,

              `O principal movimento foi uma troca de peso: ${categoriaQueMaisGanhouEspaco?.categoria} ganhou espaço enquanto ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu força.`,

              `Esse comparativo mostra uma mudança clara no jeito de gastar: menos peso em ${categoriaQueMaisPerdeuEspaco?.categoria} e mais peso em ${categoriaQueMaisGanhouEspaco?.categoria}.`,

              `O dinheiro mudou de lugar neste período: ${categoriaQueMaisGanhouEspaco?.categoria} ganhou mais força e ${categoriaQueMaisPerdeuEspaco?.categoria} ficou menor.`,

              `A principal virada do período está entre essas duas categorias: ${categoriaQueMaisGanhouEspaco?.categoria} cresceu e ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu participação.`,
            ],
        `${chaveInsights}-comparacao-inteligente`
      )
    : "";

    const deveMostrarCategoriaGanhouEspaco =
  deveMostrarComparacaoCategorias &&
  !!categoriaQueMaisGanhouEspaco;

const deveMostrarCategoriaPerdeuEspaco =
  deveMostrarComparacaoCategorias &&
  !!categoriaQueMaisPerdeuEspaco &&
  categoriaQueMaisPerdeuEspaco.categoria !==
    categoriaQueMaisGanhouEspaco?.categoria;

const textoExplicacaoMudancaCategoria = escolherTexto(
  [
    "Isso ajuda a perceber que o padrão de consumo mudou. Vale observar se essa mudança veio de necessidade, compra planejada ou gasto extra.",

    "Quando a categoria principal muda, é um sinal de que o dinheiro passou a ir mais para outro tipo de gasto. Isso merece atenção.",

    "Essa mudança mostra que o principal peso financeiro saiu de uma área e foi para outra. Enxergar isso ajuda a entender melhor o comportamento do período.",
  ],
  `${chaveInsights}-explicacao-mudanca-categoria`
);

const deveMostrarExplicacaoMudancaCategoria =
  mudouCategoriaDominante &&
  !deveMostrarComparacaoInteligente;


const textoReconhecimentoEvolucao = escolherTexto(
  [
    "Mudanças como essa podem facilitar a visualização dos seus hábitos financeiros e ajudar você a entender melhor para onde o dinheiro está indo.",

    "Quando os gastos ficam menos concentrados em uma única área, costuma ser mais fácil identificar padrões e oportunidades de melhoria.",

    "Observar essa distribuição ao longo do tempo pode ajudar a tomar decisões financeiras com mais clareza e menos esforço.",
  ],
  `${chaveInsights}-reconhecimento-evolucao`
);

const tipoCrescimentoPessoal = (() => {
  if (deveMostrarComparacaoInteligente) {
    return "mudanca";
  }

  if (
    unidadeSingular !== "dia" &&
    pontosFinanceiros <= 3 &&
    pontosFinanceiros > 0
  ) {
    return "poucos-pontos-temporais";
  }

  if (deveTratarQuedaComoPossivelFaltaRegistro) {
    return "registro";
  }

  if (houveMelhoraDistribuicao) {
    return "evolucao";
  }

  if (percentualCategoriaDominante >= 50) {
    return "foco";
  }

  if (percentualTop3 >= 75) {
    return "concentracao";
  }

  if (temDistribuicaoSaudavel) {
    return "equilibrio";
  }

  return "";
})();

const deveMostrarCrescimentoPessoal =
  nivelMaturidade >= 3 &&
  tipoCrescimentoPessoal !== "" &&
  percentualLancamentosFuturos < 60;

  
   const textoCrescimentoPessoal = escolherTexto(
   tipoCrescimentoPessoal === "poucos-pontos-temporais"
    ? [
        `Como este período tem poucos ${unidadePlural} com movimentação, o mais importante é usar essa leitura como ponto de partida, não como conclusão final.`,

        `Com poucos ${unidadePlural} registrados, o Enxergaí já mostra onde o dinheiro pesou mais, mas a leitura fica melhor conforme o histórico cresce.`,

        `Esse período ainda tem pouca base em ${unidadePlural}. Mesmo assim, já dá para enxergar o ponto de maior impacto e acompanhar a evolução depois.`,

        `Quando há poucos ${unidadePlural} com gasto, o caminho é começar pelo maior peso e continuar registrando para ganhar mais clareza.`,
      ]

    : tipoCrescimentoPessoal === "registro"

    ? [
        "O ponto principal aqui é manter os registros completos. Quanto mais fiel for o registro, mais clara fica a leitura do Enxergaí.",

        "Antes de concluir que houve melhora, vale confirmar se todos os gastos foram registrados. Dados completos deixam a análise mais confiável.",

        "Registrar com constância é parte do controle financeiro. Sem isso, o Enxergaí enxerga menos do que realmente aconteceu.",

        "Quando faltam registros, o Enxergaí prefere ser cuidadoso. Completar os lançamentos ajuda a separar economia real de falta de informação.",

        "A leitura fica mais forte quando os registros estão completos. Isso ajuda o Enxergaí a mostrar o que realmente aconteceu no período.",
      ]

    : tipoCrescimentoPessoal === "mudanca"
    ? [
        "O mais importante aqui é perceber que o dinheiro mudou de direção. Enxergar essa virada ajuda a decidir onde prestar atenção primeiro.",

        "Quando o peso muda de uma categoria para outra, aparece uma pista valiosa sobre o comportamento financeiro do período.",

        "Essa mudança mostra que o jeito de gastar não ficou igual. Perceber isso já é um passo importante para melhorar o controle.",

        "O ganho aqui é enxergar a virada: o dinheiro saiu de uma área e passou a pesar mais em outra.",

        "Essa troca de peso ajuda a entender para onde o dinheiro começou a ir com mais força.",
      ]

    : tipoCrescimentoPessoal === "evolucao"
    ? [
        "Esse período mostra uma distribuição mais equilibrada dos gastos. Enxergar isso ajuda a planejar com mais clareza.",

        "Quando o dinheiro fica menos preso em uma única área, fica mais fácil entender o comportamento financeiro como um todo.",

        "Essa leitura mostra um sinal de evolução: os gastos ficaram menos dependentes de uma única categoria.",

        "O avanço aqui está em ver o dinheiro mais dividido entre áreas diferentes, sem uma única categoria carregando quase tudo.",

        "Uma distribuição mais equilibrada ajuda a enxergar o orçamento com menos confusão e mais clareza.",
      ]

    : tipoCrescimentoPessoal === "foco"
    ? [
        "O principal ganho aqui é saber por onde começar. Quando uma categoria pesa muito, ela vira o primeiro ponto de atenção.",

        "Enxergar a categoria dominante evita tentar corrigir tudo ao mesmo tempo. O foco fica mais claro.",

        "Quando uma área concentra boa parte do dinheiro, entender essa área pode trazer mais resultado do que olhar pequenos gastos espalhados.",

        "O Enxergaí está mostrando o ponto de maior peso para facilitar sua próxima decisão. O caminho começa por onde o dinheiro mais impactou.",

        "Quando uma categoria domina, o melhor primeiro passo é entender o que aconteceu ali antes de tentar mexer em tudo.",
      ]

    : tipoCrescimentoPessoal === "concentracao"
    ? [
        "O aprendizado principal é simples: poucos pontos puxaram boa parte do total. Olhar esses pontos primeiro reduz o esforço da análise.",

        "Quando os maiores impactos estão concentrados, o caminho mais eficiente é começar pelos registros que mais pesaram.",

        "O Enxergaí mostra onde o dinheiro mais mexeu no resultado. Isso ajuda a agir com mais foco e menos tentativa.",

        "A concentração mostra onde começar. Em vez de olhar tudo ao mesmo tempo, foque primeiro nos registros que mais mudaram o total.",

        "Quando poucos pontos pesam muito, eles contam a parte mais importante da história financeira do período.",
      ]

    : tipoCrescimentoPessoal === "equilibrio"
    ? [
        "Esse período mostra que o dinheiro ficou mais dividido entre diferentes áreas. Isso ajuda a enxergar o orçamento com mais equilíbrio.",

        "Quando nenhuma categoria domina tudo, fica mais fácil entender o conjunto dos gastos e planejar os próximos passos.",

        "A distribuição entre categorias ficou mais aberta. Isso pode facilitar a leitura do comportamento financeiro.",

        "O dinheiro não ficou preso em uma única área. Isso ajuda a olhar o período com mais equilíbrio.",

        "Quando os gastos ficam distribuídos entre áreas diferentes, o Enxergaí consegue mostrar uma visão mais clara do conjunto.",
      ]

    : [""],
  `${chaveInsights}-crescimento-pessoal`
);

const deveMostrarFeedbackPositivo =
  nivelMaturidade >= 3 &&
  !houveMelhoraDistribuicao &&
  !deveTratarQuedaComoPossivelFaltaRegistro &&
  (
    temDistribuicaoSaudavel ||
    percentualDiasSemGasto >= 40
  );

  const deveMostrarReconhecimentoEvolucao =
  houveMelhoraDistribuicao;

const getInsightsTextLinesEssencial = () => {
  
  const insights: {
    peso: number;
    texto: string;
  }[] = [];

  if (deveMostrarAlertaTendencia) {
    insights.push({
      peso: 100,
      texto: `⚠️ ${textoAlertaTendencia}`,
    });
  }

  if (deveMostrarAvisoLancamentosFuturos) {
    insights.push({
      peso: 95,
      texto: `• ${textoAvisoLancamentosFuturos}`,
    });
  }

  if (deveMostrarComparacaoInteligente) {
    insights.push({
      peso: 90,
      texto: `🧠 ${textoComparacaoInteligente}`,
    });
  }

  if (maiorDia && deveMostrarMaiorImpacto) {
    insights.push({
      peso: 85,
      texto: `• ${textoMaiorImpacto}`,
    });
  }

  if (deveMostrarCategoriaDominante) {
    insights.push({
      peso: 80,
      texto: `• ${textoCategoriaDominante}`,
    });
  }

  if (deveMostrarCategoriaGanhouEspaco) {
    insights.push({
      peso: 75,
      texto: `📈 ${textoCategoriaGanhouEspaco}`,
    });
  }

  if (deveMostrarCategoriaPerdeuEspaco) {
    insights.push({
      peso: 70,
      texto: `📉 ${textoCategoriaPerdeuEspaco}`,
    });
  }

  if (deveMostrarMovimentoRecente) {
    insights.push({
      peso: 65,
      texto: `• ${textoMovimentoRecente}`,
    });
  }

  if (deveMostrarSubcategoriaDominante) {
    insights.push({
      peso: 60,
      texto: `• ${textoSubcategoriaDominante}`,
    });
  }

  if (deveMostrarEducacaoContextual) {
    insights.push({
      peso: 50,
      texto: `📘 ${textoEducacaoContextual}`,
    });
  }

  if (deveMostrarFeedbackPositivo) {
    insights.push({
      peso: 40,
      texto: `✅ ${textoFeedbackPositivo}`,
    });
  }

  if (deveMostrarCrescimentoPessoal) {
    insights.push({
      peso: 30,
      texto: `✨ ${textoCrescimentoPessoal}`,
    });
  }

  return insights
    .sort((a, b) => b.peso - a.peso)
    .slice(0, 4)
    .map((item) => item.texto);
};

const getInsightsTextLinesComparativo = (): string[] => {
  const insights: string[] = [];

  if (deveMostrarComparacaoInteligente) {
    insights.push(`🧠 ${textoComparacaoInteligente}`);
  }

  if (
    deveMostrarComparacaoCategorias &&
    mudouCategoriaDominante
  ) {
    insights.push(`🔄 ${textoMudancaCategoriaDominante}`);
  }

  if (
    deveMostrarComparacaoCategorias &&
    textoCategoriaGanhouEspaco
  ) {
    insights.push(`📈 ${textoCategoriaGanhouEspaco}`);
  }

  if (
    deveMostrarComparacaoCategorias &&
    textoCategoriaPerdeuEspaco
  ) {
    insights.push(`📉 ${textoCategoriaPerdeuEspaco}`);
  }

  return insights.filter(Boolean);
};


const getInsightsTextLines = () => {
  const linhas: string[] = [];

  if (nivelMaturidade === 0) {
    linhas.push(`• ${textoSemMovimentacao}`);
    linhas.push(`• ${textoDesbloquearAnalises}`);
  }

  if (nivelMaturidade === 1) {
    linhas.push(`• ${textoPrimeiraMovimentacao}`);
    linhas.push(`• ${textoContinuarRegistrando}`);
  }

  if (nivelMaturidade === 2) {
    linhas.push(`• ${textoDadosInsuficientes}`);
    linhas.push(`• ${textoProximoPassoPoucosDados}`);
  }

  if (nivelMaturidade >= 3) {
    if (deveMostrarAvisoLancamentosFuturos) {
      linhas.push(`• ${textoAvisoLancamentosFuturos}`);
    }

    if (maiorDia && deveMostrarMaiorImpacto) {
      linhas.push(`• ${textoMaiorImpacto}`);
    }

    if (deveMostrarTop3Impacto) {
      linhas.push(`• ${textoTop3Impacto}`);

      linhas.push(
        `• ${
          percentualTop3 >= 70
            ? textoConcentracaoAlta
            : deveMostrarConcentracaoModerada
            ? textoConcentracaoModerada
            : textoConcentracaoBaixa
        }`
      );
    } else {
      linhas.push(`• ${textoPoucosPontosMensais}`);
    }

    if (deveMostrarHojeVsMedia && !deveMostrarAvisoLancamentosFuturos) {
      linhas.push(`• ${textoHojeVsMedia}`);
    }

    if (
      !deveMostrarAvisoLancamentosFuturos &&
      !deveTratarQuedaComoPossivelFaltaRegistro
    ) {
      linhas.push(`• ${textoTendenciaPeriodo}`);
    }

    if (
      !deveMostrarAvisoLancamentosFuturos &&
      deveTratarQuedaComoPossivelFaltaRegistro
    ) {
      linhas.push(`💡 ${textoPossivelFaltaRegistroNoFinal}`);
    }

    if (deveMostrarMovimentoRecente && !deveMostrarAvisoLancamentosFuturos) {
      linhas.push(`• ${textoMovimentoRecente}`);
    }

    if (deveMostrarAlertaTendencia) {
      linhas.push(`⚠️ ${textoAlertaTendencia}`);
    }

    if (
      deveMostrarLeituraReducao &&
      !deveTratarQuedaComoPossivelFaltaRegistro
    ) {
      linhas.push(`💡 ${textoLeituraReducao}`);
    }

    if (deveMostrarCategoriaDominante) {
      linhas.push(`• ${textoCategoriaDominante}`);
    }

    if (deveMostrarSubcategoriaDominante) {
      linhas.push(`• ${textoSubcategoriaDominante}`);
    }

    if (deveMostrarOrientacaoPraticaCategoria) {
      linhas.push(`• ${textoOrientacaoPraticaCategoria}`);
    }

    if (deveMostrarEducacaoContextual) {
      linhas.push(`📘 ${textoEducacaoContextual}`);
    }

    if (deveMostrarFeedbackPositivo) {
      linhas.push(`✅ ${textoFeedbackPositivo}`);
    }

    if (houveMelhoraDistribuicao) {
      linhas.push(`✅ ${textoConquistaEntrePeriodos}`);
    }

    if (deveMostrarReconhecimentoEvolucao) {
      linhas.push(`💡 ${textoReconhecimentoEvolucao}`);
    }

    if (mudouCategoriaDominante) {
      linhas.push(`🔄 ${textoMudancaCategoriaDominante}`);
    }

    if (deveMostrarCategoriaGanhouEspaco) {
      linhas.push(`📈 ${textoCategoriaGanhouEspaco}`);
    }

    if (deveMostrarCategoriaPerdeuEspaco) {
      linhas.push(`📉 ${textoCategoriaPerdeuEspaco}`);
    }

    if (deveMostrarComparacaoInteligente) {
      linhas.push(`🧠 ${textoComparacaoInteligente}`);
    }

    if (deveMostrarExplicacaoMudancaCategoria) {
      linhas.push(`💡 ${textoExplicacaoMudancaCategoria}`);
    }

    if (deveMostrarCrescimentoPessoal) {
      linhas.push(`✨ ${textoCrescimentoPessoal}`);
    }
  }

  return linhas.filter(Boolean);
};

const getInsightsTextoCompleto = () => {
  const linhas =
  modoInsights === "essencial"
    ? getInsightsTextLinesEssencial()
    : modoInsights === "comparativo"
    ? getInsightsTextLinesComparativo()
    : getInsightsTextLines();

  return [
    "🔥 Insight Financeiro",
    `Período: ${labelPeriod(String(period))}`,
    "",
    ...linhas,
    "",
    "Gerado pelo Enxergaí.",
  ].join("\n");
}; 

const renderInsightsContent = () => (
  <>
    {(
      modoInsights === "essencial"
        ? getInsightsTextLinesEssencial()
        : modoInsights === "comparativo"
        ? getInsightsTextLinesComparativo()
        : getInsightsTextLines()
    ).map((linha, index) => (
      <Text
        key={`insight-popup-${index}`}
        style={styles.insightItem}
      >
        {linha}
      </Text>
    ))}
  </>
);

function copiarInsightsTexto() {
  const texto = getInsightsTextoCompleto();

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        alert("Insights copiados com sucesso.");
      })
      .catch(() => {
        alert("Não foi possível copiar automaticamente. Tente novamente.");
      });

    return;
  }

  alert("Cópia automática não disponível neste dispositivo.");
}

function exportarInsightsTexto() {
  if (typeof document === "undefined") {
    alert("Exportação disponível apenas na versão web.");
    return;
  }

  const texto = getInsightsTextoCompleto();

  const blob = new Blob([texto], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `insights-enxergai-${String(period)}.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

 async function compartilharInsightsTexto() {
  const texto = getInsightsTextoCompleto();

  if (
    typeof navigator !== "undefined" &&
    navigator.share
  ) {
    try {
      await navigator.share({
        title: "Insight Financeiro - Enxergaí",
        text: texto,
      });

      return;
    } catch (error) {
      return;
    }
  }

  alert(
    "Compartilhamento não disponível neste dispositivo. Use Copiar ou Exportar."
  );
}
  function formatShortMoney(valor: number) {
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1)}k`;
  }

  return `R$ ${valor.toFixed(0)}`;
}

  function abrirPersonalizado() {
    setMenuOpen(false);
    setStartDateInput("");
    setEndDateInput("");
    setShowCustomBox(true);
  }

  function aplicarPersonalizado() {
    if (!startDateInput || !endDateInput) {
      alert("Selecione a data inicial e a data final.");
      return;
    }

    const start = parseDateSafe(startDateInput);
    const end = parseDateSafe(endDateInput);

    if (start.getTime() > end.getTime()) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    setPeriod("custom");
    setSelectedPoint(null);
    setShowCustomBox(false);
  }

  function cancelarPersonalizado() {
    setShowCustomBox(false);
    setStartDateInput("");
    setEndDateInput("");
  }

     return (
  <ScrollView
    style={[
      styles.container,
      isMobile && styles.containerMobile,
      isDesktop && styles.containerDesktop,
    ]}
    showsVerticalScrollIndicator={true}
    contentContainerStyle={{
      paddingBottom: 40,
    }}
  >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Evolução do Total Gasto</Text>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setMenuOpen((prev) => !prev)}
      >
        <Text style={styles.filterText}>
          📅 {labelPeriod(String(period))}
        </Text>
      </TouchableOpacity>

      {period === "custom" && startDateInput && endDateInput && (
        <Text style={styles.customRangeText}>
          {formatCustomDate(startDateInput)} até {formatCustomDate(endDateInput)}
        </Text>
      )}
        {menuOpen && (
  <TouchableOpacity
    style={styles.menuOverlay}
    activeOpacity={1}
    onPress={() => setMenuOpen(false)}
  />
)}
      {menuOpen && (
        <View style={styles.menu}>
          {[
            ["Hoje", "today"],
            ["Esta semana", "week"],
            ["Semana passada", "weekPrev"],
            ["Este mês", "month"],
            ["Mês passado", "monthPrev"],
            ["Este ano", "year"],
            ["Ano passado", "lastYear"],
            ["Desde o início", "all"],
            ["Personalizado", "custom"],
          ].map(([label, value]) => {
            return (
              <TouchableOpacity
                key={value}
                onPress={() => {
                  if (value === "custom") {
                    abrirPersonalizado();
                    return;
                  }

                  setPeriod(value as string);
                  setSelectedPoint(null);
                  setShowCustomBox(false);
                  setMenuOpen(false);
                  }}
              >
                <Text style={styles.menuItem}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showCustomBox && (
        <View style={styles.customBox}>
          <Text style={styles.customTitle}>
            Selecione o intervalo personalizado
          </Text>

          <Text style={styles.customLabel}>Data inicial</Text>
          <input
            type="date"
            value={startDateInput}
            onChange={(e: any) => setStartDateInput(e.target.value)}
            style={
              {
                width: 220,
                maxWidth: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #D9DDE3",
                backgroundColor: "#FFF",
                color: "#333",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: 10,
              } as any
            }
          />

          <Text style={styles.customLabel}>Data final</Text>
          <input
            type="date"
            value={endDateInput}
            onChange={(e: any) => setEndDateInput(e.target.value)}
            style={
              {
                width: 220,
                maxWidth: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #D9DDE3",
                backgroundColor: "#FFF",
                color: "#333",
                fontSize: "14px",
                boxSizing: "border-box",
              } as any
            }
          />

          <View style={styles.customActions}>
            <TouchableOpacity
              style={styles.customButton}
              onPress={aplicarPersonalizado}
            >
              <Text style={styles.customButtonText}>Aplicar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.customButton}
              onPress={cancelarPersonalizado}
            >
              <Text style={styles.customButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.totalRow}>
  <Text style={styles.totalLabel}>
    {period === "today" ? "Total últimos 7 dias: " : "Total no gráfico: "}
  </Text>

  <Text style={styles.totalValue}>
    {formatMoney(totalGrafico)}
  </Text>
</View>

{period === "today" && (
  <Text style={styles.todayHighlight}>
    HOJE: {formatMoney(todayValue)}
  </Text>
)}

{selectedPoint && (
  <Text style={styles.pointInfo}>
    {selectedPoint.label}: {formatMoney(selectedPoint.value)}
  </Text>
)}

<View style={styles.chartTypeRow}>
  <TouchableOpacity
    style={[
      styles.chartTypeButton,
      chartType === "line" && styles.chartTypeButtonActive,
    ]}
    onPress={() => setChartType("line")}
  >
    <Text
      style={[
        styles.chartTypeText,
        chartType === "line" && styles.chartTypeTextActive,
      ]}
    >
      📈 Linha
    </Text>
  </TouchableOpacity>

  {!isBarBlockedOnMobile && (
  <TouchableOpacity
    style={[
      styles.chartTypeButton,
      chartType === "bar" && styles.chartTypeButtonActive,
    ]}
    onPress={() => setChartType("bar")}
  >
    <Text
      style={[
        styles.chartTypeText,
        chartType === "bar" && styles.chartTypeTextActive,
      ]}
    >
      📊 Colunas
    </Text>
  </TouchableOpacity>
)}


</View>
    
 

{shouldUseHorizontalScroll && (
  <Text style={styles.scrollHint}>
    ↔ Arraste o gráfico para ver mais dias
  </Text>
)}

    <View style={[styles.chartBox, isMobile && styles.chartBoxMobile]}>
    <ScrollView
    horizontal={shouldUseHorizontalScroll}
    showsHorizontalScrollIndicator={shouldUseHorizontalScroll}
    contentContainerStyle={styles.chartScrollContent}
    >
    {chartType === "line" ? (

    <LineChart
    data={chartData}
    width={chartWidth}
    height={chartHeight}
    yAxisLabel="R$ "
    chartConfig={{
      backgroundColor: "#FFFFFF",
      backgroundGradientFrom: "#FFFFFF",
      backgroundGradientTo: "#FFFFFF",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(10, 143, 85, ${opacity})`,
      labelColor: () => "#333",
      propsForDots: {
        r: "4",
        strokeWidth: "2",
        stroke: "#0A8F55",
      },
    }}
    renderDotContent={({ x, y, index, indexData }: any) => {
      const value = Number(indexData);

      if (value <= 0) {
        return null;
      }

      const isTodayPoint =
        period === "today" && index === safeChartValues.length - 1;

      const shouldShowLabel =
        period === "today"
          ? value > 0
          : safeChartValues.length <= 12
          ? value > 0
          : topLabelIndexes.includes(index);

      if (!shouldShowLabel) {
        return null;
      }

      
    const isTooCloseToTop = y < 28;

const rawLabelY = isTooCloseToTop ? y + 22 : y - 12;

const labelY = Math.min(
  Math.max(rawLabelY, 16),
  chartHeight - 8
);


const horizontalPadding = isTodayPoint ? 56 : 40;

const labelX = Math.min(
  Math.max(x, horizontalPadding),
  chartWidth - horizontalPadding
);

  return (
    <SvgText
      key={`dot-label-${index}`}
      x={labelX}
      y={labelY}
      fill={isTodayPoint ? "#0A8F55" : "#333"}
      fontSize={isTodayPoint ? "11" : "10"}
      fontWeight={isTodayPoint ? "700" : "600"}
      textAnchor="middle"
    >
      {isTodayPoint
        ? `HOJE ${formatShortMoney(value)}`
        : formatShortMoney(value)}
    </SvgText>
  );
}}




    onDataPointClick={({ value, index }: any) => {
      setSelectedPoint({
        label: safeChartLabels[index] || "Ponto",
        value: Number(value),
      });
    }}
    bezier
    style={styles.chart}
  />
) : (
  <BarChart
    data={barChartData}
    width={chartWidth}
    height={chartHeight}
    yAxisLabel="R$ "
    yAxisSuffix=""
    chartConfig={{
  backgroundColor: "#FAFAFA",
  backgroundGradientFrom: "#FAFAFA",
  backgroundGradientTo: "#FAFAFA",
  decimalPlaces: 0,

  color: () => "#06643F", // ✅ verde mais escuro

  labelColor: () => "#444", // ✅ texto mais forte

  barPercentage: 0.65, // ✅ barras mais grossas

  propsForBackgroundLines: {
    stroke: "#E4E7EB", // ✅ grid suave
    strokeDasharray: "4",
  },
}}
    fromZero
    showValuesOnTopOfBars={showBarValuesOnTop}

   

    withCustomBarColorFromData
    flatColor

   
 style={{
    borderRadius: 16,
    marginTop: 8,
  }}

  />
)}
  </ScrollView>
</View>

<View style={styles.rankingCard}>
  <Text style={styles.rankingTitle}>
  🔍 {tituloImpacto}
</Text>

  {rankingFinanceiro.length === 0 ? (
    <Text style={styles.rankingEmpty}>
      Nenhum dado disponível para este período.
    </Text>
  ) : (
    rankingFinanceiro.map((item, index) => (
      <Text
        key={`${item.label}-${index}`}
        style={styles.rankingItem}
      >
        
           {"*"}{" "}
        {item.label} → {formatMoney(item.value)}
      </Text>
    ))
  )}
</View>

<View style={styles.insightCard}>
  <Text style={styles.insightTitle}>
    🔥 Insight Financeiro
  </Text>

  <Text style={styles.insightSummaryText}>
    O Enxergaí analisou este período e preparou uma leitura completa dos seus gastos.
  </Text>

  <TouchableOpacity
    style={styles.openInsightsButton}
    onPress={() => setShowInsightsPopup(true)}
  >
    <Text style={styles.openInsightsButtonText}>
      🔥 Ver insights completos
    </Text>
  </TouchableOpacity>
</View>

<Modal
  visible={showInsightsPopup}
  transparent
  animationType="fade"
  onRequestClose={() => setShowInsightsPopup(false)}
>
  <View style={styles.insightsModalOverlay}>
    <View style={styles.insightsModalBox}>
      <View style={styles.insightsModalHeader}>
  <View style={styles.insightsModalTitleBox}>
    <Text style={styles.insightsModalTitle}>
      🔥 Insight Financeiro
    </Text>

    <Text style={styles.insightsModalSubtitle}>
      {labelPeriod(String(period))}
    </Text>

    <View style={styles.insightsModalActions}>
      

<View style={styles.insightsModeRow}>
  <TouchableOpacity
    style={[
      styles.insightsModeButton,
      modoInsights === "essencial" &&
        styles.insightsModeButtonActive,
    ]}
    onPress={() => setModoInsights("essencial")}
  >
    <Text
      style={[
        styles.insightsModeText,
        modoInsights === "essencial" &&
          styles.insightsModeTextActive,
      ]}
    >
      ⚡ Essencial
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.insightsModeButton,
      modoInsights === "comparativo" &&
        styles.insightsModeButtonActive,
    ]}
    onPress={() => setModoInsights("comparativo")}
  >
    <Text
      style={[
        styles.insightsModeText,
        modoInsights === "comparativo" &&
          styles.insightsModeTextActive,
      ]}
    >
      🧠 Comparativo
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.insightsModeButton,
      modoInsights === "completo" &&
        styles.insightsModeButtonActive,
    ]}
    onPress={() => setModoInsights("completo")}
  >
    <Text
      style={[
        styles.insightsModeText,
        modoInsights === "completo" &&
          styles.insightsModeTextActive,
      ]}
    >
      📚 Completo
    </Text>
  </TouchableOpacity>
</View>

<View style={styles.insightsDivider} />

<View style={styles.insightsActionsRow}>
  <TouchableOpacity
    style={styles.insightsModalActionButton}
    onPress={copiarInsightsTexto}
  >
    <Text style={styles.insightsModalActionText}>
      📋 Copiar
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.insightsModalActionButton}
    onPress={compartilharInsightsTexto}
  >
    <Text style={styles.insightsModalActionText}>
      📤 Compartilhar
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.insightsModalActionButton}
    onPress={exportarInsightsTexto}
  >
    <Text style={styles.insightsModalActionText}>
      ⬇️ Exportar
    </Text>
  </TouchableOpacity>
</View>

<View style={styles.insightsDivider} />

    </View>
  </View>

  <TouchableOpacity
    style={styles.insightsModalCloseButton}
    onPress={() => setShowInsightsPopup(false)}
  >
    <Text style={styles.insightsModalCloseText}>
      Fechar
    </Text>
  </TouchableOpacity>
</View>

      <ScrollView
        style={styles.insightsModalScroll}
        showsVerticalScrollIndicator={true}
      >
        {renderInsightsContent()}
      </ScrollView>

      <View style={styles.insightsModalFooter}>
        <Text style={styles.insightsModalFooterText}>
          O Enxergaí transforma seus números em uma leitura simples para ajudar você a decidir melhor.
        </Text>

        <TouchableOpacity
          style={styles.insightsModalFooterButton}
          onPress={() => setShowInsightsPopup(false)}
        >
          <Text style={styles.insightsModalFooterButtonText}>
            Fechar insights
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

</ScrollView>
);
}

function labelPeriod(p: string) {
  switch (p) {
    case "today":
      return "Hoje";
    case "week":
      return "Esta semana";
    case "weekPrev":
      return "Semana passada";
    case "month":
      return "Este mês";
    case "monthPrev":
      return "Mês passado";
    case "year":
      return "Este ano";
    case "lastYear":
      return "Ano passado";
    case "all":
      return "Desde o início";
    case "custom":
      return "Personalizado";
    default:
      return "Período";
  }
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: "#F7F8FA",
  paddingHorizontal: 12,
  paddingTop: 16,
  width: "100%",
},

containerMobile: {
  paddingHorizontal: 8,
  paddingTop: 12,
},

containerDesktop: {
  alignSelf: "center",
  width: "100%",
  maxWidth: 920,
},

  backText: {
    fontSize: 14,
    color: "#0A8F55",
    marginBottom: 10,
    fontWeight: "600",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0A8F55",
    marginBottom: 16,
    textAlign: "center",
  },

  filterButton: {
    alignItems: "center",
    marginBottom: 8,
  },

  filterText: {
    fontSize: 14,
    color: "#555",
  },

  customRangeText: {
    textAlign: "center",
    fontSize: 12,
    color: "#777",
    marginBottom: 8,
  },

  menu: {
    alignSelf: "center",
    width: 220,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 6,
    zIndex: 10,
  },

  menuItem: {
    paddingVertical: 8,
    color: "#333",
  },

  customBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#eee",
    alignItems: "flex-start",
  },

  customTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },

  customLabel: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },

  customActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  customButton: {
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  customButtonText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },

  totalText: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },

  chartBox: {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  paddingVertical: 12,
  alignItems: "stretch",
  width: "100%",
  overflow: "hidden",

  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 3,
},

 chartScrollContent: {
  alignItems: "center",
  justifyContent: "center",
  }, 

  chart: {
    borderRadius: 16,
  },

  totalRow: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 4,
},

totalLabel: {
  fontSize: 14,
  color: "#555",
},

totalValue: {
  fontSize: 15,
  color: "#0A8F55",
  fontWeight: "bold",
},

todayHighlight: {
  textAlign: "center",
  fontSize: 13,
  color: "#0A8F55",
  fontWeight: "bold",
  marginBottom: 6,
},

pointInfo: {
  textAlign: "center",
  fontSize: 13,
  color: "#333",
  fontWeight: "600",
  marginBottom: 8,
},

menuOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 5,
},

chartTypeRow: {
  flexDirection: "row",
  justifyContent: "center",
  gap: 10,
  marginBottom: 10,
},

chartTypeButton: {
  backgroundColor: "#FFF",
  borderWidth: 0.5,
  borderColor: "#eee",
  borderRadius: 10,
  paddingVertical: 8,
  paddingHorizontal: 12,
},

chartTypeButtonActive: {
  borderColor: "#0A8F55",
  borderWidth: 1,
},

chartTypeText: {
  fontSize: 13,
  color: "#555",
  fontWeight: "600",
},

chartTypeTextActive: {
  color: "#0A8F55",
},

chartBoxMobile: {
  paddingHorizontal: 4,
  paddingVertical: 10,
},

scrollHint: {
  textAlign: "center",
  fontSize: 11,
  color: "#888",
  marginBottom: 6,
},

rankingCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 16,
  marginTop: 12,
  borderWidth: 0.5,
  borderColor: "#E8EAEE",
},

rankingTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#0A8F55",
  marginBottom: 10,
},

rankingItem: {
  fontSize: 14,
  color: "#333",
  marginBottom: 8,
  lineHeight: 20,
},

rankingEmpty: {
  fontSize: 13,
  color: "#666",
},

insightCard: {
  backgroundColor: "#EEF7F3",
  borderRadius: 16,
  padding: 16,
  marginTop: 12,
  borderWidth: 0.5,
  borderColor: "#CFE8DB",
},

insightTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#0A8F55",
  marginBottom: 10,
},

insightItem: {
  fontSize: 14,
  color: "#4D6659",
  marginBottom: 8,
  lineHeight: 20,
},

insightSummaryText: {
  fontSize: 13,
  color: "#4D6659",
  lineHeight: 19,
  marginBottom: 12,
},

openInsightsButton: {
  backgroundColor: "#0A8F55",
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 14,
  alignItems: "center",
},

openInsightsButtonText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "700",
},

insightsModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.42)",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
},

insightsModalBox: {
  width: "100%",
  maxWidth: 760,
  maxHeight: "82%",
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  padding: 16,
  borderWidth: 0.5,
  borderColor: "#E8EAEE",
},

insightsModalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
},

insightsModalTitle: {
  fontSize: 17,
  fontWeight: "800",
  color: "#0A8F55",
},

insightsModalSubtitle: {
  fontSize: 12,
  color: "#6B7C72",
  marginTop: 2,
},

insightsModalCloseButton: {
  backgroundColor: "#F4F6F5",
  borderRadius: 10,
  paddingVertical: 7,
  paddingHorizontal: 12,
  borderWidth: 0.5,
  borderColor: "#DDE5E0",
},

insightsModalCloseText: {
  fontSize: 13,
  color: "#395247",
  fontWeight: "700",
},

insightsModalScroll: {
  maxHeight: 520,
},

insightsModalFooter: {
  borderTopWidth: 0.5,
  borderTopColor: "#E4EAE6",
  paddingTop: 12,
  marginTop: 10,
  gap: 10,
},

insightsModalFooterText: {
  fontSize: 12,
  color: "#6B7C72",
  lineHeight: 17,
},

insightsModalFooterButton: {
  backgroundColor: "#0A8F55",
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 14,
  alignItems: "center",
},

insightsModalFooterButtonText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "700",
},

insightsModalTitleBox: {
  flex: 1,
},

insightsModalActions: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
},

insightsModalActionButton: {
  backgroundColor: "#EEF7F3",
  borderRadius: 10,
  paddingVertical: 7,
  paddingHorizontal: 10,
  borderWidth: 0.5,
  borderColor: "#CFE8DB",
},

insightsModalActionText: {
  fontSize: 12,
  color: "#0A8F55",
  fontWeight: "700",
},

insightsSectionLabel: {
  fontSize: 11,
  fontWeight: "700",
  color: "#6B7C72",
  textTransform: "uppercase",
  marginBottom: 8,
},

insightsModeRow: {
  flexDirection: "row",
  gap: 8,
  marginBottom: 10,
},

insightsModeButton: {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#DDE5E0",
  borderRadius: 12,
  paddingVertical: 8,
  paddingHorizontal: 12,
},

insightsModeButtonActive: {
  backgroundColor: "#0A8F55",
  borderColor: "#0A8F55",
},

insightsModeText: {
  fontSize: 12,
  fontWeight: "700",
  color: "#395247",
},

insightsModeTextActive: {
  color: "#FFFFFF",
},

insightsActionsRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
},

insightsDivider: {
  height: 1,
  backgroundColor: "#E6ECE8",
  marginVertical: 10,
},

});