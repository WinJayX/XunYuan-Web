'use client';

import { useState } from 'react';
import './biography-editor.css';

interface Biography {
    姓名: string;
    关系: string;
    出生年份?: number;
    简介: string;
}

interface BiographyEditorProps {
    biographies: Biography[];
    onSave: (biographies: Biography[]) => Promise<void>;
    onClose: () => void;
}

export default function BiographyEditor({ biographies: initialBios, onSave, onClose }: BiographyEditorProps) {
    const [biographies, setBiographies] = useState<Biography[]>(initialBios || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentBio, setCurrentBio] = useState<Biography>({
        姓名: '',
        关系: '',
        出生年份: undefined,
        简介: '',
    });

    // Start editing an existing biography
    const startEdit = (index: number) => {
        setCurrentBio({ ...biographies[index] });
        setEditingIndex(index);
    };

    // Start adding a new biography
    const startAdd = () => {
        setCurrentBio({
            姓名: '',
            关系: '',
            出生年份: undefined,
            简介: '',
        });
        setEditingIndex(biographies.length);
    };

    // Save current biography (either new or edited)
    const saveCurrent = () => {
        if (!currentBio.姓名.trim() || !currentBio.简介.trim()) {
            alert('请填写姓名和简介');
            return;
        }

        const newBiographies = [...biographies];
        if (editingIndex !== null && editingIndex < biographies.length) {
            // Editing existing
            newBiographies[editingIndex] = currentBio;
        } else {
            // Adding new
            newBiographies.push(currentBio);
        }
        setBiographies(newBiographies);
        setEditingIndex(null);
        setCurrentBio({ 姓名: '', 关系: '', 出生年份: undefined, 简介: '' });
    };

    // Delete a biography
    const deleteBio = (index: number) => {
        if (confirm('确定删除这条传略吗?')) {
            const newBiographies = biographies.filter((_, i) => i !== index);
            setBiographies(newBiographies);
        }
    };

    // Save all biographies (call parent save)
    const handleSave = async () => {
        try {
            await onSave(biographies);
            onClose();
        } catch (error) {
            alert('保存失败，请重试');
        }
    };

    // Cancel current edit
    const cancelEdit = () => {
        setEditingIndex(null);
        setCurrentBio({ 姓名: '', 关系: '', 出生年份: undefined, 简介: '' });
    };

    return (
        <div className="biography-editor-overlay" onClick={onClose}>
            <div className="biography-editor-container" onClick={(e) => e.stopPropagation()}>
                <div className="biography-editor-header">
                    <h2>编辑族人传略</h2>
                    <button className="biography-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="biography-editor-body">
                    {/* List of existing biographies */}
                    <div className="biography-list">
                        <div className="biography-list-header">
                            <h3>现有传略 ({biographies.length})</h3>
                            <button className="btn-add-bio" onClick={startAdd}>+ 添加新传略</button>
                        </div>
                        {biographies.map((bio, index) => (
                            <div key={index} className="biography-item">
                                <div className="biography-item-content">
                                    <h4>{bio.姓名} {bio.出生年份 && `(${bio.出生年份}年生)`}</h4>
                                    <p className="biography-relation">{bio.关系}</p>
                                    <p className="biography-intro">{bio.简介.substring(0, 100)}...</p>
                                </div>
                                <div className="biography-item-actions">
                                    <button onClick={() => startEdit(index)} className="btn-bio-edit">编辑</button>
                                    <button onClick={() => deleteBio(index)} className="btn-bio-delete">删除</button>
                                </div>
                            </div>
                        ))}
                        {biographies.length === 0 && (
                            <p className="no-biographies">暂无传略，点击上方按钮添加。</p>
                        )}
                    </div>

                    {/* Edit form */}
                    {editingIndex !== null && (
                        <div className="biography-edit-form">
                            <h3>{editingIndex < biographies.length ? '编辑传略' : '添加传略'}</h3>
                            <div className="form-group">
                                <label>姓名 *</label>
                                <input
                                    type="text"
                                    value={currentBio.姓名}
                                    onChange={(e) => setCurrentBio({ ...currentBio, 姓名: e.target.value })}
                                    placeholder="请输入姓名"
                                />
                            </div>
                            <div className="form-group">
                                <label>关系</label>
                                <input
                                    type="text"
                                    value={currentBio.关系}
                                    onChange={(e) => setCurrentBio({ ...currentBio, 关系: e.target.value })}
                                    placeholder="如：始祖、二世祖等"
                                />
                            </div>
                            <div className="form-group">
                                <label>出生年份</label>
                                <input
                                    type="number"
                                    value={currentBio.出生年份 || ''}
                                    onChange={(e) => setCurrentBio({
                                        ...currentBio,
                                        出生年份: e.target.value ? parseInt(e.target.value) : undefined
                                    })}
                                    placeholder="如：1950"
                                />
                            </div>
                            <div className="form-group">
                                <label>简介 *</label>
                                <textarea
                                    value={currentBio.简介}
                                    onChange={(e) => setCurrentBio({ ...currentBio, 简介: e.target.value })}
                                    placeholder="请输入人物简介..."
                                    rows={8}
                                />
                            </div>
                            <div className="form-actions">
                                <button onClick={saveCurrent} className="btn-save-current">保存此条</button>
                                <button onClick={cancelEdit} className="btn-cancel-current">取消</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="biography-editor-footer">
                    <button onClick={handleSave} className="btn-save-all"> ✓ 保存全部</button>
                    <button onClick={onClose} className="btn-cancel">取消</button>
                </div>
            </div>
        </div>
    );
}
