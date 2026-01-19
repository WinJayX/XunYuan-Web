// 照片裁剪参数
export interface PhotoCrop {
  x: number;      // 偏移 X (百分比)
  y: number;      // 偏移 Y (百分比)
  scale: number;  // 缩放比例
}

// 故事类型
export interface Story {
  id: number;
  title: string;
  year?: number | null;
  content: string;
  photos?: string[];  // 故事相关照片
  createdAt?: string;
}

// 家族成员类型
export interface Member {
  id: number;
  apiId?: string;  // API ID for server sync
  name: string;
  gender: 'male' | 'female';
  birthOrder?: number | null;
  birthYear?: number | null;
  deathYear?: number | null;
  hometown?: string;
  bio?: string;
  photo?: string;
  photoCrop?: PhotoCrop;
  parentId?: number | string | null;
  motherId?: number | string | null;      // ID of the biological mother (for multiple spouses)
  spouseId?: number;
  spouseIds?: (number | string)[];
  // Albums and stories
  albums?: string[];     // Album photo URLs
  stories?: Story[];     // Story list
}

// 代际类型
export interface Generation {
  id: number;
  apiId?: string;  // API ID for server sync
  name: string;
  members: Member[];
}

// 设置类型
export interface Settings {
  familyName: string;
  subtitle?: string;
  familySubtitle?: string;  // Alias for subtitle
  hometown: string;
  theme: 'classic' | 'modern' | 'warm' | 'elegant' | string;
  bgImages?: string[];
  backgroundImages?: string[];  // Alias for bgImages
  showConnections: boolean;
  zoomLevel: number;  // 缩放比例 (0.5 = 50%, 1 = 100%, etc.)
}

// 家族数据类型
export interface FamilyData {
  settings: Settings;
  generations: Generation[];
  apiId?: string;  // API ID for server sync
}

// 生肖类型
export interface Zodiac {
  animal: string;
  emoji: string;
}
