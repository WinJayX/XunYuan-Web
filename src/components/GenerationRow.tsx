'use client';

import { useRef, useEffect } from 'react';
import { Generation, Member } from '@/types/family';
import { sortMembersByCouple, getSpouseIds } from '@/lib/utils';
import MemberCard from './MemberCard';
import CoupleContainer from './CoupleContainer';

interface GenerationRowProps {
  generation: Generation;
  parentGenMembers?: Member[]; // Members of the parent generation for sorting
  onMemberClick: (member: Member, genId: number) => void;
  onAddMember: (genId: number) => void;
  onScroll?: () => void;
  onOpenAlbum?: (member: Member, genId: number) => void;
  onOpenStories?: (member: Member, genId: number) => void;
  highlightedIds?: Set<number | string>;
  onTraceAncestors?: (member: Member) => void;
}

export default function GenerationRow({
  generation,
  parentGenMembers,
  onMemberClick,
  onAddMember,
  onScroll,
  onOpenAlbum,
  onOpenStories,
  highlightedIds,
  onTraceAncestors
}: GenerationRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || !onScroll) return;

    const handleScroll = () => {
      requestAnimationFrame(onScroll);
    };

    row.addEventListener('scroll', handleScroll);
    return () => row.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  const sortedMembers = sortMembersByCouple(generation.members, parentGenMembers);
  const renderedIds = new Set<number>();

  return (
    <div
      ref={rowRef}
      className="generation-row"
      data-gen-id={generation.id}
    >
      {sortedMembers.map(member => {
        if (renderedIds.has(member.id)) return null;

        const spouseIds = getSpouseIds(member);
        const spouses = spouseIds
          .map(id => generation.members.find(m => m.id === id))
          .filter((s): s is Member => s !== undefined && !renderedIds.has(s.id));

        if (spouses.length > 0) {
          // 标记已渲染
          renderedIds.add(member.id);
          spouses.forEach(s => renderedIds.add(s.id));

          return (
            <CoupleContainer
              key={member.id}
              mainMember={member}
              spouses={spouses}
              onMemberClick={(m) => onMemberClick(m, generation.id)}
              onOpenAlbum={onOpenAlbum ? (m) => onOpenAlbum(m, generation.id) : undefined}
              onOpenStories={onOpenStories ? (m) => onOpenStories(m, generation.id) : undefined}
              highlightedIds={highlightedIds}
              onTraceAncestors={onTraceAncestors}
            />
          );
        }

        if (!renderedIds.has(member.id)) {
          renderedIds.add(member.id);
          const isDimmed = highlightedIds && highlightedIds.size > 0 && !highlightedIds.has(member.id);
          return (
            <MemberCard
              key={member.id}
              member={member}
              onClick={() => onMemberClick(member, generation.id)}
              onOpenAlbum={onOpenAlbum ? () => onOpenAlbum(member, generation.id) : undefined}
              onOpenStories={onOpenStories ? () => onOpenStories(member, generation.id) : undefined}
              isDimmed={isDimmed}
              onTraceAncestors={onTraceAncestors ? () => onTraceAncestors(member) : undefined}
            />
          );
        }

        return null;
      })}

      <div className="add-member-btn" onClick={() => onAddMember(generation.id)}>
        <div className="icon">+</div>
        <span>添加家族成员</span>
      </div>
    </div>
  );
}
