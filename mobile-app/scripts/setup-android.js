import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(command) {
  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

// 1. Add Android Platform (Only if not exists)
if (!fs.existsSync('android')) {
  try {
    run('npx cap add android');
  } catch (e) {
    console.log('Android platform failed to add.');
  }
} else {
  console.log('Android platform already exists, skipping add.');
}

// 2. Create network_security_config.xml
const resXmlPath = path.join('android', 'app', 'src', 'main', 'res', 'xml');
if (!fs.existsSync(resXmlPath)) {
  fs.mkdirSync(resXmlPath, { recursive: true });
}

const networkConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>`;

fs.writeFileSync(path.join(resXmlPath, 'network_security_config.xml'), networkConfig);
console.log('Created network_security_config.xml');

// 3. Patch AndroidManifest.xml
const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  // Add permissions if not present
  if (!manifest.includes('android.permission.CAMERA')) {
    manifest = manifest.replace(
      '<application',
      '<uses-permission android:name="android.permission.CAMERA" />\n    <application'
    );
  }

  // Add networkSecurityConfig attribute
  if (!manifest.includes('android:networkSecurityConfig')) {
    manifest = manifest.replace(
      '<application',
      '<application android:networkSecurityConfig="@xml/network_security_config"'
    );
  }

  fs.writeFileSync(manifestPath, manifest);
  console.log('Patched AndroidManifest.xml');
} else {
  console.log('AndroidManifest.xml not found, skipping patch.');
}
