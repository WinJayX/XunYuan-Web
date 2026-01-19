# 寻源家谱 - 前端项目

一个现代化的家族谱系管理系统，支持多用户、多族谱管理，致力于帮助用户记录和传承家族历史。

## 项目概述

寻源家谱是一个基于 Next.js 构建的家族谱系可视化和管理平台。系统支持多租户架构，每个用户可以创建和管理自己的族谱，记录家族成员信息、照片和故事。

## 技术栈

- **框架**: Next.js 16.1.1 (Turbopack)
- **语言**: TypeScript
- **样式**: CSS (纯 CSS，无 Tailwind)
- **状态管理**: React Context
- **部署**: Docker + Nginx

## 主要功能

### 用户系统
- 用户注册/登录
- JWT 认证
- 个人资料管理

### 族谱管理
- 创建多个族谱
- 族谱列表展示
- 族谱删除

### 成员管理
- 添加/编辑/删除成员
- 支持多代际管理
- 配偶关系设置
- 父母关系设置

### 可视化展示
- 家族树可视化
- 血脉连线展示
- 缩放功能 (25%-100%+)
- 横向滚动支持
- 主题切换

### 成员详情
- 成员照片（支持裁剪）
- 成员故事记录
- 相册功能
- 生肖/性别标识

### 其他功能
- 背景图片自定义
- 数据导入/导出
- 响应式设计

## 项目结构

```
familytree/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 主页面
│   │   ├── layout.tsx         # 布局
│   │   ├── globals.css        # 全局样式
│   │   └── api/               # API 路由
│   ├── components/            # React 组件
│   │   ├── FamilyTree.tsx     # 家族树主组件
│   │   ├── AuthPage.tsx       # 登录/注册页面
│   │   ├── FamilyList.tsx     # 族谱列表
│   │   ├── MemberCard.tsx     # 成员卡片
│   │   ├── EditModal.tsx      # 编辑弹窗
│   │   ├── SettingsPanel.tsx  # 设置面板
│   │   ├── ConnectionLines.tsx # 血脉连线
│   │   └── ...
│   ├── contexts/              # React Context
│   │   └── AuthContext.tsx    # 认证上下文
│   ├── context/               # 数据上下文
│   │   └── FamilyContext.tsx  # 家族数据上下文
│   ├── lib/                   # 工具库
│   │   ├── api.ts             # API 客户端
│   │   ├── utils.ts           # 工具函数
│   │   └── defaultData.ts     # 默认数据
│   └── types/                 # TypeScript 类型定义
│       └── family.ts
├── public/                    # 静态资源
├── Dockerfile                 # Docker 构建配置
├── package.json
└── tsconfig.json
```

## 安装和运行

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker 部署

```bash
# 构建镜像
docker build -t familytree-frontend .

# 运行容器
docker run -p 3000:80 familytree-frontend
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `http://localhost:3001/api` |

## 缩放规则

系统根据缩放级别显示不同的成员信息：

| 缩放级别 | 显示内容 |
|----------|----------|
| 25% | 姓名、性别、生肖 |
| 50% | 姓名、排行、性别、生肖 |
| 75% | 姓名、排行、籍贯、性别、生肖、操作按钮 |
| 100%+ | 全部信息 |

## 主题

系统支持多种主题：
- `classic` - 经典主题（默认）
- `modern` - 现代主题
- `warm` - 温暖主题
- `elegant` - 优雅主题

## API 集成

前端通过 `src/lib/api.ts` 与后端通信，支持：
- 用户认证 (注册/登录)
- 族谱 CRUD
- 成员 CRUD
- 图片上传 (阿里云 OSS)

## 更新日志

### 2026-01-06
- ✅ 添加多租户支持
- ✅ 实现用户认证系统
- ✅ 创建登录/注册页面
- ✅ 创建族谱列表页面
- ✅ 集成后端 API
- ✅ 修复缩放功能类型问题
- ✅ 更新默认籍贯为"山东滨州"

### 历史更新
- 动态血脉连线（跟随滚动）
- 成员卡片缩放
- 背景图片自定义上传
- 弹窗交互优化
- 多配偶支持

## 许可证

私有项目，保留所有权利。
