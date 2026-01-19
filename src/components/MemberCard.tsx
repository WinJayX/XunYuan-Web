'use client';

import { Member } from '@/types/family';
import { getZodiac, getBirthOrderName } from '@/lib/zodiac';
import { formatYears, truncateBio } from '@/lib/utils';

interface MemberCardProps {
  member: Member;
  onClick: () => void;
  isInCouple?: boolean;
  onOpenAlbum?: () => void;
  onOpenStories?: () => void;
  isDimmed?: boolean;
  onTraceAncestors?: () => void;
}

export default function MemberCard({ member, onClick, isInCouple, onOpenAlbum, onOpenStories, isDimmed, onTraceAncestors }: MemberCardProps) {
  const zodiac = getZodiac(member.birthYear);
  const isMale = member.gender !== 'female';
  const yearsDisplay = formatYears(member.birthYear, member.deathYear);
  const birthOrderDisplay = getBirthOrderName(member.birthOrder, isMale);
  const bioDisplay = truncateBio(member.bio);

  // 计算照片样式（应用裁剪参数）
  // photoCrop: { x, y } 是图片中心点在原图中的百分比位置, scale 是缩放比例
  const getPhotoStyle = (): React.CSSProperties => {
    if (!member.photoCrop) {
      return { width: '100%', height: '100%', objectFit: 'cover' };
    }
    const { x, y } = member.photoCrop;
    // 使用 object-position 来定位图片显示区域
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: `${x}% ${y}%`
    };
  };

  return (
    <div
      className={`member-card ${isInCouple ? 'in-couple' : ''} ${isDimmed ? 'dimmed' : ''}`}
      data-member-id={member.id}
      onClick={onClick}
    >
      {/* 只有当有照片时才显示图片区域 */}
      {member.photo && (
        <div className="member-photo">
          <img src={member.photo} alt={member.name} style={getPhotoStyle()} />
        </div>
      )}

      {/* 徽章现在通过绝对定位在卡片上，不依赖图片区域 */}
      {member.birthYear && (
        <div className="zodiac-badge" title={`${zodiac.animal}年`}>
          {zodiac.emoji}
        </div>
      )}
      <div className={`gender-badge ${isMale ? 'male' : 'female'}`}>
        {isMale ? '♂' : '♀'}
      </div>

      <div className="member-info">
        <div className="member-name">{member.name}</div>
        <div className="member-order">{birthOrderDisplay}</div>
        <div className="member-years">{yearsDisplay}</div>
        {member.hometown && (
          <div className="member-hometown">{member.hometown}</div>
        )}
        {bioDisplay && (
          <div className="member-bio" title={member.bio}>
            {bioDisplay}
          </div>
        )}
        <div className="member-actions">
          <button
            className="action-btn"
            title="相册"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAlbum?.();
            }}
          >
            📷
            {member.albums && member.albums.length > 0 && (
              <span className="action-count">{member.albums.length}</span>
            )}
          </button>
          <button
            className="action-btn"
            title="故事"
            onClick={(e) => {
              e.stopPropagation();
              onOpenStories?.();
            }}
          >
            📖
            {member.stories && member.stories.length > 0 && (
              <span className="action-count">{member.stories.length}</span>
            )}
          </button>
          <button
            className="action-btn trace-btn"
            title="追溯直系血脉"
            onClick={(e) => {
              e.stopPropagation();
              onTraceAncestors?.();
            }}
          >
            🔺
          </button>
        </div>
      </div>
    </div>
  );
}
