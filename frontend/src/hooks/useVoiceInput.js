import { useState } from "react";

/**
 * Wraps the browser's SpeechRecognition API. Calling `startListening()`
 * transcribes one utterance and passes it to `onResult`.
 */
export function useVoiceInput(onResult) {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event) => {
      onResult(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
  };

  return { isListening, startListening };
}
