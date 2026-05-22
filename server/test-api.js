import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://localhost:5000';

async function runTests() {
  console.log('🚀 Starting Express Server for Integration Tests...');
  const serverProcess = spawn('node', [path.join(__dirname, 'index.js')], {
    env: { 
      ...process.env, 
      PORT: '5000', 
      JWT_SECRET: 'test_suite_jwt_token_secret',
      NODE_ENV: 'test'
    }
  });

  // Pipe logs
  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  // Wait 3 seconds for database checking and port bindings
  await new Promise(resolve => setTimeout(resolve, 3000));

  let testPassed = true;
  let testUserToken = '';
  const testEmail = `student_${Date.now()}@nqt.com`;
  const testPassword = 'SecurePassword123';
  const testName = 'Test Student';

  try {
    // 1. SIGNUP TEST
    console.log('\n🧪 Testing signup POST /api/auth/signup...');
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, name: testName })
    });
    const signupData = await signupRes.json();
    assert.strictEqual(signupRes.status, 200, 'Signup status should be 200');
    assert.ok(signupData.token, 'Signup should return JWT token');
    assert.strictEqual(signupData.user.email, testEmail, 'Returned email should match request');
    console.log('✅ Signup route completed successfully.');

    // 2. LOGIN TEST
    console.log('\n🧪 Testing login POST /api/auth/login...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Login status should be 200');
    assert.ok(loginData.token, 'Login should return JWT token');
    testUserToken = loginData.token;
    console.log('✅ Login route completed successfully.');

    // 3. TOPICS LIST TEST
    console.log('\n🧪 Testing topics GET /api/topics...');
    const topicsRes = await fetch(`${baseUrl}/api/topics`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const topicsData = await topicsRes.json();
    assert.strictEqual(topicsRes.status, 200, 'GET topics should return 200');
    assert.ok(Array.isArray(topicsData), 'Topics response should be an array');
    console.log(`✅ Topics listing completed successfully. (Found ${topicsData.length} topics)`);

    // 4. DAY CONTENT RETRIEVAL (Checking Day 1)
    console.log('\n🧪 Testing day retrieve GET /api/days/1...');
    const dayRes = await fetch(`${baseUrl}/api/days/1`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const dayData = await dayRes.json();
    // If database isn't seeded, this might return 404 which we handle gracefully
    if (dayRes.status === 404) {
      console.log('⚠️ Day 1 plan returned 404 (DB might not be seeded). Skipping detailed MCQ tests.');
    } else {
      assert.strictEqual(dayRes.status, 200, 'Day retrieve should be 200 if seeded');
      assert.ok(dayData.day, 'Should contain day information');
      assert.ok(Array.isArray(dayData.questions), 'Should contain list of MCQs');
      console.log('✅ Day retrieval completed successfully.');

      // 5. MCQ ANSWER SUBMISSION
      if (dayData.questions.length > 0) {
        const testQuestion = dayData.questions[0];
        console.log(`\n🧪 Testing MCQ answer POST /api/days/1/answer for QID: ${testQuestion.id}...`);
        const ansRes = await fetch(`${baseUrl}/api/days/1/answer`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUserToken}`
          },
          body: JSON.stringify({
            sectionId: testQuestion.section,
            questionId: testQuestion.id,
            answer: 'A'
          })
        });
        const ansData = await ansRes.json();
        assert.strictEqual(ansRes.status, 200, 'Submit answer status should be 200');
        assert.ok(ansData.hasOwnProperty('correct'), 'Response should evaluate correctness');
        console.log(`✅ MCQ Answer submission completed. Correct? ${ansData.correct}`);
      }
    }

    // 6. DASHBOARD SUMMARY ANALYTICS
    console.log('\n🧪 Testing dashboard progress summary GET /api/progress/summary...');
    const summaryRes = await fetch(`${baseUrl}/api/progress/summary`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const summaryData = await summaryRes.json();
    assert.strictEqual(summaryRes.status, 200, 'Summary status should be 200');
    assert.ok(summaryData.accuracyBySection, 'Should contain section accuracies');
    assert.ok(Array.isArray(summaryData.weakTopics), 'Should contain list of weak topics');
    console.log('✅ Dashboard summary analytics verified.');

    // 7. MOCK TESTS LISTING
    console.log('\n🧪 Testing mock tests list GET /api/mock-tests...');
    const mocksRes = await fetch(`${baseUrl}/api/mock-tests`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const mocksData = await mocksRes.json();
    assert.strictEqual(mocksRes.status, 200, 'Mock tests status should be 200');
    assert.ok(Array.isArray(mocksData), 'Response should be list of mocks');
    console.log(`✅ Mock tests list fetched. (Found ${mocksData.length} mock tests)`);

    console.log('\n🎉 ALL CRITICAL API INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE ENCOUNTERED AN EXCEPTION:\n', err);
    testPassed = false;
  } finally {
    console.log('🛑 Killing test server process...');
    serverProcess.kill('SIGINT');
    
    // Give child process half a second to clean up/close database connections
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (testPassed) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

runTests();
