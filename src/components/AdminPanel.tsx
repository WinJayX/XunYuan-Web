'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import './admin.css';

interface AdminPanelProps {
    onBack: () => void;
}

type TabType = 'dashboard' | 'users' | 'families' | 'feedbacks' | 'logs' | 'data' | 'settings';

// Dashboard Component
function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await adminApi.getDashboard();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="admin-loading">加载中...</div>;

    return (
        <div className="admin-dashboard">
            <h2>系统概览</h2>
            <p className="admin-subtitle">管理员控制台</p>

            <div className="stats-grid">
                <div className="stat-card stat-users">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.totalUsers || 0}</h3>
                        <p>总用户数</p>
                        <span className="stat-detail">活跃: {stats?.stats?.activeUsers || 0}</span>
                    </div>
                </div>
                <div className="stat-card stat-families">
                    <div className="stat-icon">📜</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.totalFamilies || 0}</h3>
                        <p>族谱数量</p>
                        <span className="stat-detail">正常运营</span>
                    </div>
                </div>
                <div className="stat-card stat-generations">
                    <div className="stat-icon">🌳</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.totalGenerations || 0}</h3>
                        <p>总代数</p>
                        <span className="stat-detail">持续增长</span>
                    </div>
                </div>
                <div className="stat-card stat-members">
                    <div className="stat-icon">👤</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.totalMembers || 0}</h3>
                        <p>成员总数</p>
                        <span className="stat-detail">传承中</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card">
                    <h4>用户状态分布</h4>
                    <div className="progress-list">
                        <div className="progress-item">
                            <span className="label">活跃用户</span>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill active"
                                    style={{ width: `${stats?.stats?.totalUsers ? (stats.stats.activeUsers / stats.stats.totalUsers * 100) : 0}%` }}
                                />
                            </div>
                            <span className="value">{stats?.stats?.activeUsers || 0}</span>
                        </div>
                        <div className="progress-item">
                            <span className="label">禁用用户</span>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill disabled"
                                    style={{ width: `${stats?.stats?.totalUsers ? (stats.stats.disabledUsers / stats.stats.totalUsers * 100) : 0}%` }}
                                />
                            </div>
                            <span className="value">{stats?.stats?.disabledUsers || 0}</span>
                        </div>
                    </div>
                </div>
                <div className="dashboard-card">
                    <h4>今日系统日志</h4>
                    <div className="big-number">{stats?.stats?.todayLogs || 0}</div>
                    <p className="text-muted">条日志记录</p>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card wide">
                    <h4>最近注册用户</h4>
                    <table className="mini-table">
                        <thead>
                            <tr>
                                <th>昵称</th>
                                <th>邮箱</th>
                                <th>注册时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentUsers?.map((user: any) => (
                                <tr key={user.id}>
                                    <td>{user.nickname}</td>
                                    <td>{user.email}</td>
                                    <td>{new Date(user.createdAt).toLocaleString('zh-CN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Users Component
function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);

    useEffect(() => {
        loadUsers();
    }, [page, search]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(page, 20, search || undefined);
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const handleToggleStatus = async (user: any) => {
        try {
            await adminApi.updateUser(user.id, {
                status: user.status === 'active' ? 'disabled' : 'active'
            });
            loadUsers();
        } catch (error) {
            alert('操作失败');
        }
    };

    const handleUpdateLimits = async () => {
        if (!editingUser) return;
        try {
            await adminApi.updateUser(editingUser.id, {
                maxFamilies: editingUser.maxFamilies,
                maxGenerations: editingUser.maxGenerations,
            });
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            alert('保存失败');
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (!confirm(`确定要删除用户 "${user.nickname}" 吗？此操作不可恢复！`)) return;
        try {
            await adminApi.deleteUser(user.id);
            loadUsers();
        } catch (error) {
            alert('删除失败');
        }
    };

    const handleResetPassword = async (user: any) => {
        if (!confirm(`确定要重置用户 "${user.nickname}" 的密码吗？\n密码将被重置为默认密码：xy123456`)) return;
        try {
            const result = await adminApi.resetUserPassword(user.id);
            alert(result.message || '密码重置成功');
            loadUsers();
        } catch (error: any) {
            alert(error.message || '密码重置失败');
        }
    };


    return (
        <div className="admin-section">
            <h2>用户管理</h2>
            <p className="admin-subtitle">管理系统用户和权限</p>

            <div className="search-bar">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="搜索用户名或邮箱..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit">搜索</button>
                </form>
            </div>

            {loading ? (
                <div className="admin-loading">加载中...</div>
            ) : (
                <>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>昵称</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>状态</th>
                                <th>族谱限制</th>
                                <th>代数限制</th>
                                <th>族谱数</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.nickname}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                                            {user.role === 'admin' ? '管理员' : '普通用户'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.status === 'active' ? 'badge-active' : 'badge-disabled'}`}>
                                            {user.status === 'active' ? '正常' : '禁用'}
                                        </span>
                                    </td>
                                    <td>{user.maxFamilies}</td>
                                    <td>{user.maxGenerations}</td>
                                    <td>{user.familiesCount}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</td>
                                    <td className="actions">
                                        <button
                                            className="btn-small btn-edit"
                                            onClick={() => setEditingUser({ ...user })}
                                        >
                                            编辑限制
                                        </button>
                                        <button
                                            className={`btn-small ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                                            onClick={() => handleToggleStatus(user)}
                                            disabled={user.role === 'admin'}
                                        >
                                            {user.status === 'active' ? '禁用' : '启用'}
                                        </button>
                                        <button
                                            className="btn-small btn-warning"
                                            onClick={() => handleResetPassword(user)}
                                            disabled={user.role === 'admin'}
                                        >
                                            重置密码
                                        </button>
                                        <button
                                            className="btn-small btn-danger"
                                            onClick={() => handleDeleteUser(user)}
                                            disabled={user.role === 'admin'}
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
                        <span>第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
                        <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</button>
                    </div>
                </>
            )}

            {/* Edit Limits Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>编辑用户限制 - {editingUser.nickname}</h3>
                        <div className="form-group">
                            <label>族谱数量限制</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={editingUser.maxFamilies}
                                onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    maxFamilies: parseInt(e.target.value) || 1
                                })}
                            />
                        </div>
                        <div className="form-group">
                            <label>代数限制</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={editingUser.maxGenerations}
                                onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    maxGenerations: parseInt(e.target.value) || 10
                                })}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setEditingUser(null)}>取消</button>
                            <button className="btn-confirm" onClick={handleUpdateLimits}>保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Families Component
function Families() {
    const [families, setFamilies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadFamilies();
    }, [page, search]);

    const loadFamilies = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getFamilies(page, 20, search || undefined);
            setFamilies(data.families || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to load families:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadFamilies();
    };

    const handleDelete = async (family: any) => {
        if (!confirm(`确定要删除族谱 "${family.name}" 吗？此操作将删除所有相关数据！`)) return;
        try {
            await adminApi.deleteFamily(family.id);
            loadFamilies();
        } catch (error) {
            alert('删除失败');
        }
    };

    return (
        <div className="admin-section">
            <h2>族谱管理</h2>
            <p className="admin-subtitle">管理系统中的所有族谱</p>

            <div className="search-bar">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="搜索族谱名称..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit">搜索</button>
                </form>
            </div>

            {loading ? (
                <div className="admin-loading">加载中...</div>
            ) : (
                <>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>族谱名称</th>
                                <th>副标题</th>
                                <th>创建者</th>
                                <th>代数</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {families.map((family) => (
                                <tr key={family.id}>
                                    <td><strong>{family.name}</strong></td>
                                    <td>{family.subtitle || '-'}</td>
                                    <td>{family.user?.nickname} ({family.user?.email})</td>
                                    <td>{family.generationsCount} 代</td>
                                    <td>{new Date(family.createdAt).toLocaleDateString('zh-CN')}</td>
                                    <td className="actions">
                                        <button
                                            className="btn-small btn-danger"
                                            onClick={() => handleDelete(family)}
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
                        <span>第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
                        <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</button>
                    </div>
                </>
            )}
        </div>
    );
}

// Feedbacks Component
function Feedbacks() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        loadFeedbacks();
    }, [page, statusFilter]);

    const loadFeedbacks = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getFeedbacks(page, 20, statusFilter || undefined);
            setFeedbacks(data.feedbacks || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to load feedbacks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (feedback: any, newStatus: string) => {
        try {
            await adminApi.updateFeedback(feedback.id, { status: newStatus });
            loadFeedbacks();
        } catch (error) {
            alert('操作失败');
        }
    };

    const handleReply = async () => {
        if (!replyingTo || !replyText.trim()) return;
        try {
            await adminApi.updateFeedback(replyingTo.id, {
                adminReply: replyText,
                status: 'resolved'
            });
            setReplyingTo(null);
            setReplyText('');
            loadFeedbacks();
        } catch (error) {
            alert('回复失败');
        }
    };

    const getStatusBadge = (status: string) => {
        const map: any = {
            pending: { text: '待处理', class: 'badge-warning' },
            processing: { text: '处理中', class: 'badge-info' },
            resolved: { text: '已解决', class: 'badge-success' },
            closed: { text: '已关闭', class: 'badge-secondary' },
        };
        return map[status] || { text: status, class: '' };
    };

    const getPriorityBadge = (priority: string) => {
        const map: any = {
            low: { text: '低', class: 'priority-low' },
            medium: { text: '中', class: 'priority-medium' },
            high: { text: '高', class: 'priority-high' },
            urgent: { text: '紧急', class: 'priority-urgent' },
        };
        return map[priority] || { text: priority, class: '' };
    };

    return (
        <div className="admin-section">
            <h2>用户反馈</h2>
            <p className="admin-subtitle">管理用户提交的反馈和建议</p>

            <div className="filter-bar">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">全部状态</option>
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="resolved">已解决</option>
                    <option value="closed">已关闭</option>
                </select>
            </div>

            {loading ? (
                <div className="admin-loading">加载中...</div>
            ) : feedbacks.length === 0 ? (
                <div className="empty-state">
                    <p>暂无反馈</p>
                </div>
            ) : (
                <>
                    <div className="feedback-list">
                        {feedbacks.map((fb) => (
                            <div key={fb.id} className="feedback-card">
                                <div className="feedback-header">
                                    <h4>{fb.title}</h4>
                                    <div className="feedback-badges">
                                        <span className={`badge ${getStatusBadge(fb.status).class}`}>
                                            {getStatusBadge(fb.status).text}
                                        </span>
                                        <span className={`badge ${getPriorityBadge(fb.priority).class}`}>
                                            {getPriorityBadge(fb.priority).text}
                                        </span>
                                    </div>
                                </div>
                                <p className="feedback-content">{fb.content}</p>
                                <div className="feedback-meta">
                                    <span>来自: {fb.user?.nickname} ({fb.user?.email})</span>
                                    <span>{new Date(fb.createdAt).toLocaleString('zh-CN')}</span>
                                </div>
                                {fb.adminReply && (
                                    <div className="admin-reply">
                                        <strong>管理员回复:</strong> {fb.adminReply}
                                    </div>
                                )}
                                <div className="feedback-actions">
                                    <select
                                        value={fb.status}
                                        onChange={(e) => handleStatusChange(fb, e.target.value)}
                                    >
                                        <option value="pending">待处理</option>
                                        <option value="processing">处理中</option>
                                        <option value="resolved">已解决</option>
                                        <option value="closed">已关闭</option>
                                    </select>
                                    <button
                                        className="btn-small btn-primary"
                                        onClick={() => { setReplyingTo(fb); setReplyText(fb.adminReply || ''); }}
                                    >
                                        回复
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
                        <span>第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
                        <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</button>
                    </div>
                </>
            )}

            {/* Reply Modal */}
            {replyingTo && (
                <div className="modal-overlay" onClick={() => setReplyingTo(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>回复反馈</h3>
                        <p className="text-muted">"{replyingTo.title}"</p>
                        <div className="form-group">
                            <textarea
                                rows={4}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="输入管理员回复..."
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setReplyingTo(null)}>取消</button>
                            <button className="btn-confirm" onClick={handleReply}>提交回复</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Logs Component
function Logs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [levelFilter, setLevelFilter] = useState('');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadLogs();
        loadStats();
    }, [page, levelFilter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getLogs({ page, limit: 50, level: levelFilter || undefined });
            setLogs(data.logs || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await adminApi.getLogStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load log stats:', error);
        }
    };

    const getLevelClass = (level: string) => {
        const map: any = {
            DEBUG: 'log-debug',
            INFO: 'log-info',
            WARN: 'log-warn',
            ERROR: 'log-error',
            SYSTEM: 'log-system',
        };
        return map[level] || '';
    };

    return (
        <div className="admin-section">
            <h2>系统日志</h2>
            <p className="admin-subtitle">查看系统操作日志</p>

            <div className="stats-row">
                <div className="mini-stat">
                    <span className="number">{stats?.totalLogs || 0}</span>
                    <span className="label">总日志数</span>
                </div>
                <div className="mini-stat">
                    <span className="number">{stats?.todayLogs || 0}</span>
                    <span className="label">今日日志</span>
                </div>
            </div>

            <div className="filter-bar">
                <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}>
                    <option value="">全部级别</option>
                    <option value="DEBUG">DEBUG</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="SYSTEM">SYSTEM</option>
                </select>
                <button className="btn-refresh" onClick={loadLogs}>刷新</button>
            </div>

            {loading ? (
                <div className="admin-loading">加载中...</div>
            ) : (
                <>
                    <div className="logs-list">
                        {logs.map((log) => (
                            <div key={log.id} className={`log-entry ${getLevelClass(log.level)}`}>
                                <div className="log-header">
                                    <span className="log-time">{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                                    <span className={`log-level ${getLevelClass(log.level)}`}>{log.level}</span>
                                    <span className="log-module">[{log.module}]</span>
                                    <span className="log-action">{log.action}</span>
                                </div>
                                <div className="log-message">{log.message}</div>
                            </div>
                        ))}
                    </div>

                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
                        <span>第 {page} 页 / 共 {Math.ceil(total / 50)} 页</span>
                        <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>下一页</button>
                    </div>
                </>
            )}
        </div>
    );
}

// Data Management Component
function DataManagement() {
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadOverview();
    }, []);

    const loadOverview = async () => {
        try {
            const data = await adminApi.getDataOverview();
            setOverview(data);
        } catch (error) {
            console.error('Failed to load data overview:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type: string) => {
        setExporting(true);
        try {
            const response = await adminApi.exportData(type);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `xunyuan-${type}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('导出失败');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div className="admin-loading">加载中...</div>;

    return (
        <div className="admin-section">
            <h2>数据概览</h2>
            <p className="admin-subtitle">系统数据统计与导出</p>

            <div className="data-stats-grid">
                <div className="data-stat-card">
                    <span className="icon">👥</span>
                    <span className="number">{overview?.users || 0}</span>
                    <span className="label">用户</span>
                </div>
                <div className="data-stat-card">
                    <span className="icon">📜</span>
                    <span className="number">{overview?.families || 0}</span>
                    <span className="label">族谱</span>
                </div>
                <div className="data-stat-card">
                    <span className="icon">🌳</span>
                    <span className="number">{overview?.generations || 0}</span>
                    <span className="label">代数</span>
                </div>
                <div className="data-stat-card">
                    <span className="icon">👤</span>
                    <span className="number">{overview?.members || 0}</span>
                    <span className="label">成员</span>
                </div>
                <div className="data-stat-card">
                    <span className="icon">💬</span>
                    <span className="number">{overview?.feedbacks || 0}</span>
                    <span className="label">反馈</span>
                </div>
                <div className="data-stat-card">
                    <span className="icon">📋</span>
                    <span className="number">{overview?.logs || 0}</span>
                    <span className="label">日志</span>
                </div>
            </div>

            <div className="export-section">
                <h3>数据管理</h3>
                <div className="data-actions-grid">
                    <div className="data-action-card">
                        <h4>备份数据</h4>
                        <p className="text-muted">导出系统数据为JSON格式</p>
                        <div className="export-buttons">
                            <button className="btn-outline" onClick={() => handleExport('users')} disabled={exporting}>
                                导出用户
                            </button>
                            <button className="btn-outline" onClick={() => handleExport('families')} disabled={exporting}>
                                导出族谱
                            </button>
                            <button className="btn-outline" onClick={() => handleExport('logs')} disabled={exporting}>
                                导出日志
                            </button>
                            <button className="btn-primary" onClick={() => handleExport('all')} disabled={exporting}>
                                导出全部数据
                            </button>
                        </div>
                    </div>

                    <div className="data-action-card">
                        <h4>恢复数据</h4>
                        <p className="text-muted">从JSON备份文件恢复数据</p>
                        <div className="restore-actions">
                            <input
                                type="file"
                                accept=".json"
                                id="restore-file"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (!confirm('警告：恢复数据可能会导致现有数据冲突。建议在恢复前先进行备份。确定要继续吗？')) {
                                        e.target.value = '';
                                        return;
                                    }

                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                        try {
                                            const json = JSON.parse(event.target?.result as string);
                                            setLoading(true);
                                            const result = await adminApi.restoreData(json);
                                            alert(`恢复完成！\n用户: ${result.users}\n族谱: ${result.families}\n${result.warnings.length > 0 ? `\n警告:\n${result.warnings.join('\n')}` : ''}`);
                                            loadOverview();
                                        } catch (error) {
                                            console.error('Restore failed:', error);
                                            alert('恢复失败，请检查文件格式');
                                        } finally {
                                            setLoading(false);
                                            if (e.target) e.target.value = '';
                                        }
                                    };
                                    reader.readAsText(file);
                                }}
                            />
                            <button
                                className="btn-danger"
                                onClick={() => document.getElementById('restore-file')?.click()}
                                disabled={loading}
                            >
                                📂 选择备份文件并恢复
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Settings Component
function Settings() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await adminApi.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Remove read-only fields before sending
            const { id, createdAt, updatedAt, ...updateData } = settings;
            await adminApi.updateSettings(updateData);
            alert('设置已保存');
        } catch (error) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-loading">加载中...</div>;

    return (
        <div className="admin-section">
            <h2>系统设置</h2>
            <p className="admin-subtitle">配置系统参数</p>

            <div className="settings-grid">
                <div className="settings-card">
                    <h3>基础设置</h3>
                    <div className="form-group">
                        <label>系统名称</label>
                        <input
                            type="text"
                            value={settings?.systemName || ''}
                            onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>系统描述</label>
                        <input
                            type="text"
                            value={settings?.systemDescription || ''}
                            onChange={(e) => setSettings({ ...settings, systemDescription: e.target.value })}
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings?.maintenanceMode || false}
                                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                            />
                            维护模式
                        </label>
                    </div>
                </div>

                <div className="settings-card">
                    <h3>新用户默认限制</h3>
                    <div className="form-group">
                        <label>默认族谱限制</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={settings?.defaultMaxFamilies || 1}
                            onChange={(e) => setSettings({ ...settings, defaultMaxFamilies: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>默认代数限制</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={settings?.defaultMaxGenerations || 10}
                            onChange={(e) => setSettings({ ...settings, defaultMaxGenerations: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="settings-card">
                    <h3>安全设置</h3>
                    <div className="form-group">
                        <label>最小密码长度</label>
                        <input
                            type="number"
                            min="6"
                            max="30"
                            value={settings?.minPasswordLength || 6}
                            onChange={(e) => setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>最大登录失败次数</label>
                        <input
                            type="number"
                            min="3"
                            max="10"
                            value={settings?.maxLoginAttempts || 5}
                            onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>会话超时（分钟）</label>
                        <input
                            type="number"
                            min="30"
                            max="10080"
                            value={settings?.sessionTimeout || 1440}
                            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="settings-card">
                    <h3>邮件配置</h3>
                    <div className="form-group">
                        <label>SMTP服务器地址</label>
                        <input
                            type="text"
                            value={settings?.smtpHost || ''}
                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                            placeholder="smtp.example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>SMTP端口</label>
                        <input
                            type="number"
                            min="1"
                            max="65535"
                            value={settings?.smtpPort || 587}
                            onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>SMTP用户名/邮箱</label>
                        <input
                            type="text"
                            value={settings?.smtpUser || ''}
                            onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                            placeholder="user@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>SMTP密码</label>
                        <input
                            type="password"
                            value={settings?.smtpPassword || ''}
                            onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                            placeholder="输入密码"
                        />
                    </div>
                    <div className="form-group">
                        <label>发件人邮箱</label>
                        <input
                            type="email"
                            value={settings?.smtpFrom || ''}
                            onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                            placeholder="noreply@example.com"
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings?.smtpSecure || false}
                                onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
                            />
                            使用 SSL/TLS (端口465)
                        </label>
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings?.emailVerificationEnabled !== false}
                                onChange={(e) => setSettings({ ...settings, emailVerificationEnabled: e.target.checked })}
                            />
                            启用邮箱验证注册
                        </label>
                    </div>
                </div>
            </div>

            <div className="settings-actions">
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? '保存中...' : '保存设置'}
                </button>
            </div>
        </div>
    );
}

// Main AdminPanel Component
export default function AdminPanel({ onBack }: AdminPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');

    const menuItems = [
        { key: 'dashboard', label: '系统概览', icon: '📊' },
        { key: 'users', label: '用户管理', icon: '👥' },
        { key: 'families', label: '族谱管理', icon: '📜' },
        { key: 'feedbacks', label: '用户反馈', icon: '💬' },
        { key: 'logs', label: '系统日志', icon: '📋' },
        { key: 'data', label: '数据概览', icon: '💾' },
        { key: 'settings', label: '系统设置', icon: '⚙️' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'users': return <Users />;
            case 'families': return <Families />;
            case 'feedbacks': return <Feedbacks />;
            case 'logs': return <Logs />;
            case 'data': return <DataManagement />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h1>寻源管理</h1>
                    <p>后台管理系统</p>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.key}
                            className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.key as TabType)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="btn-back" onClick={onBack}>
                        ← 返回前台
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {renderContent()}
            </main>
        </div>
    );
}
