import type { Video } from '@/types';

export interface GroupedSources {
  groupId: number;
  sources: Video[];
  visible: Video;
}

/**
 * Groups a flat array of video source rows into one entry per stream group.
 */
export function groupSources(
  rows: Video[],
  selectedByGroup: Map<number, number>
): GroupedSources[] {
  // Build an insertion-ordered map of groupId -> sources[]
  const groups = new Map<number, Video[]>();

  for (const row of rows) {
    const groupId = row.groupId as number;
    if (!groups.has(groupId)) {
      groups.set(groupId, []);
    }
    groups.get(groupId)!.push(row);
  }

  // Convert to output array, resolving visible for each group
  const result: GroupedSources[] = [];
  for (const [groupId, sources] of groups) {
    const selectedVideoId = selectedByGroup.get(groupId);

    // Sort the group's default source first (so it is "Source 1")
    const defaultVideoId = sources[0].defaultVideoId;
    sources.sort((a, b) => {
      if (defaultVideoId != null) {
        if (a.videoId === defaultVideoId) return -1;
        if (b.videoId === defaultVideoId) return 1;
      }
      return (a.videoId ?? 0) - (b.videoId ?? 0);
    });

    let visible: Video | null = null;

    // (1) User selection override
    if (selectedVideoId !== undefined) {
      visible = sources.find((s) => s.videoId === selectedVideoId) || null;
    }

    // (2) Default video
    if (visible === null) {
      if (defaultVideoId !== null && defaultVideoId !== undefined) {
        visible = sources.find((s) => s.videoId === defaultVideoId) || null;
      }
    }

    // (3) Defensive fallback to first source
    if (visible === null) {
      visible = sources[0];
    }

    result.push({ groupId, sources, visible });
  }

  return result;
}

export default { groupSources };
