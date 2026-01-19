'use client';

import { Member } from '@/types/family';
import MemberCard from './MemberCard';

interface CoupleContainerProps {
  mainMember: Member;
  spouses: Member[];
  onMemberClick: (member: Member) => void;
  onOpenAlbum?: (member: Member) => void;
  onOpenStories?: (member: Member) => void;
  highlightedIds?: Set<number | string>;
  onTraceAncestors?: (member: Member) => void;
}

function CoupleConnector({ label }: { label: string }) {
  return (
    <div className="couple-connector" data-label={label} />
  );
}

export default function CoupleContainer({ mainMember, spouses, onMemberClick, onOpenAlbum, onOpenStories, highlightedIds, onTraceAncestors }: CoupleContainerProps) {
  const isMultiSpouse = spouses.length > 1;
  const isSingleSpouse = spouses.length === 1;

  // 生成夫妻容器的唯一ID，用于连线
  const coupleId = `couple-${mainMember.id}`;

  return (
    <div
      className={`couple-container ${isMultiSpouse ? 'multi-spouse' : ''} ${isSingleSpouse ? 'single-spouse' : ''}`}
      data-couple-id={coupleId}
      data-main-member-id={mainMember.id}
    >
      <MemberCard
        member={mainMember}
        onClick={() => onMemberClick(mainMember)}
        isInCouple
        onOpenAlbum={onOpenAlbum ? () => onOpenAlbum(mainMember) : undefined}
        onOpenStories={onOpenStories ? () => onOpenStories(mainMember) : undefined}
        isDimmed={highlightedIds && highlightedIds.size > 0 && !highlightedIds.has(mainMember.id)}
        onTraceAncestors={onTraceAncestors ? () => onTraceAncestors(mainMember) : undefined}
      />
      {spouses.map((spouse, index) => (
        <div key={spouse.id} className="spouse-group">
          <CoupleConnector
            label={isMultiSpouse ? (index === 0 ? '元配' : (index === 1 ? '继室' : '侧室')) : ''}
          />
          <MemberCard
            member={spouse}
            onClick={() => onMemberClick(spouse)}
            isInCouple
            onOpenAlbum={onOpenAlbum ? () => onOpenAlbum(spouse) : undefined}
            onOpenStories={onOpenStories ? () => onOpenStories(spouse) : undefined}
            isDimmed={highlightedIds && highlightedIds.size > 0 && !highlightedIds.has(spouse.id)}
            onTraceAncestors={onTraceAncestors ? () => onTraceAncestors(spouse) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
