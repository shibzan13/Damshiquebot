import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, Loader2, Zap } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [regSuccess, setRegSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                // Store the session token securely
                localStorage.setItem("admin_token", data.token);
                localStorage.setItem("admin_user", JSON.stringify(data.user));
                onLogin();
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Invalid credentials');
                setLoading(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('Connection error. Please try again.');
            setLoading(false);
        }
    };

    const handleRequestAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch("/api/admin/users/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, name, details: "Web dashboard request" })
            });

            if (response.ok) {
                setRegSuccess(true);
            } else {
                setError("Failed to submit request. Please try again.");
            }
        } catch (err) {
            setError("Connection error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, marginLeft: 4 } as any;
    const inputStyle = {
        width: '100%',
        padding: '14px 16px 14px 48px',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        fontSize: 15,
        outline: 'none',
        transition: 'all 0.2s',
        background: '#f8fafc',
        color: '#0f172a',
        fontWeight: 500
    } as any;
    const iconStyle = { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' } as any;
    const errorStyle = {
        marginBottom: 24,
        padding: '12px 16px',
        background: '#fef2f2',
        border: '1px solid #fee2e2',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#ef4444',
        fontSize: 13,
        fontWeight: 600,
        animation: 'shake 0.4s ease-in-out'
    } as any;
    const buttonStyle = {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        color: '#fff',
        border: 'none',
        fontSize: 16,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transition: 'all 0.2s',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)'
    } as any;

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.1 }} />
            <div style={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.1 }} />

            <div style={{
                width: '100%',
                maxWidth: 420,
                padding: 40,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(200px)',
                borderRadius: 32,
                border: '1px solid #ffffff',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 80, height: 80, margin: '0 auto 24px',
                        borderRadius: 24, overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)'
                    }}>
                        <img src="/logo.png" alt="Damshique" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                        {isRegister ? "Join the System" : "Welcome Back"}
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                        {isRegister ? "Submit your details for approval" : "Sign in to Damshique Intelligence"}
                    </p>
                </div>

                {regSuccess ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ width: 64, height: 64, background: '#10b981', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Zap size={32} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Request Sent!</h2>
                        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>Your registration request has been submitted. An admin will review and approve your access shortly.</p>
                        <button onClick={() => { setRegSuccess(false); setIsRegister(false); }} style={{ padding: '12px 24px', borderRadius: 12, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Back to Login</button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={isRegister ? handleRequestAccess : handleLogin}>
                            {isRegister ? (
                                <>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={labelStyle}>FULL NAME</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} color="#94a3b8" style={iconStyle} />
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 32 }}>
                                        <label style={labelStyle}>PHONE NUMBER (WITH COUNTRY CODE)</label>
                                        <div style={{ position: 'relative' }}>
                                            <Zap size={18} color="#94a3b8" style={iconStyle} />
                                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+447..." style={inputStyle} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={labelStyle}>USERNAME</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} color="#94a3b8" style={iconStyle} />
                                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 32 }}>
                                        <label style={labelStyle}>PASSWORD</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} color="#94a3b8" style={iconStyle} />
                                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {error && <div style={errorStyle}><AlertCircle size={16} />{error}</div>}

                            <button type="submit" disabled={loading} style={buttonStyle}>
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <>{isRegister ? "Send Request" : "Sign In"} <ArrowRight size={20} /></>}
                            </button>
                        </form>

                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <button
                                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '0 auto' }}
                            >
                                {isRegister ? "Already have an account? Sign In" : "Need access? Request an account"}
                            </button>
                        </div>
                    </>
                )}
            </div>
            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
