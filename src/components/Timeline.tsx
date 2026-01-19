'use client';

import { Generation } from '@/types/family';

interface TimelineProps {
  generations: Generation[];
  onEditName: (genId: number) => void;
  onDeleteGeneration?: (genId: number) => void;
}

export default function Timeline({ generations, onEditName, onDeleteGeneration }: TimelineProps) {
  return (
    <div className="timeline">
      <div className="timeline-line" />
      <div id="timelineMarkers">
        {generations.map((gen) => (
          <div key={gen.id} className="timeline-marker" data-gen-id={gen.id}>
            <div className="timeline-dot" />
            <div
              className="timeline-label"
              onClick={() => onEditName(gen.id)}
              title="点击修改名称"
            >
              {gen.name}
            </div>
            {onDeleteGeneration && (
              <button
                className="timeline-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteGeneration(gen.id);
                }}
                title="删除此代"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
