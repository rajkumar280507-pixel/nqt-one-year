import db from './db.js';

const SECTIONS = {
  APTITUDE: 'Aptitude',
  REASONING: 'Reasoning',
  VERBAL: 'Verbal',
  PROGRAMMING: 'Programming Logic',
  CODING: 'Coding'
};

const TOPICS_DATA = [
  // Month 1
  { month: 1, section: SECTIONS.APTITUDE, name: 'Number System', definition: 'Study of integers, prime numbers, rational numbers, cyclicity, unit digit calculations, and basic division algorithms.' },
  { month: 1, section: SECTIONS.APTITUDE, name: 'LCM & HCF', definition: 'Least Common Multiple and Highest Common Factor, their relationships, and application in solving division word problems.' },
  { month: 1, section: SECTIONS.APTITUDE, name: 'Divisibility Rules', definition: 'Shortcuts to determine whether a given integer is divisible by a fixed divisor without performing full division.' },
  { month: 1, section: SECTIONS.APTITUDE, name: 'Decimal Fractions', definition: 'Representation of fractions in decimal format, recurring decimals, and arithmetic operations on decimals.' },
  { month: 1, section: SECTIONS.APTITUDE, name: 'Power & Roots', definition: 'Indices, exponent laws, square roots, cube roots, surds and indices simplifications.' },
  { month: 1, section: SECTIONS.APTITUDE, name: 'BODMAS Rule', definition: 'Order of operations (Brackets, Orders, Division, Multiplication, Addition, Subtraction) to solve arithmetic expressions.' },
  { month: 1, section: SECTIONS.VERBAL, name: 'Synonyms & Antonyms', definition: 'Understanding lexical meanings, identifying words with similar and opposite meanings in context.' },
  { month: 1, section: SECTIONS.VERBAL, name: 'Sentence Correction', definition: 'Grammar checking, identifying tense issues, subject-verb agreement, modifiers, and word placement errors.' },
  { month: 1, section: SECTIONS.PROGRAMMING, name: 'C & Python Syntax Basics', definition: 'Understanding basic structural layout, data types, inputs/outputs, and operators in C and Python.' },
  { month: 1, section: SECTIONS.CODING, name: '1-D Arrays Traversal', definition: 'Iterating through single-dimensional arrays, finding maximum, minimum, sum, average, searching and reversing.' },

  // Month 2
  { month: 2, section: SECTIONS.APTITUDE, name: 'Percentages', definition: 'Expressing numbers as fractions of 100, calculations of percentage increase/decrease, salary problems.' },
  { month: 2, section: SECTIONS.APTITUDE, name: 'Profit & Loss', definition: 'Cost price, selling price, marked price, discount rates, profit/loss percentage calculations, and dishonest dealer cases.' },
  { month: 2, section: SECTIONS.APTITUDE, name: 'Ratio & Proportion', definition: 'Comparing two quantities, duplicate ratios, mean proportional, and partnership distributions.' },
  { month: 2, section: SECTIONS.APTITUDE, name: 'Averages', definition: 'Arithmetic mean, weighted averages, consecutive number series averages, and group adjustment problems.' },
  { month: 2, section: SECTIONS.APTITUDE, name: 'Ages Problems', definition: 'Solving age relations between family members across past, present, and future timeframes.' },
  { month: 2, section: SECTIONS.REASONING, name: 'Coding-Decoding', definition: 'Identifying alphanumeric shifts, positional values, and substitution patterns to translate code words.' },
  { month: 2, section: SECTIONS.REASONING, name: 'Blood Relations', definition: 'Decoding family trees, coding relations (e.g., A+B means A is mother of B), and identifying specific member connections.' },
  { month: 2, section: SECTIONS.REASONING, name: 'Direction Sense', definition: 'Navigating directions, degrees of rotations, and calculating the shortest distance using Pythagoras theorem.' },
  { month: 2, section: SECTIONS.REASONING, name: 'Series Completion', definition: 'Number series, letter series, and alphanumeric series matching mathematical sequence logic.' },
  { month: 2, section: SECTIONS.PROGRAMMING, name: 'Loops and Control Flow', definition: 'For, while, and do-while loops, break/continue statements, nested loops, and loop iteration analysis.' },
  { month: 2, section: SECTIONS.CODING, name: 'String Operations', definition: 'String manipulation, length calculation, reversals, palindrome verification, and anagram checks.' },

  // Month 3
  { month: 3, section: SECTIONS.APTITUDE, name: 'Time & Work', definition: 'Work efficiency, man-hours calculations, wages distribution, and joint completion rate formulas.' },
  { month: 3, section: SECTIONS.APTITUDE, name: 'Pipes & Cisterns', definition: 'Inlet and outlet flow rates, negative work of leakages, and tank filling/emptying intervals.' },
  { month: 3, section: SECTIONS.APTITUDE, name: 'Time, Speed & Distance', definition: 'Speed conversions, average speed formula, relative speed, and crossing scenarios.' },
  { month: 3, section: SECTIONS.APTITUDE, name: 'Trains crossing', definition: 'Calculating time taken for trains of different lengths to cross stationary objects, platforms, or other moving trains.' },
  { month: 3, section: SECTIONS.APTITUDE, name: 'Boats & Streams', definition: 'Downstream speed, upstream speed, speed of boat in still water, and speed of current calculations.' },
  { month: 3, section: SECTIONS.APTITUDE, name: 'Permutations & Combinations', definition: 'Fundamental principles of counting, arrangement formulas (nPr), and selection formulas (nCr).' },
  { month: 3, section: SECTIONS.APTITUDE, name: 'Probability Intro', definition: 'Basic concepts, sample spaces, coin tosses, card decks, and independent event probability calculations.' },
  { month: 3, section: SECTIONS.REASONING, name: 'Statement & Assumption', definition: 'Analyzing statements to identify underlying premises that are taken for granted without proof.' },
  { month: 3, section: SECTIONS.REASONING, name: 'Statement & Conclusion', definition: 'Drawing valid, direct logical deductions from given statement details without making external assumptions.' },
  { month: 3, section: SECTIONS.REASONING, name: 'Cause & Effect', definition: 'Determining which event is the cause and which is the effect, or if both are effects of independent/common causes.' },
  { month: 3, section: SECTIONS.REASONING, name: 'Syllogism', definition: 'Categorical propositions, Venn diagram analysis, and verifying truth validity of conclusions.' },
  { month: 3, section: SECTIONS.PROGRAMMING, name: 'Functions & Scope', definition: 'Function declarations, definitions, parameter passing (value vs reference), recursion, static variables, and scopes.' },
  { month: 3, section: SECTIONS.CODING, name: '2-D Arrays & Matrices', definition: 'Two-dimensional grid operations, matrix traversal, rotation by 90 degrees, transposition, and spiral outputs.' },

  // Month 4
  { month: 4, section: SECTIONS.APTITUDE, name: 'Lines & Angles', definition: 'Parallel lines, transversal lines, alternate angles, corresponding angles, and basic polygon angle sums.' },
  { month: 4, section: SECTIONS.APTITUDE, name: 'Triangles Geometry', definition: 'Congruency, similarity, Pythagoras theorem, equilateral, isosceles, and scalene triangle properties.' },
  { month: 4, section: SECTIONS.APTITUDE, name: 'Circles Geometry', definition: 'Chords, secants, tangents, sector area, segment calculations, and cyclic quadrilateral theorems.' },
  { month: 4, section: SECTIONS.APTITUDE, name: 'Area Mensuration', definition: 'Calculations of perimeter and area of 2D shapes: rectangles, squares, parallelograms, trapeziums.' },
  { month: 4, section: SECTIONS.APTITUDE, name: 'Volume & Surface Area', definition: 'Calculations of volume, lateral and total surface area of 3D shapes: cubes, cuboids, cylinders, cones, spheres.' },
  { month: 4, section: SECTIONS.APTITUDE, name: 'Data Tables Analysis', definition: 'Interpreting rows and columns of structured data, calculating percentage shares and compound annual growth rates.' },
  { month: 4, section: SECTIONS.APTITUDE, name: 'Pie Charts Analysis', definition: 'Converting degrees to percentages, absolute value calculations, and fractional sector shares.' },
  { month: 4, section: SECTIONS.APTITUDE, name: 'Bar Graphs Analysis', definition: 'Comparing visual bar heights, tracking year-on-year variations, and calculating average performances.' },
  { month: 4, section: SECTIONS.VERBAL, name: 'Reading Comprehension', definition: 'Answering questions based on implicit and explicit text detail, identifying author tone, and main thesis.' },
  { month: 4, section: SECTIONS.VERBAL, name: 'Para Jumbles', definition: 'Arranging jumbled sentences in a logical order to form a cohesive, readable paragraph.' },
  { month: 4, section: SECTIONS.VERBAL, name: 'Fill in the Blanks', definition: 'Cloze tests, prepositions, tenses, vocabulary contexts, and selecting matching double blanks.' },
  { month: 4, section: SECTIONS.PROGRAMMING, name: 'Pointers & Memory Layout', definition: 'Pointer arithmetic, pointers to pointers, array-pointer relationships, reference variables, and stack vs heap allocation.' },
  { month: 4, section: SECTIONS.CODING, name: 'Searching & Sorting', definition: 'Linear search, binary search, bubble sort, selection sort, and insertion sort implementations.' },

  // Month 5 (Advanced Aptitude + Pseudo Code)
  { month: 5, section: SECTIONS.APTITUDE, name: 'Mixtures & Alligation', definition: 'Combining substances of different values to produce a mixture of average price, and concentration dilution ratios.' },
  { month: 5, section: SECTIONS.APTITUDE, name: 'Simple & Compound Interest', definition: 'Simple interest, compound interest compounded annually/half-yearly, difference between SI and CI, and installment payouts.' },
  { month: 5, section: SECTIONS.APTITUDE, name: 'Clocks & Calendars', definition: 'Angle between hands of clock, clock gains/losses, day of week calculation using odd days, and leap year cycles.' },
  { month: 5, section: SECTIONS.PROGRAMMING, name: 'Advanced Pseudo-Code', definition: 'Interpreting pseudo-code logic, control sequences, variable scopes, and operations common in TCS NQT Advanced section.' },
  { month: 5, section: SECTIONS.CODING, name: 'Linked Lists Basics', definition: 'Singly linked list structures, node insertion, deletion, and list traversal.' },

  // Month 6 (Permutations deep + Stacks/Queues)
  { month: 6, section: SECTIONS.APTITUDE, name: 'Advanced P&C and Probability', definition: 'Conditional probability, circular permutations, Bayes theorem, and binomial distribution.' },
  { month: 6, section: SECTIONS.REASONING, name: 'Critical Reasoning', definition: 'Analyzing logical arguments to strengthen or weaken claims, identifying underlying flaws, and evaluating conclusions.' },
  { month: 6, section: SECTIONS.CODING, name: 'Stacks & Queues', definition: 'LIFO and FIFO operations, balanced parentheses, and queue implementation using stacks.' },

  // Month 7 (OOP, DBMS, OS + Trees)
  { month: 7, section: SECTIONS.PROGRAMMING, name: 'OOP, DBMS & OS Basics', definition: 'Core object-oriented principles, database schemas/SQL, process states, and OS CPU scheduling.' },
  { month: 7, section: SECTIONS.CODING, name: 'Trees & Binary Search Trees', definition: 'Tree representations, inorder, preorder, postorder traversals, and BST operations.' },

  // Month 8 (Hashing + Sliding Window)
  { month: 8, section: SECTIONS.CODING, name: 'Hashing & Sliding Window', definition: 'Hash maps, collision resolution, two-pointer techniques, and sliding window maximum/minimum patterns.' },

  // Month 9 (Greedy & Backtracking)
  { month: 9, section: SECTIONS.CODING, name: 'Greedy & Backtracking', definition: 'Optimal choice strategy, fractional knapsack, N-Queens placement, and backtracking templates.' },

  // Month 10 (Dynamic Programming)
  { month: 10, section: SECTIONS.CODING, name: 'Dynamic Programming', definition: 'Memoization, tabulation, 1D and 2D DP, Longest Common Subsequence, and Coin Change.' },

  // Month 11 (Graphs)
  { month: 11, section: SECTIONS.CODING, name: 'Graphs', definition: 'Adjacency list, BFS, DFS, Dijkstra shortest path, and topological sorting.' },

  // Month 12 (Revision & Speed Drills)
  { month: 12, section: SECTIONS.CODING, name: 'Exam Speed Drills', definition: 'Speed optimization, comprehensive mock reviews, and tackling advanced mixed problems under timed conditions.' }
];

const VOCAB_TEMPLATES = [
  { term: 'Alligation', meaning: 'A rule that enables to find the ratio in which two or more ingredients at the given price must be mixed to produce a mixture of a specified price.' },
  { term: 'Compound Interest', meaning: 'Interest calculated on the initial principal, which also includes all of the accumulated interest from previous periods.' },
  { term: 'Divisibility', meaning: 'The property of an integer being divisible by another integer without leaving a remainder.' },
  { term: 'Cyclicity', meaning: 'The repetition pattern of the units digit of numbers when raised to positive integer powers.' },
  { term: 'HCF', meaning: 'Highest Common Factor - the largest positive integer that divides two or more integers without leaving a remainder.' },
  { term: 'Syllogism', meaning: 'A form of logical argument in which a conclusion is drawn from two or more given premises.' },
  { term: 'Premise', meaning: 'A proposition which is assumed to be true and from which a conclusion is drawn.' },
  { term: 'Pointer', meaning: 'A variable that stores the memory address of another variable.' },
  { term: 'Recursion', meaning: 'A programming technique where a function calls itself directly or indirectly to solve a problem.' },
  { term: 'Memoization', meaning: 'An optimization technique used primarily to speed up computer programs by storing the results of expensive function calls.' }
];

const SYNONYMS_LIST = [
  { word: 'Abundant', options: ['Scarce', 'Plentiful', 'Meager', 'Limited'], correct: 'Plentiful', exp: 'Abundant means existing or available in large quantities; overflowing. Plentiful is the closest synonym.' },
  { word: 'Prudent', options: ['Careless', 'Wise', 'Rash', 'Impulsive'], correct: 'Wise', exp: 'Prudent means showing care and thought for the future. Wise matches this definition closely.' },
  { word: 'Benevolent', options: ['Cruel', 'Kind', 'Selfish', 'Hostile'], correct: 'Kind', exp: 'Benevolent means well-meaning and kindly. Kind is a direct synonym.' },
  { word: 'Capricious', options: ['Stable', 'Unpredictable', 'Consistent', 'Decisive'], correct: 'Unpredictable', exp: 'Capricious means given to sudden and unaccountable changes of mood or behavior.' },
  { word: 'Exquisite', options: ['Ordinary', 'Beautiful', 'Ugly', 'Coarse'], correct: 'Beautiful', exp: 'Exquisite means extremely beautiful and delicate.' },
  { word: 'Frugal', options: ['Extravagant', 'Thrifty', 'Wasteful', 'Generous'], correct: 'Thrifty', exp: 'Frugal means sparing or economical with regard to money or food. Thrifty is a direct synonym.' },
  { word: 'Gullible', options: ['Skeptical', 'Trusting', 'Astute', 'Suspicious'], correct: 'Trusting', exp: 'Gullible means easily persuaded to believe something. Trusting is a close synonym.' },
  { word: 'Hinder', options: ['Facilitate', 'Obstruct', 'Assist', 'Promote'], correct: 'Obstruct', exp: 'To hinder is to make it difficult for someone to do something. Obstruct is a direct synonym.' },
  { word: 'Lethargic', options: ['Energetic', 'Sluggish', 'Active', 'Vibrant'], correct: 'Sluggish', exp: 'Lethargic means affected by lethargy; sluggish and apathetic.' },
  { word: 'Mitigate', options: ['Aggravate', 'Alleviate', 'Enhance', 'Prolong'], correct: 'Alleviate', exp: 'Mitigate means make less severe, serious, or painful. Alleviate is a direct synonym.' }
];

const SENTENCE_CORRECTIONS = [
  { text: "Neither the teacher nor the students is present in the classroom.", options: ["Neither the teacher nor the students is present", "Neither the teacher nor the students are present", "Either the teacher nor the students are present", "Neither the teacher or the students is present"], correct: "Neither the teacher nor the students are present", exp: "When a singular and plural subject are joined by 'neither...nor', the verb agrees with the closer subject ('students', which is plural, hence 'are')." },
  { text: "He has been working in this company since five years.", options: ["since five years", "for five years", "from five years", "during five years"], correct: "for five years", exp: "'For' is used to denote a duration/period of time, while 'since' is used for a specific starting point in time." },
  { text: "If I was you, I would accept the job offer immediately.", options: ["If I was you", "If I am you", "If I were you", "If I would be you"], correct: "If I were you", exp: "In subjunctive mood (contrary-to-fact conditional clauses), 'were' is used regardless of the subject." }
];

async function seed() {
  console.log('Starting seed process...');
  try {
    // Clear existing data
    console.log('Clearing database tables...');
    await db.query('TRUNCATE user_mock_attempts, mock_tests, user_code_submissions, user_progress, coding_problems, questions, days, vocabulary, topics, users CASCADE');
    console.log('Database cleared.');

    // 1. Insert Topics
    console.log('Inserting topics...');
    const topicMap = {};
    for (const t of TOPICS_DATA) {
      const result = await db.query(
        'INSERT INTO topics (section, name, definition) VALUES ($1, $2, $3) RETURNING id',
        [t.section, t.name, t.definition]
      );
      const insertedId = result.rows[0].id;
      topicMap[`${t.section}:${t.name}`] = insertedId;
      topicMap[t.name] = insertedId; // convenience mapping
    }
    console.log(`Seeded ${TOPICS_DATA.length} topics.`);

    // 2. Insert Vocabulary
    console.log('Inserting vocabulary...');
    let vocabCount = 0;
    for (const [key, id] of Object.entries(topicMap)) {
      if (key.includes(':')) continue; // Skip composite keys
      
      // Seed 8 terms for each topic
      for (let idx = 1; idx <= 8; idx++) {
        const template = VOCAB_TEMPLATES[(idx - 1) % VOCAB_TEMPLATES.length];
        const term = `${key} Term ${idx} (${template.term})`;
        const meaning = `Specific definition of ${template.term} relative to ${key}. Context: ${template.meaning}`;
        const example = `Here is a context sentence implementing the term '${template.term}' in a ${key} study problem.`;
        
        await db.query(
          'INSERT INTO vocabulary (topic_id, term, meaning, example_sentence) VALUES ($1, $2, $3, $4)',
          [id, term, meaning, example]
        );
        vocabCount++;
      }
    }
    console.log(`Seeded ${vocabCount} vocabulary items.`);

    // 3. Insert 365 Days
    console.log('Inserting 365 days...');
    for (let day = 1; day <= 365; day++) {
      const month = Math.ceil(day / 30) > 12 ? 12 : Math.ceil(day / 30);
      const week = Math.ceil(day / 7);
      
      // Determine topic for this day
      // Month 1 topics rotate every 5 days
      let activeTopicName = 'Number System';
      const mTopics = TOPICS_DATA.filter(t => t.month === month);
      if (mTopics.length > 0) {
        const topicIndex = Math.floor(((day - 1) % 30) / (30 / mTopics.length)) % mTopics.length;
        activeTopicName = mTopics[topicIndex].name;
      }
      
      const topicId = topicMap[activeTopicName] || null;

      await db.query(
        'INSERT INTO days (day_number, month, week, concept_topic_id, video_url) VALUES ($1, $2, $3, $4, $5)',
        [day, month, week, topicId, `https://www.youtube.com/embed/dQw4w9WgXcQ`] // Default placeholder
      );
    }
    console.log('Seeded 365 days.');

    // 4. Generate fully-fleshed out questions (Days 1 to 120) and placeholders (121 to 365)
    console.log('Seeded questions & coding problems (generating Months 1-4 dynamically)...');
    let qCount = 0;
    let codeCount = 0;

    for (let day = 1; day <= 365; day++) {
      const isPlaceholder = day > 120;
      
      // Fetch topic id for this day
      const dayRes = await db.query('SELECT concept_topic_id FROM days WHERE day_number = $1', [day]);
      const topicId = dayRes.rows[0].concept_topic_id;

      if (isPlaceholder) {
        // Simple placeholder questions
        // Aptitude MCQ
        await db.query(`
          INSERT INTO questions (day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          day, SECTIONS.APTITUDE, 'mcq',
          `[Placeholder] Aptitude practice question for day ${day}.`,
          JSON.stringify(["Option A", "Option B", "Option C", "Option D"]),
          "Option A",
          `This is an explanation placeholder. Solve this by analyzing the concept for day ${day}.`,
          'Medium'
        ]);

        // Coding problem placeholder
        await db.query(`
          INSERT INTO coding_problems (day_number, slot, title, statement, input_format, output_format, constraints, sample_tests_json, hidden_tests_json, hint, approach, solution_code_by_lang_json, topic_id, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          day, 1, `Placeholder Coding Problem - Day ${day}`,
          `Write a program that takes an input and returns it. (Day ${day} Placeholder)`,
          `A single string.`, `The same string.`, `Length < 100`,
          JSON.stringify([{ input: "Hello", output: "Hello" }]),
          JSON.stringify([{ input: "World", output: "World" }]),
          `Just return what is given.`,
          `Simple input/output print.`,
          JSON.stringify({ python: "print(input())", cpp: "#include <iostream>\nusing namespace std;\nint main() { string s; cin >> s; cout << s; return 0; }", java: "import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner s = new Scanner(System.in);\n    System.out.println(s.nextLine());\n  }\n}" }),
          topicId, 'Easy'
        ]);
        
        qCount++;
        codeCount++;
        continue;
      }

      // MONTHS 1-4 FULL SEEDING (Days 1 to 120)
      // Generates: 3 Aptitude, 2 Reasoning, 2 Verbal, 2 Programming Logic questions + 2 Coding problems
      
      // Aptitude Questions
      for (let q = 1; q <= 3; q++) {
        let questionText = ``;
        let options = [];
        let correctAnswer = ``;
        let explanation = ``;
        
        const offset = day * q;
        const val1 = 10 + (offset % 40);
        const val2 = 5 + (offset % 15);
        
        if (day <= 30) { // Month 1: Number System/LCM/HCF/BODMAS
          if (q === 1) {
            questionText = `Find the Highest Common Factor (HCF) of ${val1 * 6} and ${val1 * 9}.`;
            options = [`${val1 * 2}`, `${val1 * 3}`, `${val1 * 4}`, `${val1 * 6}`];
            correctAnswer = `${val1 * 3}`;
            explanation = `HCF of ${val1 * 6} (which is ${val1 * 3} * 2) and ${val1 * 9} (which is ${val1 * 3} * 3) is ${val1 * 3}.`;
          } else if (q === 2) {
            questionText = `What is the units digit of ${val1 + 2}^${val2 * 4 + 1}?`;
            const base = (val1 + 2) % 10;
            const units = Math.pow(base, 1) % 10;
            options = [`${(units + 2) % 10}`, `${(units + 4) % 10}`, `${units}`, `${(units + 7) % 10}`];
            correctAnswer = `${units}`;
            explanation = `The units digit of base ${base} raised to an exponent of form 4k+1 follows cyclicity of 4. Since the exponent is 4k+1, the units digit matches ${base}^1 = ${units}.`;
          } else {
            questionText = `Evaluate the expression using BODMAS: ${val1} + ${val2 * 2} / 2 - ${val2}.`;
            const ans = val1 + val2 - val2; // val1 + val2 * 2 / 2 - val2 = val1 + val2 - val2 = val1
            options = [`${ans + 5}`, `${ans - 2}`, `${ans}`, `${ans + 10}`];
            correctAnswer = `${ans}`;
            explanation = `Apply BODMAS. First division: ${val2 * 2} / 2 = ${val2}. Next addition: ${val1} + ${val2}. Next subtraction: ${val1} + ${val2} - ${val2} = ${val1}.`;
          }
        } else if (day <= 60) { // Month 2: Percentages/Ratios/Averages/Ages
          if (q === 1) {
            questionText = `If the price of a commodity increases by ${val1}%, by what percentage should a household reduce its consumption so that the expenditure remains the same?`;
            const ansVal = ((val1 / (100 + val1)) * 100).toFixed(2);
            options = [`${ansVal}%`, `${(val1 - 2).toFixed(2)}%`, `${(val1 + 3).toFixed(2)}%`, `15.00%`];
            correctAnswer = `${ansVal}%`;
            explanation = `Formula to reduce consumption is: [R / (100 + R)] * 100. Substituting R = ${val1} gives [${val1} / ${100 + val1}] * 100 = ${ansVal}%.`;
          } else if (q === 2) {
            questionText = `Divide Rs. ${val1 * 100} among A, B, and C in the ratio 2:3:5. What is the share of C?`;
            const shareC = (val1 * 100 * 5) / 10;
            options = [`Rs. ${shareC - 50}`, `Rs. ${shareC + 100}`, `Rs. ${shareC}`, `Rs. ${(shareC * 0.6).toFixed(0)}`];
            correctAnswer = `Rs. ${shareC}`;
            explanation = `Sum of ratio terms is 2 + 3 + 5 = 10. Share of C = (5/10) * ${val1 * 100} = Rs. ${shareC}.`;
          } else {
            questionText = `The average age of a class of 10 students is ${val1} years. When a teacher joins, the average age increases by 1 year. What is the teacher's age?`;
            const teachAge = (val1 + 1) * 11 - val1 * 10;
            options = [`${teachAge - 5} years`, `${teachAge} years`, `${teachAge + 5} years`, `${teachAge - 10} years`];
            correctAnswer = `${teachAge} years`;
            explanation = `Total age of 10 students = 10 * ${val1} = ${val1 * 10}. Total age of 11 people including teacher = 11 * ${val1 + 1} = ${ (val1 + 1) * 11 }. Teacher's age = ${ (val1 + 1) * 11 } - ${val1 * 10} = ${teachAge} years.`;
          }
        } else if (day <= 90) { // Month 3: Time & Work / Time & Distance
          if (q === 1) {
            questionText = `A can complete a work in ${val1 * 2} days, and B can do it in ${val1 * 3} days. If they work together, how many days will they take?`;
            const totalD = ((val1 * 2 * val1 * 3) / (val1 * 2 + val1 * 3)).toFixed(1);
            options = [`${totalD} days`, `${(parseFloat(totalD) + 1.2).toFixed(1)} days`, `${(parseFloat(totalD) - 0.5).toFixed(1)} days`, `8.5 days`];
            correctAnswer = `${totalD} days`;
            explanation = `Combined work rate formula: (A * B) / (A + B). Substituting A = ${val1 * 2} and B = ${val1 * 3} yields (${val1 * 2} * ${val1 * 3}) / (${val1 * 2} + ${val1 * 3}) = ${totalD} days.`;
          } else if (q === 2) {
            questionText = `A train of length ${val1 * 10} meters crosses a platform of length ${val1 * 15} meters in ${val2} seconds. What is the speed of the train in km/hr?`;
            const mps = (val1 * 10 + val1 * 15) / val2;
            const kmh = (mps * 18 / 5).toFixed(1);
            options = [`${(parseFloat(kmh) - 10).toFixed(1)} km/hr`, `${kmh} km/hr`, `${(parseFloat(kmh) + 15.2).toFixed(1)} km/hr`, `60.0 km/hr`];
            correctAnswer = `${kmh} km/hr`;
            explanation = `Total distance = Length of train + Length of platform = ${val1 * 10} + ${val1 * 15} = ${val1 * 25} meters. Speed in m/s = ${val1 * 25} / ${val2} = ${mps.toFixed(2)} m/s. Convert to km/h by multiplying with 18/5: ${mps.toFixed(2)} * 18/5 = ${kmh} km/hr.`;
          } else {
            questionText = `In a simultaneous throw of two dice, what is the probability of obtaining a total sum of 8?`;
            options = [`5/36`, `1/6`, `7/36`, `1/12`];
            correctAnswer = `5/36`;
            explanation = `Favorable pairs for sum of 8 are (2,6), (3,5), (4,4), (5,3), (6,2) - total 5 outcomes. Total possible outcomes = 36. Hence, probability = 5/36.`;
          }
        } else { // Month 4: Geometry / Mensuration / DI
          if (q === 1) {
            questionText = `Find the area of a circle whose radius is ${val2 * 7} cm. (Use pi = 22/7)`;
            const area = 22 * val2 * val2 * 7;
            options = [`${area - 150} sq.cm`, `${area} sq.cm`, `${area + 200} sq.cm`, `154 sq.cm`];
            correctAnswer = `${area} sq.cm`;
            explanation = `Area of circle = pi * r^2 = (22/7) * ${val2 * 7} * ${val2 * 7} = ${area} sq.cm.`;
          } else if (q === 2) {
            questionText = `If the side of a cube is doubled, its volume becomes how many times its original volume?`;
            options = [`2 times`, `4 times`, `6 times`, `8 times`];
            correctAnswer = `8 times`;
            explanation = `Volume of a cube is s^3. If side becomes 2s, new volume is (2s)^3 = 8 * s^3. So it increases 8 times.`;
          } else {
            questionText = `The imports and exports of a company in Rs. crores are given. Year 1: Import=${val1}, Export=${val1 + 10}. Year 2: Import=${val1 + 20}, Export=${val1 + 35}. What is the percentage increase in exports from Year 1 to Year 2?`;
            const pct = (((val1 + 35 - (val1 + 10)) / (val1 + 10)) * 100).toFixed(2);
            options = [`${pct}%`, `${(parseFloat(pct) - 5).toFixed(2)}%`, `${(parseFloat(pct) + 8).toFixed(2)}%`, `20.00%`];
            correctAnswer = `${pct}%`;
            explanation = `Percentage increase in exports = [(Export Yr 2 - Export Yr 1) / Export Yr 1] * 100 = [25 / ${val1 + 10}] * 100 = ${pct}%.`;
          }
        }

        await db.query(`
          INSERT INTO questions (day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          day, SECTIONS.APTITUDE, 'mcq', questionText,
          JSON.stringify(options), correctAnswer, explanation,
          q === 3 ? 'Medium' : 'Easy'
        ]);
        qCount++;
      }

      // Reasoning Questions (2 MCQs)
      for (let q = 1; q <= 2; q++) {
        let questionText = ``;
        let options = [];
        let correctAnswer = ``;
        let explanation = ``;
        
        const offset = day * q;
        const multiplier = 2 + (offset % 5);
        
        if (q === 1) {
          // Coding decoding or series
          const start = 2 + (day % 10);
          const s1 = start;
          const s2 = start * multiplier;
          const s3 = s2 * multiplier;
          const s4 = s3 * multiplier;
          const s5 = s4 * multiplier;
          questionText = `Identify the missing term in the sequence: ${s1}, ${s2}, ${s3}, ${s4}, ?`;
          options = [`${s5 - multiplier}`, `${s5 + 10}`, `${s5}`, `${s5 * 2}`];
          correctAnswer = `${s5}`;
          explanation = `Each term is multiplied by a common factor of ${multiplier}. The next term is ${s4} * ${multiplier} = ${s5}.`;
        } else {
          // Blood relations or directions
          questionText = `Pointing to a photograph, a man says, "I have no brother or sister, but that man's father is my father's son." Whose photograph is it?`;
          options = ["His own", "His father's", "His son's", "His nephew's"];
          correctAnswer = "His son's";
          explanation = `Since the man has no brother or sister, "my father's son" is himself. Therefore, the statement simplifies to: "that man's father is myself". So, the photograph is of his son.`;
        }

        await db.query(`
          INSERT INTO questions (day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          day, SECTIONS.REASONING, 'mcq', questionText,
          JSON.stringify(options), correctAnswer, explanation,
          q === 2 ? 'Medium' : 'Easy'
        ]);
        qCount++;
      }

      // Verbal Questions (2 MCQs)
      for (let q = 1; q <= 2; q++) {
        let questionText = ``;
        let options = [];
        let correctAnswer = ``;
        let explanation = ``;

        if (q === 1) {
          // Synonyms/Antonyms
          const item = SYNONYMS_LIST[day % SYNONYMS_LIST.length];
          questionText = `Find the synonym of the word: "${item.word}"`;
          options = item.options;
          correctAnswer = item.correct;
          explanation = item.exp;
        } else {
          // Sentence correction
          const item = SENTENCE_CORRECTIONS[day % SENTENCE_CORRECTIONS.length];
          questionText = `Choose the grammatically correct option to replace the underlined phrase in: "${item.text.replace(item.correct, `<u>${item.correct}</u>`)}"`;
          options = item.options;
          correctAnswer = item.correct;
          explanation = item.exp;
        }

        await db.query(`
          INSERT INTO questions (day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          day, SECTIONS.VERBAL, 'mcq', questionText,
          JSON.stringify(options), correctAnswer, explanation,
          'Easy'
        ]);
        qCount++;
      }

      // Programming Logic Questions (2 MCQs)
      for (let q = 1; q <= 2; q++) {
        let questionText = ``;
        let options = [];
        let correctAnswer = ``;
        let explanation = ``;

        if (q === 1) {
          // C Logic
          const x = 5 + (day % 7);
          const y = 2 + (day % 3);
          questionText = `Predict the output of the following C program:\n\`\`\`c\n#include <stdio.h>\nint main() {\n    int a = ${x}, b = ${y};\n    int result = a & b;\n    printf("%d", result);\n    return 0;\n}\n\`\`\``;
          const ans = x & y;
          options = [`${ans}`, `${x | y}`, `${x ^ y}`, `0`];
          correctAnswer = `${ans}`;
          explanation = `The bitwise AND operator '&' compares binary bits of ${x} (${x.toString(2)}) and ${y} (${y.toString(2)}). Only matching 1 bits result in 1, which equals decimal ${ans}.`;
        } else {
          // Python logic
          const listVals = [day % 5, (day % 5) + 1, (day % 5) + 2];
          questionText = `What is the output of the following Python snippet?\n\`\`\`python\nx = [${listVals.join(', ')}]\ny = [val * 2 for val in x if val % 2 == 0]\nprint(y)\n\`\`\``;
          const pyAns = listVals.filter(v => v % 2 === 0).map(v => v * 2);
          options = [
            `[${pyAns.join(', ')}]`,
            `[${listVals.map(v => v * 2).join(', ')}]`,
            `[]`,
            `SyntaxError`
          ];
          correctAnswer = `[${pyAns.join(', ')}]`;
          explanation = `This is a list comprehension. It filters elements of list x, keeping only even elements (divisible by 2), and multiplies them by 2. The output is [${pyAns.join(', ')}].`;
        }

        await db.query(`
          INSERT INTO questions (day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          day, SECTIONS.PROGRAMMING, 'mcq', questionText,
          JSON.stringify(options), correctAnswer, explanation,
          'Medium'
        ]);
        qCount++;
      }

      // Coding Problems (2 problems: slot 1 and slot 2)
      for (let slot = 1; slot <= 2; slot++) {
        let title = ``;
        let statement = ``;
        let inputFormat = ``;
        let outputFormat = ``;
        let constraints = ``;
        let sampleTests = [];
        let hiddenTests = [];
        let hint = ``;
        let approach = ``;
        let pySol = ``;
        let cppSol = ``;
        let javaSol = ``;
        let difficulty = slot === 1 ? 'Easy' : 'Easy-Medium';
        
        if (day <= 30) { // Month 1: 1-D Arrays
          if (slot === 1) {
            // Problem: Sum of Array Elements
            title = `Sum of Array Elements - Day ${day}`;
            statement = `Given an integer array of size N, write a program to calculate and return the sum of all elements in the array.`;
            inputFormat = `First line contains N, the size of the array.\nSecond line contains N space-separated integers representing the array.`;
            outputFormat = `Print a single integer representing the sum of array elements.`;
            constraints = `1 <= N <= 10^5\n-10^6 <= array[i] <= 10^6`;
            sampleTests = [
              { input: `5\n1 2 3 4 5`, output: `15` },
              { input: `3\n-1 0 1`, output: `0` },
              { input: `1\n100`, output: `100` }
            ];
            hiddenTests = [
              { input: `4\n10 20 30 40`, output: `100` },
              { input: `5\n-5 -10 -15 -20 50`, output: `0` },
              { input: `2\n-1000 500`, output: `-500` },
              { input: `6\n1 1 1 1 1 1`, output: `6` },
              { input: `3\n99 99 99`, output: `297` }
            ];
            hint = `Initialize a running total variable to 0 and iterate through the array, adding each element.`;
            approach = `O(N) time complexity approach: Read inputs, split array, run a for-loop accumulator, and print the output. Space complexity is O(N) to store array.`;
            pySol = `import sys\nlines = sys.stdin.read().split()\nif lines:\n    n = int(lines[0])\n    arr = [int(x) for x in lines[1:]]\n    print(sum(arr))\n`;
            cppSol = `#include <iostream>\n#include <vector>\n#include <numeric>\nusing namespace std;\nint main() {\n    int n; if (cin >> n) {\n        long long sum = 0; int x;\n        for(int i=0; i<n; i++) { cin >> x; sum += x; }\n        cout << sum << endl;\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long sum = 0;\n            for (int i = 0; i < n; i++) {\n                sum += sc.nextLong();\n            }\n            System.out.println(sum);\n        }\n    }\n}`;
          } else {
            // Problem: Rotate Array to Left by K Steps
            title = `Rotate Array Left by K - Day ${day}`;
            statement = `Given an array of size N and a rotation step K, rotate the array to the left by K positions.`;
            inputFormat = `First line contains N and K.\nSecond line contains N space-separated integers.`;
            outputFormat = `Print the rotated array elements separated by spaces.`;
            constraints = `1 <= N <= 10^5\n0 <= K <= 10^5\n-10^5 <= array[i] <= 10^5`;
            sampleTests = [
              { input: `5 2\n1 2 3 4 5`, output: `3 4 5 1 2` },
              { input: `4 0\n10 20 30 40`, output: `10 20 30 40` },
              { input: `3 4\n1 2 3`, output: `2 3 1` }
            ];
            hiddenTests = [
              { input: `6 3\n1 2 3 4 5 6`, output: `4 5 6 1 2 3` },
              { input: `2 1\n5 10`, output: `10 5` },
              { input: `5 5\n1 2 3 4 5`, output: `1 2 3 4 5` },
              { input: `4 7\n1 2 3 4`, output: `4 1 2 3` },
              { input: `1 10\n9`, output: `9` }
            ];
            hint = `Remember that rotating an array of size N by K steps is identical to rotating by K % N steps.`;
            approach = `To rotate left by S = K % N steps: slice array into two pieces, index S to end, and start to S. Combine them. Time complexity: O(N), Space complexity: O(N).`;
            pySol = `import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    n = int(lines[0])\n    k = int(lines[1])\n    arr = [int(x) for x in lines[2:]]\n    k = k % n\n    res = arr[k:] + arr[:k]\n    print(*(res))\n`;
            cppSol = `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, k; if (cin >> n >> k) {\n        vector<int> arr(n);\n        for(int i=0; i<n; i++) cin >> arr[i];\n        k = k % n;\n        for(int i=k; i<n; i++) cout << arr[i] << " ";\n        for(int i=0; i<k; i++) cout << arr[i] << " ";\n        cout << endl;\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int k = sc.nextInt();\n            int[] arr = new int[n];\n            for (int i = 0; i < n; i++) {\n                arr[i] = sc.nextInt();\n            }\n            k = k % n;\n            StringBuilder sb = new StringBuilder();\n            for (int i = k; i < n; i++) {\n                sb.append(arr[i]).append(" ");\n            }\n            for (int i = 0; i < k; i++) {\n                sb.append(arr[i]).append(" ");\n            }\n            System.out.println(sb.toString().trim());\n        }\n    }\n}`;
          }
        } else if (day <= 60) { // Month 2: Pattern printing / String operations
          if (slot === 1) {
            title = `Star Triangle Pattern - Day ${day}`;
            statement = `Write a program to print a right-angled triangle pattern of stars '*' of height N.`;
            inputFormat = `A single integer N.`;
            outputFormat = `Print the star triangle pattern.`;
            constraints = `1 <= N <= 20`;
            sampleTests = [
              { input: `3`, output: `*\n**\n***` },
              { input: `1`, output: `*` },
              { input: `2`, output: `*\n**` }
            ];
            hiddenTests = [
              { input: `4`, output: `*\n**\n***\n****` },
              { input: `5`, output: `*\n**\n***\n****\n*****` },
              { input: `6`, output: `*\n**\n***\n****\n*****\n******` },
              { input: `7`, output: `*\n**\n***\n****\n*****\n******\n*******` },
              { input: `8`, output: `*\n**\n***\n****\n*****\n******\n*******\n********` }
            ];
            hint = `Use a nested loop. The outer loop runs row indices from 1 to N, and inner loop prints index '*' columns.`;
            approach = `Loop i from 1 to N: print '*' times i. In C++/Java, use inner loop. O(N^2) complexity.`;
            pySol = `import sys\nline = sys.stdin.read().strip()\nif line:\n    n = int(line)\n    for i in range(1, n+1):\n        print('*' * i)\n`;
            cppSol = `#include <iostream>\nusing namespace std;\nint main() {\n    int n; if (cin >> n) {\n        for(int i=1; i<=n; i++) {\n            for(int j=0; j<i; j++) cout << '*';\n            cout << endl;\n        }\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            for (int i = 1; i <= n; i++) {\n                for (int j = 0; j < i; j++) {\n                    System.out.print("*");\n                }\n                System.out.println();\n            }\n        }\n    }\n}`;
          } else {
            title = `Palindrome Verification - Day ${day}`;
            statement = `Given a string S, verify if it is a palindrome. Case-sensitive.`;
            inputFormat = `A single word string S.`;
            outputFormat = `Print "YES" if S is a palindrome, otherwise print "NO".`;
            constraints = `Length of S <= 10^4`;
            sampleTests = [
              { input: `radar`, output: `YES` },
              { input: `hello`, output: `NO` },
              { input: `a`, output: `YES` }
            ];
            hiddenTests = [
              { input: `Malayalam`, output: `NO` },
              { input: `malayalam`, output: `YES` },
              { input: `aa`, output: `YES` },
              { input: `ab`, output: `NO` },
              { input: `racecar`, output: `YES` }
            ];
            hint = `Compare the string with its reverse. If both are identical, it is a palindrome.`;
            approach = `Check characters from both ends moving inwards (two pointers), or reverse the string and compare. Time: O(N), Space: O(1) or O(N).`;
            pySol = `import sys\ns = sys.stdin.read().strip()\nprint("YES" if s == s[::-1] else "NO")\n`;
            cppSol = `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s; if (cin >> s) {\n        string rev = s;\n        reverse(rev.begin(), rev.end());\n        cout << (s == rev ? "YES" : "NO") << endl;\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next();\n            String rev = new StringBuilder(s).reverse().toString();\n            System.out.println(s.equals(rev) ? "YES" : "NO");\n        }\n    }\n}`;
          }
        } else if (day <= 90) { // Month 3: Recursion / 2D arrays
          difficulty = 'Medium';
          if (slot === 1) {
            title = `Fibonacci Sequence Element - Day ${day}`;
            statement = `Find the N-th Fibonacci number. The sequence starts with F(0)=0 and F(1)=1.`;
            inputFormat = `A single integer N.`;
            outputFormat = `Print the N-th Fibonacci number.`;
            constraints = `0 <= N <= 30`;
            sampleTests = [
              { input: `0`, output: `0` },
              { input: `1`, output: `1` },
              { input: `5`, output: `5` }
            ];
            hiddenTests = [
              { input: `10`, output: `55` },
              { input: `20`, output: `6765` },
              { input: `30`, output: `832040` },
              { input: `2`, output: `1` },
              { input: `6`, output: `8` }
            ];
            hint = `Use recursion or dynamic programming to avoid redundant evaluations.`;
            approach = `Iterative calculation: state variables initialized to 0 and 1, run a loop up to N. Time complexity: O(N), Space complexity: O(1).`;
            pySol = `import sys\nline = sys.stdin.read().strip()\nif line:\n    n = int(line)\n    if n == 0: print(0)\n    elif n == 1: print(1)\n    else:\n        a, b = 0, 1\n        for _ in range(2, n+1):\n            a, b = b, a+b\n        print(b)\n`;
            cppSol = `#include <iostream>\nusing namespace std;\nint main() {\n    int n; if (cin >> n) {\n        if (n == 0) cout << 0 << endl;\n        else if (n == 1) cout << 1 << endl;\n        else {\n            long long a = 0, b = 1, temp;\n            for(int i=2; i<=n; i++) {\n                temp = a + b;\n                a = b;\n                b = temp;\n            }\n            cout << b << endl;\n        }\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            if (n == 0) System.out.println(0);\n            else if (n == 1) System.out.println(1);\n            else {\n                long a = 0, b = 1, temp;\n                for (int i = 2; i <= n; i++) {\n                    temp = a + b;\n                    a = b;\n                    b = temp;\n                }\n                System.out.println(b);\n            }\n        }\n    }\n}`;
          } else {
            title = `Matrix Transpose - Day ${day}`;
            statement = `Given a 2-D matrix of size R x C, print its transpose.`;
            inputFormat = `First line contains R and C.\nNext R lines contain C integers each.`;
            outputFormat = `Print the transposed matrix of size C x R.`;
            constraints = `1 <= R, C <= 100\n-1000 <= element <= 1000`;
            sampleTests = [
              { input: `2 3\n1 2 3\n4 5 6`, output: `1 4\n2 5\n3 6` },
              { input: `1 2\n10 20`, output: `10\n20` },
              { input: `2 2\n1 2\n3 4`, output: `1 3\n2 4` }
            ];
            hiddenTests = [
              { input: `3 2\n1 2\n3 4\n5 6`, output: `1 3 5\n2 4 6` },
              { input: `3 3\n1 1 1\n2 2 2\n3 3 3`, output: `1 2 3\n1 2 3\n1 2 3` },
              { input: `1 1\n99`, output: `99` },
              { input: `2 3\n-1 -2 -3\n-4 -5 -6`, output: `-1 -4\n-2 -5\n-3 -6` },
              { input: `4 2\n1 2\n3 4\n5 6\n7 8`, output: `1 3 5 7\n2 4 6 8` }
            ];
            hint = `Transpose of a matrix is obtained by exchanging rows and columns. Grid indices change from (i, j) to (j, i).`;
            approach = `Read the matrix, declare a result grid of size C x R, map index values, and print. Time: O(R * C).`;
            pySol = `import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    r = int(lines[0])\n    c = int(lines[1])\n    matrix = []\n    idx = 2\n    for i in range(r):\n        matrix.append([int(x) for x in lines[idx : idx+c]])\n        idx += c\n    transpose = [[matrix[i][j] for i in range(r)] for j in range(c)]\n    for row in transpose:\n        print(*(row))\n`;
            cppSol = `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int r, c; if (cin >> r >> c) {\n        vector<vector<int>> mat(r, vector<int>(c));\n        for(int i=0; i<r; i++) {\n            for(int j=0; j<c; j++) cin >> mat[i][j];\n        }\n        for(int j=0; j<c; j++) {\n            for(int i=0; i<r; i++) {\n                cout << mat[i][j] << (i == r-1 ? "" : " ");\n            }\n            cout << endl;\n        }\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int r = sc.nextInt();\n            int c = sc.nextInt();\n            int[][] mat = new int[r][c];\n            for (int i = 0; i < r; i++) {\n                for (int j = 0; j < c; j++) {\n                    mat[i][j] = sc.nextInt();\n                }\n            }\n            for (int j = 0; j < c; j++) {\n                StringBuilder sb = new StringBuilder();\n                for (int i = 0; i < r; i++) {\n                    sb.append(mat[i][j]).append(" ");\n                }\n                System.out.println(sb.toString().trim());\n            }\n        }\n    }\n}`;
          }
        } else { // Month 4: Searching & Sorting
          difficulty = 'Medium-Hard';
          if (slot === 1) {
            title = `Binary Search Implementation - Day ${day}`;
            statement = `Given a sorted array of N integers and a target value K, search for K and return its 0-based index. If K is not present, return -1.`;
            inputFormat = `First line contains N and K.\nSecond line contains N sorted integers.`;
            outputFormat = `Print the 0-based index of target K, or -1.`;
            constraints = `1 <= N <= 10^5\n-10^9 <= array[i], K <= 10^9`;
            sampleTests = [
              { input: `5 3\n1 2 3 4 5`, output: `2` },
              { input: `4 10\n1 3 5 7`, output: `-1` },
              { input: `1 5\n5`, output: `0` }
            ];
            hiddenTests = [
              { input: `6 1\n1 2 3 4 5 6`, output: `0` },
              { input: `6 6\n1 2 3 4 5 6`, output: `5` },
              { input: `2 -5\n-10 -5`, output: `1` },
              { input: `3 0\n-5 5 10`, output: `-1` },
              { input: `7 35\n10 15 20 25 30 35 40`, output: `5` }
            ];
            hint = `Keep two pointers, low = 0 and high = N-1. Calculate mid = (low+high)/2 and adjust boundaries.`;
            approach = `Binary search splits search space in halves. O(log N) runtime, O(1) space.`;
            pySol = `import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    n = int(lines[0])\n    k = int(lines[1])\n    arr = [int(x) for x in lines[2:]]\n    low, high = 0, n-1\n    ans = -1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == k:\n            ans = mid\n            break\n        elif arr[mid] < k: low = mid + 1\n        else: high = mid - 1\n    print(ans)\n`;
            cppSol = `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, k; if (cin >> n >> k) {\n        vector<int> arr(n);\n        for(int i=0; i<n; i++) cin >> arr[i];\n        int low = 0, high = n-1, ans = -1;\n        while(low <= high) {\n            int mid = low + (high - low)/2;\n            if (arr[mid] == k) { ans = mid; break; }\n            else if (arr[mid] < k) low = mid + 1;\n            else high = mid - 1;\n        }\n        cout << ans << endl;\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int k = sc.nextInt();\n            int[] arr = new int[n];\n            for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n            int low = 0, high = n-1, ans = -1;\n            while (low <= high) {\n                int mid = low + (high - low)/2;\n                if (arr[mid] == k) {\n                    ans = mid;\n                    break;\n                } else if (arr[mid] < k) low = mid + 1;\n                else high = mid - 1;\n            }\n            System.out.println(ans);\n        }\n    }\n}`;
          } else {
            title = `Sort Array of Triplets (0s, 1s, 2s) - Day ${day}`;
            statement = `Given an array containing only 0s, 1s, and 2s, sort the array in ascending order in O(N) time and O(1) extra space.`;
            inputFormat = `First line contains N.\nSecond line contains N integers (0, 1, or 2).`;
            outputFormat = `Print the sorted integers separated by spaces.`;
            constraints = `1 <= N <= 10^5\narray[i] in {0, 1, 2}`;
            sampleTests = [
              { input: `6\n2 0 2 1 1 0`, output: `0 0 1 1 2 2` },
              { input: `3\n1 0 2`, output: `0 1 2` },
              { input: `1\n0`, output: `0` }
            ];
            hiddenTests = [
              { input: `5\n2 2 1 1 0`, output: `0 1 1 2 2` },
              { input: `4\n1 1 1 1`, output: `1 1 1 1` },
              { input: `2\n2 0`, output: `0 2` },
              { input: `7\n0 1 2 0 1 2 0`, output: `0 0 0 1 1 2 2` },
              { input: `3\n2 2 2`, output: `2 2 2` }
            ];
            hint = `Use the Dutch National Flag algorithm with three pointers: low, mid, and high.`;
            approach = `Dutch National Flag algorithm: low and mid start at 0, high starts at N-1. If arr[mid] == 0, swap(low, mid), increment low and mid. If 1, increment mid. If 2, swap(mid, high), decrement high. O(N) time, O(1) space.`;
            pySol = `import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    n = int(lines[0])\n    arr = [int(x) for x in lines[1:]]\n    low, mid, high = 0, 0, n-1\n    while mid <= high:\n        if arr[mid] == 0:\n            arr[low], arr[mid] = arr[mid], arr[low]\n            low += 1\n            mid += 1\n        elif arr[mid] == 1: mid += 1\n        else:\n            arr[mid], arr[high] = arr[high], arr[mid]\n            high -= 1\n    print(*(arr))\n`;
            cppSol = `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; if (cin >> n) {\n        vector<int> arr(n);\n        for(int i=0; i<n; i++) cin >> arr[i];\n        int low = 0, mid = 0, high = n-1;\n        while(mid <= high) {\n            if (arr[mid] == 0) {\n                swap(arr[low++], arr[mid++]);\n            } else if (arr[mid] == 1) mid++;\n            else {\n                swap(arr[mid], arr[high--]);\n            }\n        }\n        for(int i=0; i<n; i++) cout << arr[i] << (i == n-1 ? "" : " ");\n        cout << endl;\n    }\n    return 0;\n}`;
            javaSol = `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] arr = new int[n];\n            for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n            int low = 0, mid = 0, high = n-1;\n            while (mid <= high) {\n                if (arr[mid] == 0) {\n                    int temp = arr[low];\n                    arr[low] = arr[mid];\n                    arr[mid] = temp;\n                    low++; mid++;\n                } else if (arr[mid] == 1) {\n                    mid++;\n                } else {\n                    int temp = arr[mid];\n                    arr[mid] = arr[high];\n                    arr[high] = temp;\n                    high--;\n                }\n            }\n            StringBuilder sb = new StringBuilder();\n            for (int i = 0; i < n; i++) sb.append(arr[i]).append(" ");\n            System.out.println(sb.toString().trim());\n        }\n    }\n}`;
          }
        }

        await db.query(`
          INSERT INTO coding_problems (day_number, slot, title, statement, input_format, output_format, constraints, sample_tests_json, hidden_tests_json, hint, approach, solution_code_by_lang_json, topic_id, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          day, slot, title, statement, inputFormat, outputFormat, constraints,
          JSON.stringify(sampleTests), JSON.stringify(hiddenTests), hint, approach,
          JSON.stringify({ python: pySol, cpp: cppSol, java: javaSol }),
          topicId, difficulty
        ]);
        codeCount++;
      }
    }
    console.log(`Successfully generated and seeded questions & coding problems: ${qCount} questions, ${codeCount} coding problems.`);

    // 5. Seed 12 Mock Tests
    console.log('Seeding 12 mock tests...');
    for (let month = 1; month <= 12; month++) {
      const mockTestStructure = {
        foundation: {
          duration_minutes: 75,
          total_questions: 65,
          sections: [
            { name: 'Numerical Ability', count: 20 },
            { name: 'Reasoning Ability', count: 25 },
            { name: 'Verbal Ability', count: 20 }
          ]
        },
        advanced: {
          duration_minutes: 115,
          mcq_count: 15,
          coding_count: 2
        }
      };

      await db.query(`
        INSERT INTO mock_tests (month, name, sections_json)
        VALUES ($1, $2, $3)
      `, [
        month,
        `NQT Monthly Full Mock Test - Month ${month}`,
        JSON.stringify(mockTestStructure)
      ]);
    }
    console.log('Seeded 12 mock tests.');

    console.log('Seed completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Fatal error during seed execution:', err);
    process.exit(1);
  }
}

seed();
