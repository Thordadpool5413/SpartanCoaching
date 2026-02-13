import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MicrophoneIcon, SpinnerIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Transcribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setHasError(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscription(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // This is common and not really an error
        return;
      }
      setIsRecording(false);
      setHasError(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    trackEvent("ai_tool_usage", "transcribe");
    try {
      setTranscription("");
      setHasError(false);
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      alert("Could not start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
  };

  const exportAsText = () => {
    const blob = new Blob([transcription], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcription.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO />
      <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Transcribe" }]} />
      <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-transcribe-title">
        Audio Transcriber
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed">
        Record and transcribe sales calls, practice sessions, or coaching conversations. Review transcripts to identify improvement opportunities and track your progress.
      </p>

      <Card className="mb-8 card-lift border-2 shadow-lg spacing-card">
        <div className="text-center py-8">
          <div className="mb-6">
            {isRecording ? (
              <div className="w-24 h-24 mx-auto rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                  <MicrophoneIcon className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <MicrophoneIcon className="w-12 h-12 text-primary" />
              </div>
            )}
          </div>

          {isRecording ? (
            <div>
              <p className="text-lg font-semibold text-destructive mb-4">Recording in progress...</p>
              <Button onClick={stopRecording} variant="destructive" size="lg" className="font-bold min-h-[52px] touch-manipulation" data-testid="button-stop-recording">
                Stop Recording
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-foreground mb-4">Ready to record</p>
              <Button onClick={startRecording} size="lg" className="font-bold min-h-[52px] touch-manipulation" data-testid="button-start-recording">
                <MicrophoneIcon className="w-5 h-5" />
                <span>Start Recording</span>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {isProcessing && (
        <Card className="flex items-center justify-center h-32 card-lift border-2 shadow-lg spacing-card">
          <div className="text-center">
            <SpinnerIcon className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Transcribing audio...</p>
          </div>
        </Card>
      )}

      {transcription && !isProcessing && (
        <Card className="card-lift border-2 shadow-lg spacing-card">
          <h2 className="text-h2 font-bold text-foreground mb-4">Transcription</h2>
          <div className="bg-accent rounded-lg p-4">
            <p className="text-foreground leading-relaxed" data-testid="text-transcription">
              {transcription}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={copyToClipboard} variant="outline" size="default" className="font-bold min-h-[48px] touch-manipulation" data-testid="button-copy">
              Copy to Clipboard
            </Button>
            <Button onClick={exportAsText} variant="outline" size="default" className="font-bold min-h-[48px] touch-manipulation" data-testid="button-export-transcription">
              Export as Text
            </Button>
          </div>
        </Card>
      )}

      {!transcription && !isProcessing && !isRecording && !hasError && (
        <Card className="bg-accent/50 card-lift border-2 shadow-lg spacing-card">
          <h3 className="text-h3 font-bold text-foreground mb-4">How it works:</h3>
          <ol className="space-y-2 text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span>Click "Start Recording" and allow microphone access</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span>Practice your pitch, objection response, or record a real call</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span>Click "Stop Recording" when finished</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span>Review your transcription and identify areas for improvement</span>
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong>Note:</strong> This feature works best in Chrome, Edge, or Safari browsers. Make sure to speak clearly and allow microphone permissions when prompted.
          </p>
        </Card>
      )}

      {hasError && (
        <Card className="bg-destructive/10 border-destructive card-lift border-2 shadow-lg spacing-card">
          <h3 className="text-h3 font-bold text-destructive mb-4">Browser Not Supported</h3>
          <p className="text-muted-foreground">
            Speech recognition is not available in your current browser. Please use Chrome, Edge, or Safari for the best experience with real-time transcription.
          </p>
        </Card>
      )}
    </div>
  );
}
