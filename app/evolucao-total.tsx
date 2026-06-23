import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
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
  const [selectedPoint, setSelectedPoint] = useState<{
  label: string;
  value: number;
} | null>(null);

  const [showCustomBox, setShowCustomBox] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const now = new Date();
  const { width } = useWindowDimensions();
  const chartWidth = width >= 768 ? width - 110 : width - 48;

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

 const totalGrafico = chartValues.reduce((sum, value) => sum + value, 0);
 const todayValue = last7DaysData[6] ?? 0;

  const chartData = {
    labels: safeChartLabels,
    datasets: [
      {
        data: safeChartValues,
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
    <View style={styles.container}>
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
  <Text style={styles.totalLabel}>Total no gráfico: </Text>
  <Text style={styles.totalValue}>{formatMoney(totalGrafico)}</Text>
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

      
       <View style={styles.chartBox}> <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          yAxisLabel="R$ "
          chartConfig={{
            backgroundColor: "#FFFFFF",
            backgroundGradientFrom: "#FFFFFF",
            backgroundGradientTo: "#FFFFFF",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(10, 143, 85, ${opacity})`,
            labelColor: () => "#666",
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

  return (
    <SvgText
      key={`dot-label-${index}`}
      x={x}
      y={y - 10}
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
      </View>
    </View>
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
    padding: 16,
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
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
    overflow: "hidden",

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

});