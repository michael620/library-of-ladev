import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { Video } from '@/types';

export interface SourceToggleProps {
  sources: Video[];
  value: number;
  onChange: (videoId: number) => void;
}

export default function SourceToggle({ sources, value, onChange }: SourceToggleProps) {
  if (sources.length <= 1) return null;

  const handleChange = (event: React.MouseEvent<HTMLElement>, newVideoId: number | null) => {
    event.stopPropagation();
    if (newVideoId !== null) {
      onChange(newVideoId);
    }
  };

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      aria-label="video source"
    >
      {sources.map((source, i) => (
        <ToggleButton
          key={source.videoId ?? source.url}
          value={source.videoId as number}
          aria-label={`Source ${i + 1}`}
        >
          {`Source ${i + 1}`}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
