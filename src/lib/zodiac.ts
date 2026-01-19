import { Zodiac } from '@/types/family';

const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const zodiacEmojis = ['🐀', '🐂', '🐅', '🐇', '🐉', '🐍', '🐴', '🐑', '🐵', '🐔', '🐕', '🐷'];

export function getZodiac(year?: number | null): Zodiac {
  if (!year) return { animal: '', emoji: '👤' };
  const index = (year - 4) % 12;
  return {
    animal: zodiacAnimals[index],
    emoji: zodiacEmojis[index]
  };
}

export function getBirthOrderName(order: number | null | undefined, isMale: boolean): string {
  if (!order) return '';
  const orderNames = ['', '长', '次', '三', '四', '五', '六', '七', '八', '九', '十'];
  const orderName = orderNames[order] || `第${order}`;
  return orderName + (isMale ? '子' : '女');
}
