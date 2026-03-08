import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { MarkdownContent } from "@/components/MarkdownContent";
import { trackEvent } from "@/lib/analytics";
import { Mic, MicOff, Upload, Copy, Download, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Transcribe() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const uploadAndTranscribe = async (blob: Blob, filename: string) => {
    setIsTranscribing(true);
    setTranscript("");
    setAnalysis("");
    try {
      const formData = new FormData();
      formData.append("audio", blob, filename);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Transcription failed" }));
        throw new Error(err.error || "Transcription failed");
      }
      const data = await res.json();
      setTranscript(data.transcript || "");
      trackEvent("ai_tool_usage", "transcribe");
    } catch (err: any) {
      toast({ title: "Transcription failed", description: err.message, variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadAndTranscribe(blob, "recording.webm");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err: any) {
      toast({ title: "Microphone error", description: "Could not access microphone. Please allow permission and try again.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    await uploadAndTranscribe(file, file.name);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!transcript) return;
    setIsAnalyzing(true);
    setAnalysis("");
    try {
      const res = await fetch("/api/transcribe/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(err.error || "Analysis failed");
      }
      const data = await res.json();
      setAnalysis(data.analysis || "");
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    toast({ title: "Copied", description: "Transcript copied to clipboard." });
  };

  const exportAsText = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spartan-transcription.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO />
      <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Transcribe" }]} />
      <h1 className="text-h1 font-black text-foreground mb-4" data-testid="text-transcribe-title">
        Call Transcriber
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed">
        Record or upload a sales call, practice session, or coaching conversation. Get a full transcript and optional AI coaching analysis based on the Spartan Method.
      </p>

      <Card className="mb-8 spacing-card">
        <Tabs defaultValue="record">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="record" className="flex-1 gap-2" data-testid="tab-record">
              <Mic className="w-4 h-4" />
              Record Audio
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1 gap-2" data-testid="tab-upload">
              <Upload className="w-4 h-4" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="mt-0">
            <div className="text-center py-6">
              <div className="mb-6">
                {isRecording ? (
                  <div className="w-24 h-24 mx-auto rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                      <MicOff className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic className="w-12 h-12 text-primary" />
                  </div>
                )}
              </div>

              {isRecording ? (
                <div>
                  <p className="text-lg font-semibold text-destructive mb-1" data-testid="text-recording-status">
                    Recording in progress
                  </p>
                  <p className="text-3xl font-black text-foreground mb-5 tabular-nums" data-testid="text-recording-timer">
                    {formatTime(recordingSeconds)}
                  </p>
                  <Button onClick={stopRecording} variant="destructive" size="lg" className="font-bold" data-testid="button-stop-recording">
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop and Transcribe
                  </Button>
                </div>
              ) : isTranscribing ? (
                <div>
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">Transcribing with AI...</p>
                </div>
              ) : (
                <div>
                  <p className="text-base text-muted-foreground mb-5">Click to start recording from your microphone</p>
                  <Button onClick={startRecording} size="lg" className="font-bold" data-testid="button-start-recording">
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <div className="text-center py-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Upload className="w-12 h-12 text-primary" />
              </div>

              {isTranscribing ? (
                <div>
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">Transcribing {uploadFileName} with AI...</p>
                </div>
              ) : (
                <div>
                  <p className="text-base text-muted-foreground mb-2">
                    Upload an audio file to transcribe
                  </p>
                  <p className="text-xs text-muted-foreground mb-5">Supports MP3, WAV, M4A, WebM, OGG (max 25 MB)</p>
                  <label
                    htmlFor="audio-upload"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover-elevate font-bold px-6 py-3 rounded-md cursor-pointer text-sm"
                    data-testid="label-upload-audio"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Audio File
                  </label>
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                    onChange={handleFileUpload}
                    className="sr-only"
                    data-testid="input-audio-file"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {transcript && (
        <Card className="spacing-card mb-6" data-testid="card-transcript">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-h2 font-bold text-foreground">Transcript</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={copyToClipboard} variant="outline" size="default" className="font-bold" data-testid="button-copy">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button onClick={exportAsText} variant="outline" size="default" className="font-bold" data-testid="button-export-transcription">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <div className="bg-accent/30 rounded-lg p-4 max-h-64 overflow-y-auto">
            <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap" data-testid="text-transcription">
              {transcript}
            </p>
          </div>

          {!analysis && (
            <div className="mt-4">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="font-bold"
                data-testid="button-analyze"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze with AI Coaching"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Get specific coaching feedback based on the Spartan Method (Discipline, Empathy, Strategy)
              </p>
            </div>
          )}
        </Card>
      )}

      {isAnalyzing && (
        <Card className="spacing-card mb-6 flex items-center justify-center min-h-32" data-testid="card-analysis-loading">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Analyzing your conversation...</p>
          </div>
        </Card>
      )}

      {analysis && !isAnalyzing && (
        <Card className="spacing-card" data-testid="card-analysis">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-h2 font-bold text-foreground">Coaching Analysis</h2>
          </div>
          <MarkdownContent content={analysis} />
        </Card>
      )}

      {!transcript && !isTranscribing && (
        <Card className="bg-accent/30 spacing-card" data-testid="card-instructions">
          <h3 className="text-h3 font-bold text-foreground mb-4">How it works</h3>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-bold text-primary shrink-0">1.</span>
              <span>Record directly from your microphone or upload an existing audio file</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary shrink-0">2.</span>
              <span>Your audio is transcribed using OpenAI's speech recognition model</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary shrink-0">3.</span>
              <span>Review the full transcript, then optionally request AI coaching analysis</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary shrink-0">4.</span>
              <span>Get specific, Spartan Method feedback on what to improve before your next conversation</span>
            </li>
          </ol>
        </Card>
      )}
    </div>
  );
}
