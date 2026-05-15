
import * as FileSystem from "expo-file-system";
import { GOOGLE_SPEECH_API_KEY } from "../../constants/google";

export async function speechToTextGoogle(
  audioUri: string
): Promise<string> {
  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: "base64",
  });

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_SPEECH_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          encoding: "LINEAR16",
          languageCode: "pt-BR",
        },
        audio: {
          content: audioBase64,
        },
      }),
    }
  );


  const json = await response.json();

  if (!json.results || json.results.length === 0) {
    throw new Error("Nenhum texto reconhecido");
  }

  return json.results[0].alternatives[0].transcript;
}