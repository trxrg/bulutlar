import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const installDependencies = () => {
  console.log('Installing dependencies...');
  const projectRoot = path.resolve(__dirname);
  const command = 'npm install --force --production';

  console.log('Command:', command);
  console.log('Project root:', projectRoot);

  exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing dependencies: ${error.message}`);
      process.exit(1);
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    if (stdout) {
      console.log(`stdout: ${stdout}`);
    }
    console.log('Dependencies installed successfully!');
    process.exit(0);
  });
};

installDependencies();