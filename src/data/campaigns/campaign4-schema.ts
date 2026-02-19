export interface CampaignMeta {
  number: number;
  name: string;
  world: string;
  dm: string;
  system: string;
}

export interface EpisodeMeta {
  number: number;
  title: string;
  air_date: string | null;
  duration_seconds: number | null;
  youtube_url: string;
  total_segments: number;
  total_chapters: number;
}

export interface CastMember {
  player: string;
  character: string;
  race: string | null;
  class: string | null;
}

export interface SegmentMetadata {
  combat_round?: number | null;
  rolls?: string[] | null;
  spells_used?: string[] | null;
  items_referenced?: string[] | null;
  npcs_mentioned?: string[] | null;
  lore_keywords?: string[] | null;
}

export type SegmentType =
  | "chapter_start"
  | "narration"
  | "dialogue"
  | "combat"
  | "description"
  | "ooc";

export interface CampaignSegment {
  segment_id: string;
  type: SegmentType;
  speaker: string;
  content: string;
  summary: string | null;
  location: string | null;
  characters_present: string[];
  timestamp_start: number | null;
  timestamp_end: number | null;
  metadata: SegmentMetadata;
}

export interface CampaignEpisode {
  campaign: CampaignMeta;
  episode: EpisodeMeta;
  cast: CastMember[];
  segments: CampaignSegment[];
}

export interface CampaignData {
  campaign: CampaignMeta;
  cast: CastMember[];
  episodes: CampaignEpisode[];
}
