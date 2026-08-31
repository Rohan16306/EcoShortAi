const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Phase2/src/app/sign-up-login-screen/components/AuthFormPanel.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add signIn import
if (!content.includes("import { signIn }")) {
    content = content.replace(
        "import { useEffect } from 'react';",
        "import { useEffect } from 'react';\nimport { signIn } from 'next-auth/react';"
    );
}

// 2. Replace handleLogin
const handleLoginRegex = /const handleLogin = async \(data: LoginFormData\) => \{[\s\S]*?^\s*};/m;
const newHandleLogin = `const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Incorrect email or password.');
      } else {
        toast.success('Login successful!');
        if (role === 'admin') router.push('/admin-dashboard');
        else if (role === 'collector') router.push('/collector-dashboard');
        else router.push('/pickup-request-tracking');
      }
    } catch (e) {
      toast.error('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };`;
content = content.replace(handleLoginRegex, newHandleLogin);

// 3. Replace handleSignup
const handleSignupRegex = /const handleSignup = async \(data: SignupFormData\) => \{[\s\S]*?^\s*};\s*$/m;
const newHandleSignup = `const handleSignup = async (data: SignupFormData) => {
    toast.error('Signup is disabled in Phase 2. Please register via the main EcoSort site.');
  };`;
// content = content.replace(handleSignupRegex, newHandleSignup);
// The handleSignup regex is risky, let's just do it manually with a simpler replace
const startSignup = content.indexOf('const handleSignup = async (data: SignupFormData) => {');
const endSignup = content.indexOf('const handleSocialLogin =', startSignup);
if (startSignup !== -1 && endSignup !== -1) {
    content = content.substring(0, startSignup) + newHandleSignup + "\n\n  " + content.substring(endSignup);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored AuthFormPanel.tsx');
