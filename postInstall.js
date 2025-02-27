const { exec } = require('child_process');
const path = require('path');

const installDependencies = () => {
  const projectRoot = path.resolve(__dirname);
  const command = 'npm install --force --production';

  exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing dependencies: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

installDependencies();