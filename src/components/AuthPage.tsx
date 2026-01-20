'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import './auth.css';

interface AuthPageProps {
    onSuccess?: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Countdown for verification code button
    const [countdown, setCountdown] = useState(0);
    const [isSendingCode, setIsSendingCode] = useState(false);

    // Send verification code
    const handleSendCode = async () => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('请输入有效的邮箱地址');
            return;
        }

        setIsSendingCode(true);
        setError('');
        setSuccess('');

        try {
            const result = await authApi.sendCode({ email, type: 'register' });
            setSuccess(result.message || '验证码已发送');
            setCountdown(60);

            // Start countdown
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            setError(err.message || '发送验证码失败');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(emailOrUsername, password);
            } else {
                // Validate registration
                if (password !== confirmPassword) {
                    throw new Error('两次密码输入不一致');
                }
                if (password.length < 6) {
                    throw new Error('密码至少6位');
                }
                if (!nickname.trim()) {
                    throw new Error('请输入昵称');
                }
                if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
                    throw new Error('请输入有效的手机号');
                }
                if (!verificationCode || verificationCode.length !== 6) {
                    throw new Error('请输入6位验证码');
                }

                await register(email, password, nickname.trim(), phone, verificationCode);
            }
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || '操作失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEmailOrUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNickname('');
        setPhone('');
        setVerificationCode('');
        setError('');
        setSuccess('');
        setCountdown(0);
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">✨✨寻源族谱✨✨</h1>
                    <p className="auth-subtitle">传承家族记忆，延续血脉亲情</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => { setIsLogin(true); resetForm(); }}
                    >
                        登录
                    </button>
                    <button
                        className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => { setIsLogin(false); resetForm(); }}
                    >
                        注册
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}
                    {success && <div className="auth-success">{success}</div>}

                    {isLogin ? (
                        <div className="form-group">
                            <label htmlFor="emailOrUsername">用户名/邮箱</label>
                            <input
                                id="emailOrUsername"
                                type="text"
                                value={emailOrUsername}
                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                placeholder="请输入用户名或邮箱"
                                required
                                autoComplete="username"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="email">邮箱</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="请输入邮箱"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="nickname">昵称</label>
                                <input
                                    id="nickname"
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="请输入昵称"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">手机号</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="请输入手机号"
                                    pattern="^1[3-9]\d{9}$"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="password">密码</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            required
                            minLength={6}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">确认密码</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="请再次输入密码"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="verificationCode">邮箱验证码</label>
                                <div className="verification-code-group">
                                    <input
                                        id="verificationCode"
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="请输入6位验证码"
                                        maxLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="send-code-btn"
                                        onClick={handleSendCode}
                                        disabled={isSendingCode || countdown > 0 || !email}
                                    >
                                        {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <button type="submit" className="auth-submit" disabled={isLoading}>
                        {isLoading ? '处理中...' : isLogin ? '登录' : '注册'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? '还没有账号？' : '已有账号？'}
                        <button type="button" className="auth-link" onClick={toggleMode}>
                            {isLogin ? '立即注册' : '立即登录'}
                        </button>
                    </p>
                </div>
            </div>

            <div className="auth-decoration">
                <div className="decoration-circle circle-1"></div>
                <div className="decoration-circle circle-2"></div>
                <div className="decoration-circle circle-3"></div>
            </div>
        </div>
    );
}
