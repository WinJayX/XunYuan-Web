'use client';

import { useState } from 'react';
import './edit-modal.css';

interface EditModalProps {
    title: string;
    content: string;
    onSave: (newContent: string) => void;
    onClose: () => void;
}

export default function EditModal({ title, content, onSave, onClose }: EditModalProps) {
    const [editedContent, setEditedContent] = useState(content);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(editedContent);
            onClose();
        } catch (error) {
            alert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <h3>{title}</h3>
                    <button className="btn-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="edit-modal-body">
                    <textarea
                        className="edit-textarea"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="请输入内容..."
                        rows={15}
                    />
                </div>

                <div className="edit-modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={saving}>
                        取消
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
