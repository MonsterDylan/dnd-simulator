import episode1 from "./campaign4-episode1.json";
import episode2 from "./campaign4-episode2.json";
import episode3 from "./campaign4-episode3.json";
import type { CampaignEpisode } from "./campaign4-schema";

const EPISODES: Record<number, CampaignEpisode> = {
  1: episode1 as CampaignEpisode,
  2: episode2 as CampaignEpisode,
  3: episode3 as CampaignEpisode,
};

export function getEpisode(num: number): CampaignEpisode {
  return EPISODES[num] ?? EPISODES[1];
}

export { episode1, episode2, episode3 };
