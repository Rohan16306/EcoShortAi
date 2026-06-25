'use client';

import React, { useState } from 'react';
import AuthBrandPanel from './AuthBrandPanel';
import AuthFormPanel from './AuthFormPanel';

export type AuthRole = 'user' | 'collector' | 'admin';
export type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const [role, setRole] = useState<AuthRole>('user');
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel role={role} />
      <AuthFormPanel
        role={role}
        setRole={setRole}
        mode={mode}
        setMode={setMode}
      />
    </div>
  );
}