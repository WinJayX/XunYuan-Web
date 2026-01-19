import { Member } from '@/types/family';

// 获取配偶ID数组（兼容旧的单配偶数据）
export function getSpouseIds(member: Member): (number | string)[] {
  if (member.spouseIds && Array.isArray(member.spouseIds)) {
    return member.spouseIds;
  }
  if (member.spouseId) {
    return [member.spouseId];
  }
  return [];
}

// Sort members by hierarchy and birthYear, ensuring couples stay together
// parentGenMembers: Members of the parent generation for determining parent-based ordering
export function sortMembersByCouple(members: Member[], parentGenMembers?: Member[]): Member[] {
  // Build parent order mapping (parentId -> sort value)
  const parentOrderMap = new Map<number | string, number>();
  if (parentGenMembers) {
    // Sort parent generation by birthOrder first, then birthYear
    const sortedParents = [...parentGenMembers].sort((a, b) => {
      // Primary: birthOrder
      const orderDiff = (a.birthOrder || 999) - (b.birthOrder || 999);
      if (orderDiff !== 0) return orderDiff;

      // Secondary: birthYear (earlier year first)
      const yearA = a.birthYear || 9999;
      const yearB = b.birthYear || 9999;
      return yearA - yearB;
    });
    sortedParents.forEach((parent, index) => {
      parentOrderMap.set(parent.id, index);
    });
  }

  // Sort members by: 1) parent's order, 2) birthOrder, 3) birthYear
  const sortedByOrder = [...members].sort((a, b) => {
    // First by parent's order (if parent info available)
    const parentOrderA = a.parentId ? (parentOrderMap.get(a.parentId) ?? 999) : 999;
    const parentOrderB = b.parentId ? (parentOrderMap.get(b.parentId) ?? 999) : 999;
    if (parentOrderA !== parentOrderB) return parentOrderA - parentOrderB;

    // Primary sort: birthOrder (排行)
    const orderA = a.birthOrder || 999;
    const orderB = b.birthOrder || 999;
    if (orderA !== orderB) return orderA - orderB;

    // Secondary sort: birthYear (出生年份，早的在前)
    const yearA = a.birthYear || 9999;
    const yearB = b.birthYear || 9999;
    return yearA - yearB;
  });

  // Handle couple pairing
  const sorted: Member[] = [];
  const added = new Set<number | string>();

  sortedByOrder.forEach(member => {
    if (added.has(member.id)) return;

    sorted.push(member);
    added.add(member.id);

    // Add all spouses right after main member
    const spouseIds = getSpouseIds(member);
    spouseIds.forEach(spouseId => {
      const spouse = members.find(m => m.id === spouseId);
      if (spouse && !added.has(spouse.id)) {
        sorted.push(spouse);
        added.add(spouse.id);
      }
    });
  });

  return sorted;
}

// 构建年份显示
export function formatYears(birthYear?: number | null, deathYear?: number | null): string {
  if (birthYear && deathYear) {
    return `${birthYear} - ${deathYear}`;
  } else if (birthYear) {
    return `生于 ${birthYear}`;
  } else if (deathYear) {
    return `卒于 ${deathYear}`;
  }
  return '';
}

// 截断简介
export function truncateBio(bio?: string, maxLength = 20): string {
  if (!bio) return '';
  return bio.length > maxLength ? bio.substring(0, maxLength) + '...' : bio;
}
