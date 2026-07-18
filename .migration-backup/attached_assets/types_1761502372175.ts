
export interface Palette {
  bg: string;
  surface: string;
  text: string;
  sub: string;
  brand: string;
  accent: string;
  danger: string;
  ring: string;
}

export type Theme = 'dark' | 'light';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}
