import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MicrophoneIcon, SpinnerIcon } from "@/components/icons";

export default function Transcribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        // Placeholder for MVP - will connect to backend transcription in integration phase
        setTimeout(() => {
          const mockTranscription = "This is a sample transcription of your audio recording. In the full implementation, this will be the actual transcribed text from your audio using AI-powered speech-to-text technology. You can use this to review sales calls, practice sessions, or any coaching conversations.";
          setTranscription(mockTranscription);
          setIsProcessing(false);
        }, 2000);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-black text-foreground mb-2" data-testid="text-transcribe-title">
        Audio Transcriber
      </h1>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        Record and transcribe sales calls, practice sessions, or coaching conversations. Review transcripts to identify improvement opportunities and track your progress.
      </p>

      <Card className="mb-8">
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
              <Button onClick={stopRecording} variant="destructive" size="lg" className="font-bold" data-testid="button-stop-recording">
                Stop Recording
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-foreground mb-4">Ready to record</p>
              <Button onClick={startRecording} size="lg" className="font-bold" data-testid="button-start-recording">
                <MicrophoneIcon className="w-5 h-5" />
                Start Recording
              </Button>
            </div>
          )}
        </div>
      </Card>

      {isProcessing && (
        <Card className="flex items-center justify-center h-32">
          <div className="text-center">
            <SpinnerIcon className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Transcribing audio...</p>
          </div>
        </Card>
      )}

      {transcription && !isProcessing && (
        <Card>
          <h2 className="text-2xl font-bold text-foreground mb-4">Transcription</h2>
          <div className="bg-accent rounded-lg p-4">
            <p className="text-foreground leading-relaxed" data-testid="text-transcription">
              {transcription}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="font-bold" data-testid="button-copy">
              Copy to Clipboard
            </Button>
            <Button variant="outline" className="font-bold" data-testid="button-export-transcription">
              Export as Text
            </Button>
          </div>
        </Card>
      )}

      {!transcription && !isProcessing && !isRecording && (
        <Card className="bg-accent/50">
          <h3 className="font-bold text-lg text-foreground mb-3">How it works:</h3>
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
        </Card>
      )}
    </div>
  );
}
