import React, { createContext, useContext, useState } from "react";

type CoachSessionState = {
  isVoiceActive: boolean;
  audioLevel: number;
  setVoiceActive: (active: boolean) => void;
  setAudioLevel: (level: number) => void;
};

const CoachSessionContext = createContext<CoachSessionState>({
  isVoiceActive: false,
  audioLevel: 0,
  setVoiceActive: () => {},
  setAudioLevel: () => {},
});

export function CoachSessionProvider({ children }: { children: React.ReactNode }) {
  const [isVoiceActive, setVoiceActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  return (
    <CoachSessionContext.Provider value={{ isVoiceActive, audioLevel, setVoiceActive, setAudioLevel }}>
      {children}
    </CoachSessionContext.Provider>
  );
}

export function useCoachSession() {
  return useContext(CoachSessionContext);
}
