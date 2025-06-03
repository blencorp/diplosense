#!/usr/bin/env node

/**
 * Debug Test Runner
 * Provides utilities for debugging test failures and analyzing component behavior
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runTests(pattern = '', options = {}) {
  log('\n🧪 Running DiploSense Tests', 'bright')
  log('================================', 'cyan')
  
  let command = 'npm test'
  
  if (pattern) {
    command += ` -- --testNamePattern="${pattern}"`
  }
  
  if (options.watch) {
    command += ' -- --watch'
  }
  
  if (options.coverage) {
    command += ' -- --coverage'
  }
  
  if (options.verbose) {
    command += ' -- --verbose'
  }
  
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() })
  } catch (error) {
    log(`\n❌ Tests failed with exit code: ${error.status}`, 'red')
    process.exit(error.status)
  }
}

function debugComponent(componentName) {
  log(`\n🔍 Debugging ${componentName} Component`, 'bright')
  log('==========================================', 'cyan')
  
  const testFiles = [
    `src/components/__tests__/${componentName}.test.tsx`,
    `src/app/__tests__/${componentName}.test.tsx`,
    `__tests__/${componentName}.test.ts`
  ]
  
  const existingTests = testFiles.filter(file => fs.existsSync(file))
  
  if (existingTests.length === 0) {
    log(`❌ No test files found for ${componentName}`, 'red')
    log('Available test files:', 'yellow')
    
    // List all test files
    const testDir = 'src/components/__tests__'
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir)
      files.forEach(file => log(`  - ${file}`, 'blue'))
    }
    return
  }
  
  log(`✅ Found test files:`, 'green')
  existingTests.forEach(file => log(`  - ${file}`, 'blue'))
  
  // Run tests for this component with verbose output
  const testPattern = componentName.toLowerCase()
  log(`\n🏃 Running tests for ${componentName}...`, 'yellow')
  
  runTests(testPattern, { verbose: true })
}

function generateTestReport() {
  log('\n📊 Generating Test Report', 'bright')
  log('==========================', 'cyan')
  
  try {
    // Run tests with coverage
    execSync('npm run test:coverage -- --silent', { stdio: 'inherit' })
    
    log('\n✅ Test report generated in coverage/ directory', 'green')
    log('Open coverage/lcov-report/index.html to view detailed coverage', 'blue')
    
  } catch (error) {
    log('❌ Failed to generate test report', 'red')
  }
}

function checkTestSetup() {
  log('\n⚙️  Checking Test Setup', 'bright')
  log('=======================', 'cyan')
  
  const requiredFiles = [
    'jest.config.js',
    'jest.setup.js',
    'src/test-utils/mockData.ts',
    'src/test-utils/testUtils.tsx'
  ]
  
  const requiredDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'jest',
    'jest-environment-jsdom'
  ]
  
  log('📁 Checking required files:', 'yellow')
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`  ✅ ${file}`, 'green')
    } else {
      log(`  ❌ ${file} (missing)`, 'red')
    }
  })
  
  log('\n📦 Checking dependencies:', 'yellow')
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      log(`  ✅ ${dep} (${allDeps[dep]})`, 'green')
    } else {
      log(`  ❌ ${dep} (missing)`, 'red')
    }
  })
}

function watchMode() {
  log('\n👀 Starting Watch Mode', 'bright')
  log('=====================', 'cyan')
  log('Tests will re-run automatically when files change', 'blue')
  log('Press "q" to quit, "a" to run all tests', 'yellow')
  
  runTests('', { watch: true })
}

function listTests() {
  log('\n📋 Available Test Suites', 'bright')
  log('=========================', 'cyan')
  
  const testDirs = [
    'src/components/__tests__',
    'src/app/__tests__', 
    '__tests__'
  ]
  
  testDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      log(`\n📁 ${dir}:`, 'yellow')
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
          const testName = file.replace(/\.(test|spec)\.(tsx?|jsx?)$/, '')
          log(`  🧪 ${testName}`, 'blue')
        }
      })
    }
  })
}

function showHelp() {
  log('\n🚀 DiploSense Test Debug Utility', 'bright')
  log('=================================', 'cyan')
  log('')
  log('Usage: node scripts/test-debug.js [command] [options]', 'blue')
  log('')
  log('Commands:', 'yellow')
  log('  run [pattern]     Run tests (optionally filter by pattern)')
  log('  debug <component> Debug specific component tests')
  log('  watch            Run tests in watch mode')
  log('  coverage         Generate coverage report')
  log('  setup            Check test setup and dependencies')
  log('  list             List all available test suites')
  log('  help             Show this help message')
  log('')
  log('Examples:', 'green')
  log('  node scripts/test-debug.js run Dashboard')
  log('  node scripts/test-debug.js debug Dashboard')
  log('  node scripts/test-debug.js watch')
  log('  node scripts/test-debug.js coverage')
  log('')
}

// Parse command line arguments
const args = process.argv.slice(2)
const command = args[0] || 'help'

switch (command) {
  case 'run':
    runTests(args[1], { verbose: true })
    break
  case 'debug':
    if (!args[1]) {
      log('❌ Please specify a component name', 'red')
      log('Example: node scripts/test-debug.js debug Dashboard', 'blue')
      process.exit(1)
    }
    debugComponent(args[1])
    break
  case 'watch':
    watchMode()
    break
  case 'coverage':
    generateTestReport()
    break
  case 'setup':
    checkTestSetup()
    break
  case 'list':
    listTests()
    break
  case 'help':
  default:
    showHelp()
    break
}