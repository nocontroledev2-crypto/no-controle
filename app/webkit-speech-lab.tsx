// @ts-nocheck

import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Scenario = {
  id: string;
  label: string;
  preflight: boolean;
  delayMs: number;
  recreateDocument?: boolean;
  postReloadDelayMs?: number;
};

const scenarios: Scenario[] = [
  {
    id: "fresh",
    label: "1. Instância nova simples",
    preflight: false,
    delayMs: 0,
  },
  {
    id: "preflight-300",
    label: "2. getUserMedia + stop + 300 ms",
    preflight: true,
    delayMs: 300,
  },
  {
    id: "preflight-500",
    label: "3. getUserMedia + stop + 500 ms",
    preflight: true,
    delayMs: 500,
  },
  {
    id: "preflight-1000",
    label: "4. getUserMedia + stop + 1.000 ms",
    preflight: true,
    delayMs: 1000,
  },
  {
    id: "preflight-3500",
    label: "5. getUserMedia + stop + 3.500 ms",
    preflight: true,
    delayMs: 3500,
  },
  {
    id: "recreate-document",
    label: "6. Recriar documento após cada resultado",
    preflight: false,
    delayMs: 0,
    recreateDocument: true,
  },
  {
    id: "recreate-document-8000",
    label:
      "7. Recriar documento + estabilizar 8 segundos",
    preflight: false,
    delayMs: 0,
    recreateDocument: true,
    postReloadDelayMs: 8000,
  },
];

const watchdogMs = 8000;

const reloadHistoryKey =
  "enxergai-webkit-speech-reload-history";

const reloadScenarioKey =
  "enxergai-webkit-speech-reload-scenario";

const reloadReadyAtKey =
  "enxergai-webkit-speech-reload-ready-at";

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function nowLabel() {
  return new Date().toLocaleTimeString(
    "pt-BR",
    {
      hour12: false,
      fractionalSecondDigits: 3,
    }
  );
}

export default function WebkitSpeechLab() {
  const recognitionRef = useRef<any>(null);
  const watchdogRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const [scenarioId, setScenarioId] =
    useState("fresh");

  const [status, setStatus] =
    useState("Pronto");

  const [attempt, setAttempt] =
    useState(0);

  const [transcript, setTranscript] =
    useState("");

  const [logs, setLogs] =
    useState<string[]>([]);

  const [running, setRunning] =
    useState(false);

  function addLog(message: string) {
    setLogs((current) => [
      `${nowLabel()} | ${message}`,
      ...current,
    ]);
  }

  function readReloadHistory() {
    try {
      const stored =
        window.sessionStorage.getItem(
          reloadHistoryKey
        );

      const parsed = stored
        ? JSON.parse(stored)
        : [];

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  function persistReloadResult(
    text: string,
    scenario: Scenario
  ) {
    const history = readReloadHistory();

    const nextHistory = [
      ...history,
      {
        round: history.length + 1,
        transcript: text,
        completedAt:
          new Date().toISOString(),
      },
    ];

    window.sessionStorage.setItem(
      reloadHistoryKey,
      JSON.stringify(nextHistory)
    );

    window.sessionStorage.setItem(
      reloadScenarioKey,
      scenario.id
    );

    const readyAt =
      Date.now() +
      (scenario.postReloadDelayMs ?? 0);

    window.sessionStorage.setItem(
      reloadReadyAtKey,
      String(readyAt)
    );

    return nextHistory;
  }

  function recreateDocument() {
    const nextUrl =
      `${window.location.pathname}` +
      `?labReload=${Date.now()}`;

    window.location.replace(nextUrl);
  }

  function clearWatchdog() {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }

  function destroyRecognition(
    recognition = recognitionRef.current,
    abort = false
  ) {
    clearWatchdog();

    if (!recognition) {
      recognitionRef.current = null;
      return;
    }

    recognition.onstart = null;
    recognition.onaudiostart = null;
    recognition.onsoundstart = null;
    recognition.onspeechstart = null;
    recognition.onresult = null;
    recognition.onspeechend = null;
    recognition.onsoundend = null;
    recognition.onaudioend = null;
    recognition.onerror = null;
    recognition.onend = null;

    if (abort) {
      try {
        recognition.abort();
      } catch {
        // A sessão pode já estar encerrada.
      }
    }

    if (recognitionRef.current === recognition) {
      recognitionRef.current = null;
    }
  }

  async function releaseHardwareAudio() {
    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error(
        "getUserMedia indisponível."
      );
    }

    addLog("getUserMedia: solicitando");

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

    addLog(
      `getUserMedia: ${stream.getTracks().length} trilha(s)`
    );

    stream.getTracks().forEach((track) => {
      addLog(
        `track.stop: ${track.kind} / ${track.readyState}`
      );

      track.stop();

      addLog(
        `track após stop: ${track.readyState}`
      );
    });

    addLog("hardware auxiliar liberado");
  }

  async function startTest() {
    if (running) {
      return;
    }

    if (Platform.OS !== "web") {
      alert(
        "Este laboratório funciona somente na Web."
      );
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "SpeechRecognition não está disponível."
      );
      return;
    }

    const scenario =
      scenarios.find(
        (item) => item.id === scenarioId
      ) ?? scenarios[0];

    const readyAt = Number(
      window.sessionStorage.getItem(
        reloadReadyAtKey
      ) ?? "0"
    );

    const remainingDelayMs =
      scenario.postReloadDelayMs
        ? Math.max(0, readyAt - Date.now())
        : 0;

    setRunning(true);
    setTranscript("");
    setStatus("Preparando");

    addLog(
      `TENTATIVA ${attempt + 1} | ${scenario.label}`
    );

    destroyRecognition(
      recognitionRef.current,
      true
    );

    try {
      if (remainingDelayMs > 0) {
        const seconds =
          Math.ceil(remainingDelayMs / 1000);

        setStatus(
          `Estabilizando microfone: ${seconds} segundo(s)`
        );

        addLog(
          `estabilização após recarga: ${remainingDelayMs} ms`
        );

        await wait(remainingDelayMs);

        addLog(
          "estabilização após recarga: concluída"
        );
      }

      if (scenario.preflight) {
        await releaseHardwareAudio();

        addLog(
          `aguardando ${scenario.delayMs} ms`
        );

        await wait(scenario.delayMs);
      }

      const recognition =
        new SpeechRecognition();

      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        addLog("evento: start");
        setStatus("Ouvindo");
      };

      recognition.onaudiostart = () => {
        addLog("evento: audiostart");
      };

      recognition.onsoundstart = () => {
        addLog("evento: soundstart");
      };

      recognition.onspeechstart = () => {
        addLog("evento: speechstart");
      };

      recognition.onresult = (event: any) => {
        const text =
          event.results?.[0]?.[0]
            ?.transcript ?? "";

        addLog(`evento: result | ${text}`);
        setTranscript(text);
        setStatus("Resultado recebido");

        clearWatchdog();

        try {
          recognition.stop();
          addLog("comando: stop");
        } catch {
          addLog("stop lançou exceção");
        }

        if (scenario.recreateDocument) {
          const history =
            persistReloadResult(
              text,
              scenario
            );

          addLog(
            `recriando documento após resultado ${history.length}`
          );

          window.setTimeout(
            recreateDocument,
            500
          );
        }
      };

      recognition.onspeechend = () => {
        addLog("evento: speechend");
      };

      recognition.onsoundend = () => {
        addLog("evento: soundend");
      };

      recognition.onaudioend = () => {
        addLog("evento: audioend");
      };

      recognition.onerror = (event: any) => {
        addLog(
          `evento: error | ${String(
            event?.error ?? "desconhecido"
          )}`
        );

        setStatus("Erro");
        setRunning(false);
        destroyRecognition(recognition);
      };

      recognition.onend = () => {
        addLog("evento: end");

        setRunning(false);

        setStatus((current) =>
          current === "Resultado recebido"
            ? current
            : "Encerrado sem resultado"
        );

        destroyRecognition(recognition);
      };

      watchdogRef.current = setTimeout(
        () => {
          addLog(
            "WATCHDOG: 8 segundos sem conclusão"
          );

          setStatus("Watchdog acionado");
          setRunning(false);

          try {
            recognition.abort();
            addLog("WATCHDOG: abort");
          } catch {
            addLog(
              "WATCHDOG: abort lançou exceção"
            );
          }

          destroyRecognition(recognition);
        },
        watchdogMs
      );

      recognition.start();

      addLog("comando: start");
      setAttempt((current) => current + 1);
    } catch (error) {
      addLog(
        `exceção: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );

      setStatus("Falha ao iniciar");
      setRunning(false);
      destroyRecognition(
        recognitionRef.current,
        true
      );
    }
  }

  function abortAndClean() {
    addLog("AÇÃO MANUAL: abortar e limpar");

    destroyRecognition(
      recognitionRef.current,
      true
    );

    setRunning(false);
    setStatus("Abortado e limpo");
  }

  function clearLog() {
    window.sessionStorage.removeItem(
      reloadHistoryKey
    );

    window.sessionStorage.removeItem(
      reloadScenarioKey
    );

    window.sessionStorage.removeItem(
      reloadReadyAtKey
    );

    setLogs([]);
    setTranscript("");
    setAttempt(0);
    setStatus("Pronto");
  }

  useEffect(() => {
    addLog(
      `userAgent: ${navigator.userAgent}`
    );

    addLog(
      `platform: ${navigator.platform}`
    );

    addLog(
      `touchPoints: ${navigator.maxTouchPoints}`
    );

    const storedScenario =
      window.sessionStorage.getItem(
        reloadScenarioKey
      );

    if (
      storedScenario ===
        "recreate-document" ||
      storedScenario ===
        "recreate-document-8000"
    ) {
      setScenarioId(storedScenario);

      const history =
        readReloadHistory();

      setAttempt(history.length);

      history
        .slice()
        .reverse()
        .forEach((item: any) => {
          addLog(
            `DOCUMENTO ${item.round} | result | ${item.transcript}`
          );
        });

      if (history.length > 0) {
        const latest =
          history[history.length - 1];

        setTranscript(
          String(latest.transcript ?? "")
        );

        setStatus(
          `Documento recriado após ${history.length} resultado(s)`
        );
      }
    }

    return () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }

      const recognition =
        recognitionRef.current;

      recognitionRef.current = null;

      if (recognition) {
        recognition.onstart = null;
        recognition.onaudiostart = null;
        recognition.onsoundstart = null;
        recognition.onspeechstart = null;
        recognition.onresult = null;
        recognition.onspeechend = null;
        recognition.onsoundend = null;
        recognition.onaudioend = null;
        recognition.onerror = null;
        recognition.onend = null;

        try {
          recognition.abort();
        } catch {
          // A sessao pode ja estar encerrada.
        }
      }
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.brand}>
        ENXERGAÍ
      </Text>

      <Text style={styles.title}>
        Laboratório WebKit de voz
      </Text>

      <Text style={styles.warning}>
        Página técnica isolada. Não salva despesas,
        não acessa conta e não utiliza API externa.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Status
        </Text>

        <Text style={styles.status}>
          {status}
        </Text>

        <Text style={styles.metadata}>
          Tentativas iniciadas: {attempt}
        </Text>

        <Text style={styles.label}>
          Última transcrição
        </Text>

        <Text style={styles.transcript}>
          {transcript || "Nenhuma"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Cenário
        </Text>

        {scenarios.map((scenario) => {
          const selected =
            scenario.id === scenarioId;

          return (
            <TouchableOpacity
              key={scenario.id}
              style={[
                styles.scenarioButton,
                selected &&
                  styles.scenarioButtonSelected,
              ]}
              onPress={() =>
                setScenarioId(scenario.id)
              }
              disabled={running}
            >
              <Text
                style={[
                  styles.scenarioText,
                  selected &&
                    styles.scenarioTextSelected,
                ]}
              >
                {scenario.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          running &&
            styles.primaryButtonDisabled,
        ]}
        onPress={startTest}
        disabled={running}
      >
        <Text style={styles.primaryText}>
          {running
            ? "🎤 Teste em andamento"
            : "🎤 Iniciar teste"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.abortButton}
        onPress={abortAndClean}
      >
        <Text style={styles.abortText}>
          Abortar e limpar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={clearLog}
        disabled={running}
      >
        <Text style={styles.clearText}>
          Limpar relatório
        </Text>
      </TouchableOpacity>

      <View style={styles.logCard}>
        <Text style={styles.label}>
          Cronologia dos eventos
        </Text>

        {logs.length === 0 ? (
          <Text style={styles.emptyLog}>
            Nenhum evento registrado.
          </Text>
        ) : (
          logs.map((entry, index) => (
            <Text
              key={`${index}-${entry}`}
              style={styles.logText}
            >
              {entry}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF7F3",
  },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 60,
  },
  brand: {
    color: "#0A8F55",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 16,
  },
  title: {
    color: "#173B2D",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 5,
  },
  warning: {
    color: "#50635B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D9E7E0",
  },
  label: {
    color: "#173B2D",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  status: {
    color: "#0A8F55",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  metadata: {
    color: "#52655C",
    fontSize: 13,
    marginBottom: 18,
  },
  transcript: {
    color: "#172A22",
    fontSize: 16,
    lineHeight: 23,
  },
  scenarioButton: {
    borderWidth: 1,
    borderColor: "#B7C9C0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  scenarioButtonSelected: {
    borderColor: "#0A8F55",
    backgroundColor: "#E7F5EE",
  },
  scenarioText: {
    color: "#40534A",
    fontWeight: "600",
  },
  scenarioTextSelected: {
    color: "#087845",
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  abortButton: {
    backgroundColor: "#FFF1F0",
    borderWidth: 1,
    borderColor: "#D55B52",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  abortText: {
    color: "#A5342D",
    fontWeight: "800",
  },
  clearButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#91A69B",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  clearText: {
    color: "#40534A",
    fontWeight: "700",
  },
  logCard: {
    backgroundColor: "#122019",
    borderRadius: 14,
    padding: 14,
  },
  emptyLog: {
    color: "#AABAB1",
    fontSize: 13,
  },
  logText: {
    color: "#D8F4E6",
    fontSize: 11,
    lineHeight: 17,
    fontFamily:
      Platform.OS === "web"
        ? "monospace"
        : undefined,
    marginBottom: 3,
  },
});
