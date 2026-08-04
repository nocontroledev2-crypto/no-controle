import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
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
  label = labelsMonth[index];
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
  ],
  `${chaveInsights}-sem-movimentacao`
);

const textoDesbloquearAnalises = escolherTexto(
  [
    "Registre seus gastos para desbloquear análises inteligentes do Enxergaí.",
    "Assim que houver registros, o Enxergaí começará a transformar seus dados em entendimento.",
    "Com novos registros, o Enxergaí poderá gerar análises mais úteis para você.",
  ],
  `${chaveInsights}-desbloquear`
);

const textoPrimeiraMovimentacao = escolherTexto(
  [
    `Apenas um ${unidadeSingular} com movimentação financeira foi identificado neste período.`,
    `Este período ainda possui somente um ${unidadeSingular} com gasto registrado.`,
    `Até agora, há movimentação financeira em apenas um ${unidadeSingular} deste período.`,
  ],
  `${chaveInsights}-primeira`
);

const textoContinuarRegistrando = escolherTexto(
  [
    "Continue registrando seus gastos para que o Enxergaí possa identificar padrões e gerar análises mais completas.",
    "Com mais registros, o Enxergaí conseguirá enxergar melhor seu comportamento financeiro.",
    "Quanto mais informações forem registradas, mais precisas serão as análises do Enxergaí.",
  ],
  `${chaveInsights}-continuar`
);

const textoDadosInsuficientes = escolherTexto(
  [
    "Ainda não existem dados suficientes para gerar análises financeiras confiáveis.",
    "O período ainda possui poucos dados para conclusões financeiras mais completas.",
    "O Enxergaí ainda precisa de mais movimentações neste período para gerar uma análise confiável.",
  ],
  `${chaveInsights}-insuficiente`
);

const textoMaiorImpacto = maiorDia
  ? escolherTexto(
      [
        `O ${unidadeSingular} de maior impacto financeiro deste período foi ${maiorDia.label}, responsável por ${percentualMaiorDia.toFixed(
          1
        )}% do total gasto.`,
        `${maiorDia.label} concentrou ${percentualMaiorDia.toFixed(
          1
        )}% de todo o valor gasto neste período.`,
        `O maior impacto financeiro do período ocorreu no ${maiorDia.label}, representando ${percentualMaiorDia.toFixed(
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
    const abreviado = maiorDia.label.split("/")[0];

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

    return mapaMeses[abreviado] || maiorDia.label;
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
    `Grande parte dos gastos ${contextoPeriodoInsight} ficou concentrada em poucos momentos, indicando pontos específicos de maior impacto financeiro.`,
    `Boa parte do dinheiro gasto ${contextoPeriodoInsight} apareceu em poucos momentos específicos.`,
    `Uma pequena quantidade de movimentações respondeu pela maior parte dos gastos ${contextoPeriodoInsight}.`,
    `Uma parte importante do dinheiro gasto ${contextoPeriodoInsight} apareceu em poucos pontos. Vale observar o que aconteceu nesses momentos.`,
  ],
  `${chaveInsights}-concentracao-alta`
);

const textoConcentracaoBaixa = escolherTexto(
  [
    `Os gastos ${contextoPeriodoInsight} ficaram mais distribuídos, sem forte concentração em poucos momentos.`,
    `Não houve uma concentração forte dos gastos ${contextoPeriodoInsight}.`,
    `Os valores aparecem mais espalhados ${contextoPeriodoInsight}.`,
    `Os gastos ficaram mais divididos ao longo do período, sem um único ponto dominando muito o total.`,
  ],
  `${chaveInsights}-concentracao-baixa`
);

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
        `Os gastos ficaram relativamente equilibrados entre a primeira e a segunda metade ${contextoPeriodoComDe}.`,
        "Não houve grande diferença entre o começo e o fim do período analisado.",
        "Os valores ficaram próximos entre as duas partes do período, o que pode facilitar o planejamento financeiro.",
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
            ]
          : [
              `Dentro de ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} foi o detalhe que mais pesou.`,
              `${subcategoriaDominante.subcategoria} teve o maior impacto dentro de ${categoriaDominante?.categoria}.`,
              `Ao detalhar ${categoriaDominante?.categoria}, ${subcategoriaDominante.subcategoria} aparece como o principal ponto de atenção.`,
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
  `Houve vários ${unidadeTempoPositiva} sem movimentação financeira registrada ${contextoPeriodoHumano}.`,

  `Boa parte dos ${unidadeTempoPositiva} ${contextoPeriodoHumano} não apresentou movimentação financeira registrada.`,

  `O período apresentou diversos ${unidadeTempoPositiva} sem movimentação financeira registrada ${contextoPeriodoHumano}.`,
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
              `${categoriaQueMaisGanhouEspaco.categoria} ganhou mais espaço nos gastos: antes representava ${categoriaQueMaisGanhouEspaco.percentualAnterior.toFixed(
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
              `Essa mudança mostra que ${categoriaQueMaisGanhouEspaco?.categoria} ganhou atenção nesta semana. Vale observar se foi algo planejado ou se apareceu fora do esperado.`,

              `Comparando com a semana passada, ${categoriaQueMaisGanhouEspaco?.categoria} passou a ocupar mais espaço. Esse é um bom ponto para entender o que mudou na rotina.`,

              `O principal ponto para enxergar agora é essa troca: ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu força e ${categoriaQueMaisGanhouEspaco?.categoria} começou a pesar mais nesta semana.`,
            ]
          : period === "month"
          ? [
              `Como ${categoriaQueMaisGanhouEspaco?.categoria} passou a pesar mais neste mês, vale olhar os maiores lançamentos dessa categoria e separar o que foi planejado do que pode ter sido impulso.`,

              `Essa mudança merece atenção porque ${categoriaQueMaisGanhouEspaco?.categoria} virou um ponto mais forte neste mês. Entender o motivo ajuda a ajustar o planejamento.`,

              `O principal aprendizado deste mês está na troca de foco: ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu espaço e ${categoriaQueMaisGanhouEspaco?.categoria} passou a puxar mais dinheiro.`,
            ]
          : period === "year"
          ? [
              `Essa virada no ano mostra que o dinheiro passou a se concentrar mais em ${categoriaQueMaisGanhouEspaco?.categoria}. Vale acompanhar se isso representa uma nova fase de gastos ou algo pontual.`,

              `Olhando o ano como um todo, ${categoriaQueMaisGanhouEspaco?.categoria} ganhou mais peso na sua vida financeira. Enxergar essa mudança ajuda a planejar melhor os próximos meses.`,

              `A principal leitura do ano é essa: ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu participação e ${categoriaQueMaisGanhouEspaco?.categoria} passou a ocupar mais espaço no orçamento.`,
            ]
          : [
              `Essa mudança mostra que ${categoriaQueMaisGanhouEspaco?.categoria} passou a pesar mais no período. Vale observar se foi algo planejado, necessário ou fora do esperado.`,

              `O principal ponto para enxergar é a troca de peso: ${categoriaQueMaisPerdeuEspaco?.categoria} perdeu força e ${categoriaQueMaisGanhouEspaco?.categoria} ganhou espaço.`,

              `Esse movimento ajuda a entender para onde o dinheiro passou a ir com mais força dentro do período analisado.`,
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

const deveMostrarFeedbackPositivo =
  nivelMaturidade >= 3 &&
  !houveMelhoraDistribuicao &&
  (
    temDistribuicaoSaudavel ||
    percentualDiasSemGasto >= 40
  );

  const deveMostrarReconhecimentoEvolucao =
  houveMelhoraDistribuicao;

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

  {nivelMaturidade === 0 && (
    <>
      <Text style={styles.insightItem}>
        • {textoSemMovimentacao}
      </Text>

      <Text style={styles.insightItem}>
        • {textoDesbloquearAnalises}
      </Text>
    </>
  )}

  {nivelMaturidade === 1 && (
    <>
      <Text style={styles.insightItem}>
        • {textoPrimeiraMovimentacao}
      </Text>

      <Text style={styles.insightItem}>
        • {textoContinuarRegistrando}
      </Text>
    </>
  )}

  {nivelMaturidade === 2 && (
    <>
      <Text style={styles.insightItem}>
        • {textoDadosInsuficientes}
      </Text>
    </>
  )}

  {nivelMaturidade >= 3 && (
    <>
    {deveMostrarAvisoLancamentosFuturos && (
  <Text style={styles.insightItem}>
    • {textoAvisoLancamentosFuturos}
  </Text>
)}
      {maiorDia && deveMostrarMaiorImpacto && (
  <Text style={styles.insightItem}>
    • {textoMaiorImpacto}
  </Text>
)}

      {deveMostrarTop3Impacto ? (
  <>
    <Text style={styles.insightItem}>
      • {textoTop3Impacto}
    </Text>

    <Text style={styles.insightItem}>
      • {percentualTop3 >= 70
        ? textoConcentracaoAlta
        : textoConcentracaoBaixa}
    </Text>
  </>
) : (
  <Text style={styles.insightItem}>
    • {textoPoucosPontosMensais}
  </Text>
)}

{deveMostrarHojeVsMedia && !deveMostrarAvisoLancamentosFuturos && (
  <Text style={styles.insightItem}>
    • {textoHojeVsMedia}
  </Text>
)}

{!deveMostrarAvisoLancamentosFuturos && (
  <Text style={styles.insightItem}>
    • {textoTendenciaPeriodo}
  </Text>
)}

{deveMostrarMovimentoRecente && !deveMostrarAvisoLancamentosFuturos && (
  <Text style={styles.insightItem}>
    • {textoMovimentoRecente}
  </Text>
)}

{deveMostrarCategoriaDominante && (
  <Text style={styles.insightItem}>
    • {textoCategoriaDominante}
  </Text>
)}

{deveMostrarSubcategoriaDominante && (
  <Text style={styles.insightItem}>
    • {textoSubcategoriaDominante}
  </Text>
)}

{deveMostrarOrientacaoPraticaCategoria && (
  <Text style={styles.insightItem}>
    • {textoOrientacaoPraticaCategoria}
  </Text>
)}

{deveMostrarFeedbackPositivo && (
  <Text style={styles.insightItem}>
    ✅ {textoFeedbackPositivo}
  </Text>
)}

{houveMelhoraDistribuicao && (
  <Text style={styles.insightItem}>
    ✅ {textoConquistaEntrePeriodos}
  </Text>
)}

{deveMostrarReconhecimentoEvolucao && (
  <Text style={styles.insightItem}>
    💡 {textoReconhecimentoEvolucao}
  </Text>
)}

{mudouCategoriaDominante && (
  <Text style={styles.insightItem}>
    🔄 {textoMudancaCategoriaDominante}
  </Text>
)}

{deveMostrarCategoriaGanhouEspaco && (
  <Text style={styles.insightItem}>
    📈 {textoCategoriaGanhouEspaco}
  </Text>
)}

{deveMostrarCategoriaPerdeuEspaco && (
  <Text style={styles.insightItem}>
    📉 {textoCategoriaPerdeuEspaco}
  </Text>
)}

{deveMostrarComparacaoInteligente && (
  <Text style={styles.insightItem}>
    🧠 {textoComparacaoInteligente}
  </Text>
)}

{deveMostrarExplicacaoMudancaCategoria && (
  <Text style={styles.insightItem}>
    💡 {textoExplicacaoMudancaCategoria}
  </Text>
)}

</>
)}
</View>

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

});