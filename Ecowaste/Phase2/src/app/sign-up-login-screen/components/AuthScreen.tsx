'use client';

import React, { useState } from 'react';
import AuthBrandPanel from './AuthBrandPanel';
import AuthFormPanel from './AuthFormPanel';

export type AuthRole = 'admin';
export type AuthMode = 'login';

export default function AuthScreen() {
  const [role, setRole] = useState<AuthRole>('admin');
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