import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for effect
        setTimeout(() => {
            if (username === 'admin' && password === 'Michu') {
                onLogin();
            } else {
                setError('Invalid credentials');
                setLoading(false);
            }
        }, 800);
    };

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
            {/* Abstract Background Shapes */}
            <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.1 }} />
            <div style={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.1 }} />

            <div style={{
                width: '100%',
                maxWidth: 420,
                padding: 40,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRadius: 32,
                border: '1px solid #ffffff',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        margin: '0 auto 24px',
                        borderRadius: 24,
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)'
                    }}>
                        <img src="/logo.png" alt="Damshique" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Welcome Back</h1>
                    <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Sign in to Damshique Intelligence</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, marginLeft: 4 }}>USERNAME</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                style={{
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
                                }}
                                onFocus={(e) => { e.target.style.background = '#fff'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, marginLeft: 4 }}>PASSWORD</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
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
                                }}
                                onFocus={(e) => { e.target.style.background = '#fff'; e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
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
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: 16,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            transition: 'all 0.2s',
                            opacity: loading ? 0.8 : 1,
                            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)'
                        }}
                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
                    </button>
                </form>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
