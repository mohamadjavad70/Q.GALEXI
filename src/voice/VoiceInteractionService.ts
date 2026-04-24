export interface VoiceTranscriptResult {
  text: string;
  language: string;
}

export class VoiceInteractionService {
  private recognition: SpeechRecognition | null = null;

  async startSingleShot(language = "de-DE"): Promise<VoiceTranscriptResult> {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      throw new Error("Speech recognition is not supported in this browser");
    }

    return new Promise((resolve, reject) => {
      const rec = new SR();
      rec.lang = language;
      rec.continuous = false;
      rec.interimResults = false;
      this.recognition = rec;

      rec.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript ?? "";
        resolve({ text, language });
      };

      rec.onerror = () => {
        reject(new Error("Voice recognition failed"));
      };

      rec.onend = () => {
        this.recognition = null;
      };

      rec.start();
    });
  }

  stop(): void {
    this.recognition?.stop();
    this.recognition = null;
  }
}

export const voiceInteractionService = new VoiceInteractionService();
