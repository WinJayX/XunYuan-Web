'use client';

import { useState, useRef } from 'react';
import { Settings, FamilyData } from '@/types/family';

interface SettingsPanelProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onExport: () => void;
  onImport: (data: FamilyData) => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onExport,
  onImport
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.settings && data.generations) {
            onImport(data);
            alert('数据导入成功！');
          } else {
            alert('无效的数据格式');
          }
        } catch (err) {
          alert('导入失败：' + (err as Error).message);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="settings-panel">
      <button
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        ⚙️ 设置
      </button>

      {isOpen && (
        <div className="settings-content show">
          <h3>页面设置</h3>

          <div className="setting-item">
            <label>家族姓氏</label>
            <input
              type="text"
              value={settings.familyName}
              onChange={e => onUpdateSettings({ familyName: e.target.value })}
              placeholder="如：陈氏家族"
            />
          </div>

          <div className="setting-item">
            <label>籍贯地区</label>
            <input
              type="text"
              value={settings.hometown}
              onChange={e => onUpdateSettings({ hometown: e.target.value })}
              placeholder="如：山东滨州"
            />
          </div>

          <div className="setting-item">
            <label>配色主题</label>
            <select
              value={settings.theme}
              onChange={e => onUpdateSettings({
                theme: e.target.value as Settings['theme']
              })}
            >
              <option value="classic">古典中式</option>
              <option value="modern">现代简约</option>
              <option value="warm">温馨暖色</option>
              <option value="elegant">典雅深色</option>
            </select>
          </div>

          <div className="setting-item">
            <label>背景图片（最多3张，点击上传）</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {(settings.bgImages || []).map((img, index) => (
                <div key={index} style={{ position: 'relative', width: '80px', height: '60px' }}>
                  <img
                    src={img}
                    alt={`背景${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = (settings.bgImages || []).filter((_, i) => i !== index);
                      onUpdateSettings({ bgImages: newImages });
                    }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(settings.bgImages || []).length < 3 && (
                <label
                  style={{
                    width: '80px',
                    height: '60px',
                    border: '2px dashed #ccc',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#999'
                  }}
                >
                  +
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      console.log('File selected:', file);
                      if (!file) {
                        console.log('No file selected');
                        return;
                      }

                      // Check file size (max 2MB for background)
                      if (file.size > 2 * 1024 * 1024) {
                        alert('背景图片不能超过 2MB');
                        return;
                      }

                      console.log('Reading file as base64...');
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const base64 = ev.target?.result as string;
                          console.log('Base64 generated, length:', base64?.length);
                          const newImages = [...(settings.bgImages || []), base64];
                          console.log('Updating settings with', newImages.length, 'images');
                          onUpdateSettings({ bgImages: newImages });
                        } catch (err) {
                          console.error('Error processing image:', err);
                          alert('图片处理失败');
                        }
                      };
                      reader.onerror = (err) => {
                        console.error('FileReader error:', err);
                        alert('读取图片失败');
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <small style={{ color: '#888', fontSize: '11px' }}>
              支持上传本地图片，图片会存储在浏览器中
            </small>
          </div>

          <div className="setting-buttons">
            <button onClick={onExport}>📤 导出数据</button>
            <button onClick={handleImportClick}>📥 导入数据</button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
