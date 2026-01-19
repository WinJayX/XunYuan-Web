'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Member, Story } from '@/types/family';
import { uploadApi } from '@/lib/api';

interface MemberDetailModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onUpdate: (member: Member) => void;
  initialTab?: 'album' | 'stories';
}

export default function MemberDetailModal({ isOpen, member, onClose, onUpdate, initialTab = 'album' }: MemberDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'album' | 'stories'>(initialTab);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isAddingStory, setIsAddingStory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const albumInputRef = useRef<HTMLInputElement>(null);

  // 当 initialTab 变化时更新 activeTab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen || !member) return null;

  const albums = member.albums || [];
  const stories = [...(member.stories || [])].sort((a, b) => {
    if (a.year && b.year) return a.year - b.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return 0;
  });

  // 上传相册照片到阿里云OSS
  // 限制: 支持 JPG、PNG、GIF、WebP 格式，单张图片最大 5MB
  const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of Array.from(files)) {
      // Client-side validation
      if (!allowedTypes.includes(file.type)) {
        alert(`文件 "${file.name}" 格式不支持。\n\n支持的格式: JPG、PNG、GIF、WebP`);
        continue;
      }

      if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        alert(`文件 "${file.name}" 太大 (${sizeMB}MB)。\n\n单张图片最大支持 5MB`);
        continue;
      }

      try {
        // Use the correct upload API that uploads to Alibaba Cloud OSS
        const result = await uploadApi.uploadImage(file, `album/${member.id}`);
        if (result.url) {
          newPhotos.push(result.url);
        }
      } catch (err: any) {
        console.error('Upload failed:', err);
        // Show the actual error message from server
        alert(err.message || '上传失败，请稍后重试');
      }
    }

    if (newPhotos.length > 0) {
      onUpdate({
        ...member,
        albums: [...albums, ...newPhotos]
      });
    }

    setIsUploading(false);
    if (albumInputRef.current) albumInputRef.current.value = '';
  };

  // 删除相册照片
  const handleDeletePhoto = (photoPath: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    onUpdate({
      ...member,
      albums: albums.filter(p => p !== photoPath)
    });
  };

  // 添加故事
  const handleAddStory = (story: Omit<Story, 'id'>) => {
    const newStory: Story = {
      ...story,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    onUpdate({
      ...member,
      stories: [...(member.stories || []), newStory]
    });
    setIsAddingStory(false);
  };

  // 更新故事
  const handleUpdateStory = (story: Story) => {
    onUpdate({
      ...member,
      stories: (member.stories || []).map(s => s.id === story.id ? story : s)
    });
    setEditingStory(null);
  };

  // 删除故事
  const handleDeleteStory = (storyId: number) => {
    if (!confirm('确定要删除这个故事吗？')) return;
    onUpdate({
      ...member,
      stories: (member.stories || []).filter(s => s.id !== storyId)
    });
  };

  return (
    <div className="modal show member-detail-modal">
      <div className="modal-content large">
        <span className="modal-close" onClick={onClose}>&times;</span>
        <h2>{member.name} 的故事</h2>

        <div className="detail-tabs">
          <button
            className={`tab-btn ${activeTab === 'album' ? 'active' : ''}`}
            onClick={() => setActiveTab('album')}
          >
            📷 相册 ({albums.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            📖 故事 ({stories.length})
          </button>
        </div>

        <div className="detail-content">
          {activeTab === 'album' && (
            <div className="album-section">
              <div className="album-grid">
                {albums.map((photo, index) => (
                  <div key={index} className="album-item">
                    <img src={photo} alt={`照片 ${index + 1}`} />
                    <button className="delete-btn" onClick={() => handleDeletePhoto(photo)}>×</button>
                  </div>
                ))}
                <div
                  className="album-add"
                  onClick={() => albumInputRef.current?.click()}
                >
                  {isUploading ? '上传中...' : '+ 添加照片'}
                </div>
              </div>
              <input
                ref={albumInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleAlbumUpload}
              />
            </div>
          )}

          {activeTab === 'stories' && (
            <div className="stories-section">
              {stories.map(story => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isEditing={editingStory?.id === story.id}
                  onEdit={() => setEditingStory(story)}
                  onSave={(s) => handleUpdateStory(s as Story)}
                  onCancel={() => setEditingStory(null)}
                  onDelete={() => handleDeleteStory(story.id)}
                />
              ))}

              {isAddingStory ? (
                <StoryEditor
                  onSave={handleAddStory}
                  onCancel={() => setIsAddingStory(false)}
                />
              ) : (
                <button className="add-story-btn" onClick={() => setIsAddingStory(true)}>
                  + 添加新故事
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// 故事卡片组件
function StoryCard({
  story,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete
}: {
  story: Story;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (story: Story | Omit<Story, 'id'>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  if (isEditing) {
    return <StoryEditor story={story} onSave={onSave} onCancel={onCancel} />;
  }

  return (
    <div className="story-card">
      <div className="story-header">
        <h3>{story.title}</h3>
        {story.year && <span className="story-year">{story.year}年</span>}
      </div>
      <div className="story-content">{story.content}</div>
      {story.photos && story.photos.length > 0 && (
        <div className="story-photos">
          {story.photos.map((photo, i) => (
            <img key={i} src={photo} alt="" />
          ))}
        </div>
      )}
      <div className="story-actions">
        <button onClick={onEdit}>编辑</button>
        <button onClick={onDelete} className="delete">删除</button>
      </div>
    </div>
  );
}

// 故事编辑器组件
function StoryEditor({
  story,
  onSave,
  onCancel
}: {
  story?: Story;
  onSave: (story: Story | Omit<Story, 'id'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(story?.title || '');
  const [year, setYear] = useState(story?.year?.toString() || '');
  const [content, setContent] = useState(story?.content || '');
  const [photos, setPhotos] = useState<string[]>(story?.photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsUploading(true);
    const files = Array.from(e.target.files);
    const newPhotos: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Client-side Validation (Type)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: 只支持 JPG, PNG, GIF, WebP 格式`);
        continue;
      }

      // Client-side Validation (Size)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        errors.push(`${file.name}: 大小超过 5MB`);
        continue;
      }

      try {
        const result = await uploadApi.uploadImage(file, 'story-photos');
        newPhotos.push(result.url);
      } catch (error: any) {
        console.error('Failed to upload story photo:', error);
        errors.push(`${file.name}: 上传失败 - ${error.message || '未知错误'}`);
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos]);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = (photoUrl: string) => {
    setPhotos(prev => prev.filter(p => p !== photoUrl));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('请输入故事标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入故事内容');
      return;
    }

    const storyData = {
      ...(story ? { id: story.id } : {}),
      title: title.trim(),
      year: year ? parseInt(year) : null,
      content: content.trim(),
      photos: photos
    };

    onSave(storyData as Story);
  };

  return (
    <div className="story-editor">
      <div className="editor-row">
        <input
          type="text"
          placeholder="故事标题"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="story-title-input"
        />
        <input
          type="number"
          placeholder="年份（可选）"
          value={year}
          onChange={e => setYear(e.target.value)}
          className="story-year-input"
        />
      </div>
      <textarea
        placeholder="写下这个故事..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={6}
        className="story-content-input"
      />

      <div className="story-editor-photos">
        {photos.map((photo, index) => (
          <div key={index} className="story-photo-item">
            <img src={photo} alt={`故事配图 ${index + 1}`} />
            <button className="delete-photo-btn" onClick={() => handleDeletePhoto(photo)}>×</button>
          </div>
        ))}
        <div className="add-story-photo" onClick={() => !isUploading && fileInputRef.current?.click()}>
          {isUploading ? '上传中...' : '+ 📷'}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handlePhotoUpload}
        />
      </div>

      <div className="editor-actions">
        <button onClick={onCancel}>取消</button>
        <button onClick={handleSubmit} className="save">保存</button>
      </div>
    </div>
  );
}
