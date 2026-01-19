'use client';

import { useState, useEffect, useRef } from 'react';
import { Member, Generation, PhotoCrop } from '@/types/family';
import { getSpouseIds } from '@/lib/utils';
import { uploadApi } from '@/lib/api';
import ImageCropper from './ImageCropper';

interface EditModalProps {
  isOpen: boolean;
  member: Member | null;
  generation: Generation | null;
  generations: Generation[];
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'> | Member) => void;
  onDelete?: () => void;
  onViewDetail?: (member: Member) => void;
}

export default function EditModal({
  isOpen,
  member,
  generation,
  generations,
  onClose,
  onSave,
  onDelete,
  onViewDetail
}: EditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    birthOrder: '' as string | number,
    birthYear: '' as string | number,
    deathYear: '' as string | number,
    hometown: '山东滨州',
    bio: '',
    photo: '',
    photoCrop: undefined as PhotoCrop | undefined,
    parentId: '' as string | number,
    motherId: '' as string | number,
    spouseIds: [] as (number | string)[]
  });

  const [initialData, setInitialData] = useState<string>('');

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        gender: member.gender || 'male',
        birthOrder: member.birthOrder || '',
        birthYear: member.birthYear || '',
        deathYear: member.deathYear || '',
        hometown: member.hometown || '',
        bio: member.bio || '',
        photo: member.photo || '',
        photoCrop: member.photoCrop,
        parentId: member.parentId || '',
        motherId: member.motherId || '',
        spouseIds: getSpouseIds(member)
      });
      setInitialData(JSON.stringify({
        name: member.name,
        gender: member.gender || 'male',
        birthOrder: member.birthOrder || '',
        birthYear: member.birthYear || '',
        deathYear: member.deathYear || '',
        hometown: member.hometown || '',
        bio: member.bio || '',
        photo: member.photo || '',
        photoCrop: member.photoCrop,
        parentId: member.parentId || '',
        motherId: member.motherId || '',
        spouseIds: getSpouseIds(member)
      }));
      setPhotoPreview(member.photo || '');
    } else {
      setFormData({
        name: '',
        gender: 'male',
        birthOrder: '',
        birthYear: '',
        deathYear: '',
        hometown: '山东滨州',
        bio: '',
        photo: '',
        photoCrop: undefined,
        parentId: '',
        motherId: '',
        spouseIds: []
      });
      setInitialData(JSON.stringify({
        name: '',
        gender: 'male',
        birthOrder: '',
        birthYear: '',
        deathYear: '',
        hometown: '山东滨州',
        bio: '',
        photo: '',
        photoCrop: undefined,
        parentId: '',
        motherId: '',
        spouseIds: []
      }));
      setPhotoPreview('');
    }
    setPendingFile(null);
  }, [member, isOpen]);

  // 选择文件后显示裁剪器
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size (max 5MB recommended for base64 storage)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('图片文件过大，请选择小于 5MB 的图片');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setPendingFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          setPhotoPreview(ev.target?.result as string);
          setShowCropper(true);
        } catch (err) {
          console.error('Error setting photo preview:', err);
          alert('图片预览失败，请重试');
        }
      };
      reader.onerror = () => {
        console.error('FileReader error');
        alert('读取图片失败，请重试');
        setPendingFile(null);
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error in handleFileSelect:', err);
      alert('选择图片时出错，请重试');
    }
  };

  // 点击已有照片调整裁剪
  const handleAdjustCrop = () => {
    if (formData.photo) {
      setShowCropper(true);
    }
  };

  // 裁剪确认 - 上传图片到 OSS
  const handleCropConfirm = async (crop: PhotoCrop) => {
    setShowCropper(false);
    setFormData(prev => ({ ...prev, photoCrop: crop }));

    // 如果有新文件，上传到 OSS
    if (pendingFile) {
      setIsUploading(true);
      try {
        // 上传到阿里云 OSS
        const result = await uploadApi.uploadImage(pendingFile, 'md/xunyuan/member-photos');

        // 使用 OSS 返回的 URL
        setFormData(prev => ({ ...prev, photo: result.url }));
        setPhotoPreview(result.url);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('图片上传失败，请重试');
        // Reset photo state on error
        setPhotoPreview(member?.photo || '');
      } finally {
        setIsUploading(false);
        setPendingFile(null);
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (pendingFile) {
      // 取消新图片，恢复原来的
      setPhotoPreview(member?.photo || '');
      setPendingFile(null);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入姓名');
      return;
    }

    const memberData = {
      ...(member ? { id: member.id } : {}),
      name: formData.name.trim(),
      gender: formData.gender,
      birthOrder: formData.birthOrder ? Number(formData.birthOrder) : null,
      birthYear: formData.birthYear ? Number(formData.birthYear) : null,
      deathYear: formData.deathYear ? Number(formData.deathYear) : null,
      hometown: formData.hometown.trim(),
      bio: formData.bio.trim(),
      photo: formData.photo,
      photoCrop: formData.photoCrop,
      parentId: formData.parentId ? Number(formData.parentId) : null,
      motherId: formData.motherId ? Number(formData.motherId) : null,
      spouseIds: formData.spouseIds
    };

    onSave(memberData as Member);
  };

  const handleClose = () => {
    // Check for changes
    if (JSON.stringify(formData) !== initialData) {
      if (!window.confirm('确定要关闭吗？未保存的内容将丢失。')) {
        return;
      }
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showCropper) {
        if (e.isComposing) return;
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCropper]);

  if (!isOpen) return null;


  const currentGenIndex = generation
    ? generations.findIndex(g => g.id === generation.id)
    : -1;
  const parentGen = currentGenIndex > 0 ? generations[currentGenIndex - 1] : null;

  const parentOptions: { value: number; label: string }[] = [];
  if (parentGen) {
    const addedIds = new Set<number>();
    parentGen.members.forEach(m => {
      if (addedIds.has(m.id)) return;
      let displayName = m.name;
      const spIds = getSpouseIds(m);
      if (spIds.length > 0) {
        const spouseNames = spIds.map(id => {
          const spouse = parentGen.members.find(s => s.id === id);
          if (spouse) { addedIds.add(spouse.id); return spouse.name; }
          return null;
        }).filter(Boolean);
        if (spouseNames.length > 0) displayName = `${m.name} & ${spouseNames.join(' & ')}`;
      }
      parentOptions.push({ value: m.id, label: displayName });
      addedIds.add(m.id);
    });
  }

  const spouseOptions = generation?.members
    .filter(m => m.id !== member?.id)
    .map(m => ({ value: m.id, label: m.name })) || [];

  return (
    <>
      {showCropper && photoPreview && (
        <ImageCropper
          imageSrc={photoPreview}
          initialCrop={formData.photoCrop}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
      <div className="modal show">
        <div className="modal-content">
          <span className="modal-close" onClick={handleClose}>&times;</span>
          <h2>{member ? '编辑成员信息' : '添加新成员'}</h2>

          <div className="modal-body">
            <div className="photo-upload">
              <div
                className="photo-preview"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                style={{ cursor: isUploading ? 'wait' : 'pointer' }}
              >
                {isUploading ? (
                  <span>上传中...</span>
                ) : photoPreview ? (
                  <img src={photoPreview} alt="预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>点击上传照片</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {formData.photo && (
                <button
                  type="button"
                  className="btn-adjust-crop"
                  onClick={handleAdjustCrop}
                >
                  调整显示区域
                </button>
              )}
            </div>

            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入姓名"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>性别</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    gender: e.target.value as 'male' | 'female'
                  }))}
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div className="form-group">
                <label>排行</label>
                <select
                  value={formData.birthOrder}
                  onChange={e => setFormData(prev => ({ ...prev, birthOrder: e.target.value }))}
                >
                  <option value="">-- 不设置 --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>
                      {['', '长（第一）', '次（第二）', '三', '四', '五', '六', '七', '八', '九', '十'][n]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>出生年份</label>
                <input
                  type="number"
                  value={formData.birthYear}
                  onChange={e => setFormData(prev => ({ ...prev, birthYear: e.target.value }))}
                  placeholder="如：1950"
                />
              </div>
              <div className="form-group">
                <label>去世年份（在世留空）</label>
                <input
                  type="number"
                  value={formData.deathYear}
                  onChange={e => setFormData(prev => ({ ...prev, deathYear: e.target.value }))}
                  placeholder="如：2020"
                />
              </div>
            </div>

            <div className="form-group">
              <label>籍贯</label>
              <input
                type="text"
                value={formData.hometown}
                onChange={e => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
                placeholder="山东滨州"
              />
            </div>

            <div className="form-group">
              <label>简介（可选）</label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="简短介绍..."
              />
            </div>

            <div className="form-group">
              <label>配偶（可多选，按Ctrl/Cmd点击）</label>
              <select
                multiple
                size={4}
                value={formData.spouseIds.map(String)}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
                  setFormData(prev => ({ ...prev, spouseIds: selected }));
                }}
              >
                {spouseOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <small style={{ color: '#888', fontSize: '11px' }}>
                元配排第一位，继室/侧室依次排列
              </small>
            </div>

            <div className="form-group">
              <label>父亲（上一辈）</label>
              <select
                value={formData.parentId}
                onChange={e => setFormData(prev => ({ ...prev, parentId: e.target.value, motherId: '' }))}
              >
                <option value="">{parentGen ? '-- 选择父亲 --' : '-- 无上一辈 --'}</option>
                {parentOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Show mother selection when parent has multiple spouses */}
            {formData.parentId && (() => {
              const parent = parentGen?.members.find(m => m.id === Number(formData.parentId));
              if (!parent) return null;
              const spouseIds = getSpouseIds(parent);
              if (spouseIds.length <= 1) return null;
              const spouses = spouseIds
                .map(id => parentGen?.members.find(m => m.id === id))
                .filter(Boolean);
              return (
                <div className="form-group">
                  <label>生母</label>
                  <select
                    value={formData.motherId}
                    onChange={e => setFormData(prev => ({ ...prev, motherId: e.target.value }))}
                  >
                    <option value="">-- 选择生母 --</option>
                    {spouses.map((sp, idx) => (
                      <option key={sp!.id} value={sp!.id}>
                        {sp!.name} {idx === 0 ? '（元配）' : `（${['继室', '侧室', '妾'][idx - 1] || '其他'}）`}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#888', fontSize: '11px' }}>
                    一夫多妻时需要指定生母
                  </small>
                </div>
              );
            })()}
          </div>

          <div className="modal-footer">
            {member && (
              <button className="btn-detail" onClick={() => onViewDetail?.(member)}>
                📖 相册与故事
              </button>
            )}
            {member && onDelete && (
              <button className="btn-delete-member" onClick={onDelete}>删除此人</button>
            )}
            <button className="btn-save" onClick={handleSubmit}>保存</button>
          </div>
        </div>
      </div>
    </>
  );
}
