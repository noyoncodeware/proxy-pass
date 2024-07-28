const fs = require('fs')
const path = require('path')

function generateAppConfig(numOfInstances) {
  const appConfigs = []
  const envVars = loadEnv('.env') // Load environment variables from .env

  console.log('envVars')
  console.log(envVars)

  const postStartFrom = Number(envVars.PORT_START_FROM) || 5000
  numOfInstances =
    typeof numOfInstances === 'number' ? numOfInstances : Number(envVars.NUM_OF_INSTANCES) || 0

  // apps
  for (let i = 0; i <= numOfInstances; i++) {
    const port = postStartFrom + i // Calculate port based on instance index
    const appName = `app${port}` // Generate app name based on port

    const appConfig = {
      name: appName,
      script: './index.js',
      interpreter_args: '--max-old-space-size=1072',
      interpreter: '/root/.nvm/versions/node/v20.9.0/bin/bun',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        ...envVars,
        PORT: port
      }
    }
    appConfigs.push(appConfig)
  }
  return appConfigs
}

// utils
function loadEnv(filePath) {
  const absoluteFilePath = path.resolve(__dirname, filePath)

  if (fs.existsSync(absoluteFilePath)) {
    const text = fs.readFileSync(absoluteFilePath, 'utf-8')

    return text
      .split('\n')
      .map((item) => item.replace(/#.*/, ''))
      .filter((item) => item.includes('='))
      .reduce((map, item) => {
        const [key, value] = item.split('=')
        map[key.trim()] = value.trim().replace(/^(["'])(.*)\1$/, '$2')
        return map
      }, {})
  }
}

module.exports = {
  apps: generateAppConfig()
}
