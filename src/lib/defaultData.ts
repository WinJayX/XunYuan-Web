import { FamilyData } from '@/types/family';

export const defaultData: FamilyData = {
  settings: {
    familyName: '王氏家族',
    subtitle: '源远流长 · 薪火相传',
    hometown: '山东滨州',
    theme: 'classic',
    bgImages: [],  // 默认不使用外部背景图片，避免网络问题
    showConnections: true,
    zoomLevel: 1
  },
  generations: [
    {
      id: 1,
      name: '曾祖辈',
      members: [
        {
          id: 101,
          name: '王德厚',
          gender: 'male',
          birthYear: 1900,
          deathYear: 1975,
          hometown: '山东滨州',
          photo: '',
          bio: '家族奠基人',
          parentId: null,
          spouseIds: [102]
        },
        {
          id: 102,
          name: '李淑芬',
          gender: 'female',
          birthYear: 1905,
          deathYear: 1980,
          hometown: '山东滨州',
          photo: '',
          bio: '',
          parentId: null,
          spouseIds: [101]
        }
      ]
    },
    {
      id: 2,
      name: '祖辈',
      members: [
        {
          id: 201,
          name: '王建国',
          gender: 'male',
          birthYear: 1935,
          deathYear: 2010,
          hometown: '山东滨州',
          photo: '',
          bio: '',
          parentId: 101,
          spouseIds: [203]
        },
        {
          id: 203,
          name: '张秀英',
          gender: 'female',
          birthYear: 1938,
          deathYear: null,
          hometown: '山东滨州',
          photo: '',
          bio: '',
          parentId: null,
          spouseIds: [201]
        },
        {
          id: 202,
          name: '王建民',
          gender: 'male',
          birthYear: 1938,
          deathYear: null,
          hometown: '山东滨州',
          photo: '',
          bio: '',
          parentId: 101,
          spouseIds: []
        }
      ]
    },
    {
      id: 3,
      name: '父辈',
      members: [
        {
          id: 301,
          name: '王志强',
          gender: 'male',
          birthYear: 1960,
          deathYear: null,
          hometown: '山东滨州',
          photo: '',
          bio: '',
          parentId: 201,
          spouseIds: []
        }
      ]
    },
    {
      id: 4,
      name: '我辈',
      members: []
    }
  ]
};
