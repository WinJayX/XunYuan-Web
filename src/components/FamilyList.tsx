'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { familiesApi, feedbackApi } from '@/lib/api';
import './family-list.css';

interface Family {
    id: string;
    name: string;
    subtitle?: string;
    hometown?: string;
    theme: string;
    updatedAt: string;
}

interface FamilyListProps {
    onLogout: () => void;
    isAdmin?: boolean;
    onOpenAdmin?: () => void;
}

export default function FamilyList({ onLogout, isAdmin, onOpenAdmin }: FamilyListProps) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [families, setFamilies] = useState<Family[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [newFamilySubtitle, setNewFamilySubtitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Feedback state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackTitle, setFeedbackTitle] = useState('');
    const [feedbackContent, setFeedbackContent] = useState('');
    const [feedbackType, setFeedbackType] = useState('suggestion');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // Load families
    useEffect(() => {
        loadFamilies();
    }, []);

    const loadFamilies = async () => {
        try {
            const data = await familiesApi.getAll();
            setFamilies(data);
        } catch (error) {
            console.error('Failed to load families:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFamily = async () => {
        if (!newFamilyName.trim()) return;

        setIsCreating(true);
        try {
            const newFamily = await familiesApi.create({
                name: newFamilyName.trim(),
                subtitle: newFamilySubtitle.trim() || undefined,
            });
            setFamilies([newFamily, ...families]);
            setShowCreateModal(false);
            setNewFamilyName('');
            setNewFamilySubtitle('');
            // Auto-open the new family
            router.push(`/family/${newFamily.id}`);
        } catch (error: any) {
            alert(error.message || '创建失败');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteFamily = async (id: string, name: string) => {
        if (!confirm(`确定要删除"${name}"吗？此操作不可恢复。`)) return;

        try {
            await familiesApi.delete(id);
            setFamilies(families.filter(f => f.id !== id));
        } catch (error: any) {
            alert(error.message || '删除失败');
        }
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackTitle.trim() || !feedbackContent.trim()) {
            alert('请填写标题和内容');
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            await feedbackApi.create({
                title: feedbackTitle.trim(),
                content: feedbackContent.trim(),
                type: feedbackType,
            });
            alert('感谢您的反馈！我们会尽快处理。');
            setShowFeedbackModal(false);
            setFeedbackTitle('');
            setFeedbackContent('');
            setFeedbackType('suggestion');
        } catch (error: any) {
            alert(error.message || '提交失败，请稍后重试');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleLogout = () => {
        logout();
        onLogout();
    };

    if (isLoading) {
        return (
            <div className="family-list-loading">
                <div className="loading-spinner"></div>
                <p>加载中...</p>
            </div>
        );
    }

    return (
        <div className="family-list-container">
            <header className="family-list-header">
                <div className="header-left">
                    <h1>✨✨寻源族谱✨✨</h1>
                    <p>欢迎回来，{user?.nickname}</p>
                </div>
                <div className="header-right">
                    <button className="btn-feedback" onClick={() => setShowFeedbackModal(true)}>
                        💬 意见反馈
                    </button>
                    {isAdmin && onOpenAdmin && (
                        <button className="btn-admin" onClick={onOpenAdmin}>
                            ⚙️ 管理后台
                        </button>
                    )}
                    <button className="btn-logout" onClick={handleLogout}>
                        退出登录
                    </button>
                </div>
            </header>

            <main className="family-list-main">
                <div className="list-header">
                    <h2>我的族谱</h2>
                    <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                        + 创建族谱
                    </button>
                </div>

                {families.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📜</div>
                        <h3>还没有族谱</h3>
                        <p>点击"创建族谱"开始记录您的家族历史</p>
                        <button className="btn-create-large" onClick={() => setShowCreateModal(true)}>
                            创建第一个族谱
                        </button>
                    </div>
                ) : (
                    <div className="family-grid">
                        {families.map((family) => (
                            <div key={family.id} className="family-card">
                                <div className="family-card-header">
                                    <h3>{family.name}</h3>
                                    <button
                                        className="btn-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFamily(family.id, family.name);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                                {family.subtitle && <p className="family-subtitle">{family.subtitle}</p>}
                                <div className="family-meta">
                                    <span className="family-hometown">{family.hometown || '未设置籍贯'}</span>
                                    <span className="family-date">
                                        更新于 {new Date(family.updatedAt).toLocaleDateString('zh-CN')}
                                    </span>
                                </div>
                                <div className="family-actions">
                                    <button
                                        className="btn-genealogy"
                                        onClick={() => router.push(`/family/${family.id}/genealogy`)}
                                    >
                                        📜 族谱详情
                                    </button>
                                    <button
                                        className="btn-family-tree"
                                        onClick={() => router.push(`/family/${family.id}`)}
                                    >
                                        🌳 族谱树
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="create-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>创建新族谱</h3>
                        <div className="form-group">
                            <label>族谱名称 *</label>
                            <input
                                type="text"
                                value={newFamilyName}
                                onChange={(e) => setNewFamilyName(e.target.value)}
                                placeholder="如：王氏家族"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>副标题</label>
                            <input
                                type="text"
                                value={newFamilySubtitle}
                                onChange={(e) => setNewFamilySubtitle(e.target.value)}
                                placeholder="如：传承百年，源远流长"
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                                取消
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={handleCreateFamily}
                                disabled={!newFamilyName.trim() || isCreating}
                            >
                                {isCreating ? '创建中...' : '创建'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
                    <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>💬 意见反馈</h3>
                        <p className="feedback-desc">感谢您的反馈，这将帮助我们改进产品！</p>

                        <div className="form-group">
                            <label>反馈类型</label>
                            <select
                                value={feedbackType}
                                onChange={(e) => setFeedbackType(e.target.value)}
                            >
                                <option value="suggestion">功能建议</option>
                                <option value="bug">问题反馈</option>
                                <option value="question">使用疑问</option>
                                <option value="other">其他</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>标题 *</label>
                            <input
                                type="text"
                                value={feedbackTitle}
                                onChange={(e) => setFeedbackTitle(e.target.value)}
                                placeholder="简要描述您的反馈"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>详细描述 *</label>
                            <textarea
                                rows={5}
                                value={feedbackContent}
                                onChange={(e) => setFeedbackContent(e.target.value)}
                                placeholder="请详细描述您的问题或建议..."
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowFeedbackModal(false)}>
                                取消
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={handleSubmitFeedback}
                                disabled={!feedbackTitle.trim() || !feedbackContent.trim() || isSubmittingFeedback}
                            >
                                {isSubmittingFeedback ? '提交中...' : '提交反馈'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

