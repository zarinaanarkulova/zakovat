export type MediaType = 'text' | 'image' | 'video';

export interface Question {
  id: string;
  title: string; // Renamed from countryName
  text: string;
  mediaType: MediaType;
  mediaUrl?: string;
  answer: string;
  order: number;
}

export interface TeamScore {
  name: string;
  score: number;
}

export interface GameConfig {
  teams: TeamScore[];
  timerDuration: number; // in seconds
}
