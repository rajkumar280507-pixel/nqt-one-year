import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '../temp_submissions');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Python import whitelisting
const PYTHON_WHITELIST = ['math', 'collections', 'heapq', 'bisect', 'itertools', 'functools', 're', 'sys'];

function validatePythonCode(code) {
  // Simple regex check for imports
  const importRegex = /(?:from\s+(\w+)\s+import|import\s+([\w\s,]+))/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const modules = (match[1] || match[2]).split(',').map(m => m.trim());
    for (const mod of modules) {
      // Handles sub-imports like 'collections.deque'
      const baseMod = mod.split('.')[0];
      if (!PYTHON_WHITELIST.includes(baseMod)) {
        return { valid: false, error: `Import of module '${baseMod}' is not allowed for security reasons.` };
      }
    }
  }
  return { valid: true };
}

function validateJavaCode(code) {
  const forbiddenPatterns = [
    'java.io.File',
    'java.nio.file',
    'ProcessBuilder',
    'Runtime.getRuntime',
    'System.exit',
    'ClassLoader',
    'Reflect'
  ];
  for (const pattern of forbiddenPatterns) {
    if (code.includes(pattern)) {
      return { valid: false, error: `Use of '${pattern}' is restricted for security reasons.` };
    }
  }
  return { valid: true };
}

function validateCppCode(code) {
  const forbiddenPatterns = [
    'system(',
    'popen(',
    'fork(',
    'std::system',
    '<fstream>',
    '<filesystem>'
  ];
  for (const pattern of forbiddenPatterns) {
    if (code.includes(pattern)) {
      return { valid: false, error: `Use of restricted system call or file operation is not allowed.` };
    }
  }
  return { valid: true };
}

export async function runCode(language, source, problem) {
  const submissionId = Math.random().toString(36).substring(2, 9);
  const testCases = [...problem.sample_tests_json, ...problem.hidden_tests_json];
  let passedCount = 0;
  const results = [];

  // Security checks
  if (language === 'python' || language === 'python3') {
    const validation = validatePythonCode(source);
    if (!validation.valid) {
      return { passed: false, passed_count: 0, total_count: testCases.length, error: validation.error };
    }
  } else if (language === 'java') {
    const validation = validateJavaCode(source);
    if (!validation.valid) {
      return { passed: false, passed_count: 0, total_count: testCases.length, error: validation.error };
    }
  } else if (language === 'cpp' || language === 'c') {
    const validation = validateCppCode(source);
    if (!validation.valid) {
      return { passed: false, passed_count: 0, total_count: testCases.length, error: validation.error };
    }
  }

  // Create workspace files
  let filename = '';
  let runCmd = '';
  let compileCmd = '';

  const cleanLang = language.toLowerCase();

  try {
    if (cleanLang === 'python' || cleanLang === 'python3') {
      filename = `solution_${submissionId}.py`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, source);
      // Run with python or python3 depending on system
      const hasPython3 = tryCommand('python3 --version');
      runCmd = `${hasPython3 ? 'python3' : 'python'} "${filePath}"`;
    } else if (cleanLang === 'cpp' || cleanLang === 'c') {
      const ext = cleanLang === 'cpp' ? 'cpp' : 'c';
      filename = `solution_${submissionId}.${ext}`;
      const binaryName = `solution_${submissionId}`;
      const filePath = path.join(tempDir, filename);
      const binaryPath = path.join(tempDir, binaryName);
      fs.writeFileSync(filePath, source);
      
      const compiler = cleanLang === 'cpp' ? 'g++' : 'gcc';
      compileCmd = `${compiler} -O2 "${filePath}" -o "${binaryPath}"`;
      runCmd = `"${binaryPath}"`;
    } else if (cleanLang === 'java') {
      // Find ClassName in source or use a default class
      const classMatch = source.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : 'Solution';
      
      // We must write java code in a file named after the public class
      filename = `${className}.java`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, source);

      compileCmd = `javac "${filePath}"`;
      runCmd = `java -cp "${tempDir}" ${className}`;
    } else {
      return { passed: false, passed_count: 0, total_count: testCases.length, error: `Unsupported language: ${language}` };
    }

    // Compile if necessary
    if (compileCmd) {
      try {
        await execPromise(compileCmd, { timeout: 8000 });
      } catch (compileErr) {
        return {
          passed: false,
          passed_count: 0,
          total_count: testCases.length,
          error: `Compilation Error:\n${compileErr.stderr || compileErr.message}`
        };
      }
    }

    // Execute test cases
    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      const input = test.input;
      const expectedOutput = test.output.trim();

      try {
        const child = exec(runCmd, { timeout: 3000, killSignal: 'SIGKILL' });
        
        const outputPromise = new Promise((resolve, reject) => {
          let stdout = '';
          let stderr = '';

          child.stdout.on('data', (data) => {
            stdout += data;
            if (stdout.length > 10240) { // 10 KB limit
              child.kill('SIGKILL');
              reject(new Error('Output limit exceeded (10KB)'));
            }
          });

          child.stderr.on('data', (data) => {
            stderr += data;
          });

          child.on('close', (code, signal) => {
            if (signal === 'SIGKILL') {
              reject(new Error('Time limit exceeded (3 seconds)'));
            } else if (code !== 0 && stderr) {
              reject(new Error(stderr));
            } else {
              resolve(stdout);
            }
          });

          child.on('error', (err) => {
            reject(err);
          });
        });

        // Write input to stdin
        if (input) {
          child.stdin.write(input);
          if (!input.endsWith('\n')) {
            child.stdin.write('\n');
          }
        }
        child.stdin.end();

        const rawOutput = await outputPromise;
        const actualOutput = rawOutput.trim();

        const isCorrect = actualOutput === expectedOutput;
        if (isCorrect) {
          passedCount++;
        }

        results.push({
          testCaseIndex: i,
          input: i < 3 ? input : '[Hidden]',
          expected: i < 3 ? expectedOutput : '[Hidden]',
          actual: i < 3 ? actualOutput : '[Hidden]',
          passed: isCorrect
        });

      } catch (err) {
        results.push({
          testCaseIndex: i,
          input: i < 3 ? input : '[Hidden]',
          expected: i < 3 ? expectedOutput : '[Hidden]',
          actual: `Error: ${err.message}`,
          passed: false
        });
      }
    }

    return {
      passed: passedCount === testCases.length,
      passed_count: passedCount,
      total_count: testCases.length,
      results
    };

  } catch (err) {
    return { passed: false, passed_count: 0, total_count: testCases.length, error: err.message };
  } finally {
    // Cleanup files
    try {
      if (cleanLang === 'python' || cleanLang === 'python3') {
        const p = path.join(tempDir, filename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } else if (cleanLang === 'cpp' || cleanLang === 'c') {
        const p = path.join(tempDir, filename);
        const b = path.join(tempDir, `solution_${submissionId}`);
        const bexe = path.join(tempDir, `solution_${submissionId}.exe`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
        if (fs.existsSync(b)) fs.unlinkSync(b);
        if (fs.existsSync(bexe)) fs.unlinkSync(bexe);
      } else if (cleanLang === 'java') {
        // Remove class files and java files
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          if (file.includes(submissionId) || file.endsWith('.class') || file.endsWith('.java')) {
            try {
              fs.unlinkSync(path.join(tempDir, file));
            } catch (e) {}
          }
        }
      }
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }
  }
}

function tryCommand(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}
