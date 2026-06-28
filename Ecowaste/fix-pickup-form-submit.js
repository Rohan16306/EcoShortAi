const fs = require('fs');
const path = require('path');

const file = 'Phase2/src/app/pickup-request-tracking/components/PickupRequestForm.tsx';
const fullPath = path.join(__dirname, file);
let content = fs.readFileSync(fullPath, 'utf8');

const targetStr = `  const onSubmit = async (data: FormInputs) => {
    setLoading(true);

    const authRaw = getAuthCookie();
    const auth = authRaw ? JSON.parse(authRaw) : null;`;

const replacementStr = `  const onSubmit = async (data: FormInputs) => {
    setLoading(true);

    const auth = session?.user as any;`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed onSubmit in PickupRequestForm.tsx');
} else {
    console.log('Target string not found!');
}
