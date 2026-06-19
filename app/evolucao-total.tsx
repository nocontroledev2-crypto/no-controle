import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { getAllExpenses } from "./storage/expenseStorage";

export default function EvolucaoTotal() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [period, setPeriod] = useState<string>(
    (params.period as string) || "month"
  );

  const [expenses, setExpenses] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const now = new Date();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const data = await getAllExpenses();
        setExpenses(data || []);
      }

      load();
    }, [])
  );

  function parseDateSafe(dateStr: string) {
    const [ano, mes, dia] = dateStr.split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay(); // domingo = 0
    const diff = day === 0 ? -6 : 1 - day; // segunda-feira como início
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

  /* ===============================
     DADOS MENSAIS
  =============================== */

  const monthlyData: number[] = Array(12).fill(0);

  expenses.forEach((item: any) => {
    const d = parseDateSafe(item.data);

    // Por enquanto, evolução mensal do ano atual
    if (d.getFullYear() === now.getFullYear()) {
      const mesIndex = d.getMonth();
      monthlyData[mesIndex] += Number(item.valor);
    }
  });

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
     DADOS SEMANAIS
  =============================== */

  const weeklyData: number[] = Array(7).fill(0);

  let weekReference = new Date(now);

  if (period === "weekPrev") {
    weekReference.setDate(now.getDate() - 7);
  }

  const startWeek = getStartOfWeek(weekReference);
  const endWeek = getEndOfWeek(weekReference);

  expenses.forEach((item: any) => {
    const d = parseDateSafe(item.data);

    if (d >= startWeek && d <= endWeek) {
      const jsDay = d.getDay(); // domingo = 0
      const index = jsDay === 0 ? 6 : jsDay - 1; // segunda = 0, domingo = 6

      weeklyData[index] += Number(item.valor);
    }
  });

  const labelsWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  /* ===============================
     ESCOLHA DINÂMICA DO GRÁFICO
  =============================== */

  const isWeekChart =
    period === "today" || period === "week" || period === "weekPrev";

  const chartLabels = isWeekChart ? labelsWeek : labelsMonth;
  const chartValues = isWeekChart ? weeklyData : monthlyData;

  const totalGrafico = chartValues.reduce((sum, value) => sum + value, 0);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
      },
    ],
  };

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
                    alert("Personalizado será implementado na próxima etapa.");
                    setMenuOpen(false);
                    return;
                  }

                  setPeriod(value as string);
                  setMenuOpen(false);
                }}
              >
                <Text style={styles.menuItem}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.totalText}>
        Total no gráfico: {formatMoney(totalGrafico)}
      </Text>

      <View style={styles.chartBox}>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 32}
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
    marginBottom: 10,
  },

  filterText: {
    fontSize: 14,
    color: "#555",
  },

  menu: {
    alignSelf: "center",
    width: 220,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 6,
  },

  menuItem: {
    paddingVertical: 8,
    color: "#333",
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
  },

  chart: {
    borderRadius: 16,
  },
});