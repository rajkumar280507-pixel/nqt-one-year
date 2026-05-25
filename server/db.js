import pg from 'pg';
import dotenv from 'dotenv';
import { TRICK_DATA, FORMULA_DATA, VOCABULARY_DATA, DRILL_DATA } from './tricksData.js';

dotenv.config();

const { Pool } = pg;
const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nqt_db';

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

let useMockDb = false;

// Attempt startup connection check
(async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully on startup.');
    client.release();
  } catch (err) {
    console.error('DATABASE WARNING: PostgreSQL server is not running or connection was refused.');
    console.warn('FALLBACK ACTIVATED: Operating in In-Memory resilient mock mode for free tier deployments.');
    useMockDb = true;
  }
})();

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

const mockTricks = [
  {
    id: 1,
    section: "numerical",
    topic: "Number System",
    trick_name: "Divisibility Rules (the 12 rules)",
    when_to_spot: "Use this when you need a quick check if a number divides another, no long calculation needed.",
    formula_text: "Divisibility Rules: 2 (even), 3 (sum div 3), 4 (last 2 digits div 4), 5 (ends 0/5), 6 (div 2 & 3), 7 (rest - 2*last), 8 (last 3 div 8), 9 (sum div 9), 10 (ends 0), 11 (diff of odd/even sum div 11), 12 (div 3 & 4), 13 (rest + 4*last).",
    intuition: "These rules come from base-10 algebra properties. We analyze place values to see remainders quickly.",
    trap_box: "Do not confuse divisibility of 3 and 9. For 3, digit sum must be divisible by 3. For 9, digit sum must be divisible by 9.",
    worked_examples_json: [
      {
        question: "Is 452136 divisible by 9?",
        steps: [
          { text: "Sum all digits: 4 + 5 + 2 + 1 + 3 + 6 = 21.", reveal_hint: "Calculate sum." },
          { text: "Check if digit sum (21) is divisible by 9.", reveal_hint: "Compare with 9." },
          { text: "21 is not divisible by 9 (9 * 2 = 18, 9 * 3 = 27). Hence, 452136 is not divisible by 9.", reveal_hint: "Final answer." }
        ],
        answer: "No",
        is_tcs_style: false
      },
      {
        question: "Find the missing digit x if 78x39 is divisible by 11.",
        steps: [
          { text: "Sum of odd position digits: 7 + x + 9 = 16 + x.", reveal_hint: "Sum odd positions." },
          { text: "Sum of even position digits: 8 + 3 = 11.", reveal_hint: "Sum even positions." },
          { text: "Difference: (16 + x) - 11 = 5 + x.", reveal_hint: "Find difference." },
          { text: "For divisibility by 11, difference must be 0, 11, or 22. Since x is a digit (0-9), 5 + x = 11 => x = 6.", reveal_hint: "Solve for x." }
        ],
        answer: "6",
        is_tcs_style: true
      },
      {
        question: "Is 1432 divisible by 8?",
        steps: [
          { text: "Take the last three digits: 432.", reveal_hint: "Select last 3." },
          { text: "Perform 432 ÷ 8 = 54.", reveal_hint: "Divide by 8." },
          { text: "Since 432 is divisible by 8, 1432 is divisible by 8.", reveal_hint: "Result." }
        ],
        answer: "Yes",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Divisibility of 452136 by 9",
        long_method_time: "45 seconds",
        long_method_steps: "Perform full long division: 452136 ÷ 9. 45 ÷ 9 = 5, then 2 (0), 21 ÷ 9 = 2, 33 ÷ 9 = 3, 66 ÷ 9 = 7 remainder 3. Very slow.",
        short_method_time: "10 seconds",
        short_method_steps: "Digit sum: 4+5+2+1+3+6 = 21. Since 21 is not divisible by 9, the number is not."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 2,
    section: "numerical",
    topic: "Number System",
    trick_name: "Cyclicity of Unit Digits",
    when_to_spot: "Use this when the question asks for the unit digit of a number raised to a large power.",
    formula_text: "Unit cycles: ending in 0,1,5,6 -> cycle 1. Ending in 4,9 -> cycle 2. Ending in 2,3,7,8 -> cycle 4.",
    intuition: "Powers of digits repeat cycle patterns. By dividing power by cycle length, we find the remainder index.",
    trap_box: "If remainder is 0, use the last index position of the cycle. Don't use index 0.",
    worked_examples_json: [
      {
        question: "Find the unit digit of 7^123.",
        steps: [
          { text: "Identify cycle of 7: [7, 9, 3, 1] of length 4.", reveal_hint: "Find cycle." },
          { text: "Divide power by cycle length: 123 ÷ 4 = remainder 3.", reveal_hint: "Get remainder." },
          { text: "The third position of the cycle [7, 9, 3, 1] is 3. The unit digit is 3.", reveal_hint: "Find remainder index." }
        ],
        answer: "3",
        is_tcs_style: false
      },
      {
        question: "What is the unit digit of 4^55 + 9^36?",
        steps: [
          { text: "For 4^55: cycle is [4, 6] of length 2. 55 ÷ 2 = remainder 1. 4^1 ends in 4.", reveal_hint: "Calculate for 4." },
          { text: "For 9^36: cycle is [9, 1] of length 2. 36 ÷ 2 = remainder 0 (use last position, which is 1). 9^36 ends in 1.", reveal_hint: "Calculate for 9." },
          { text: "Add unit digits: 4 + 1 = 5. The unit digit is 5.", reveal_hint: "Sum results." }
        ],
        answer: "5",
        is_tcs_style: true
      },
      {
        question: "Find the unit digit of 23^40.",
        steps: [
          { text: "Focus on unit digit of base: 3. The cycle of 3 is [3, 9, 7, 1] of length 4.", reveal_hint: "Find cycle." },
          { text: "Divide exponent by 4: 40 ÷ 4 = remainder 0.", reveal_hint: "Get remainder." },
          { text: "Since remainder is 0, use the last digit of the cycle, which is 1. The unit digit is 1.", reveal_hint: "Select digit." }
        ],
        answer: "1",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Unit digit of 7^123",
        long_method_time: "5 minutes",
        long_method_steps: "Multiply 7 by itself 123 times. High risk of computational overflow.",
        short_method_time: "15 seconds",
        short_method_steps: "Divide power 123 by cycle length 4. Remainder 3 => third position in [7, 9, 3, 1] is 3."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 3,
    section: "numerical",
    topic: "Number System",
    trick_name: "Trailing Zeros in n!",
    when_to_spot: "Use this when the question asks for the number of trailing zeros in a factorial.",
    formula_text: "Trailing Zeros = floor(n/5) + floor(n/25) + floor(n/125) + ...",
    intuition: "Trailing zeros are formed by factors of 10. Since 10 = 2 * 5, and 2s are abundant, counting 5s tells us how many 10s exist.",
    trap_box: "Do not stop after the first division. Add successive divisions by powers of 5.",
    worked_examples_json: [
      {
        question: "Find the number of trailing zeros in 100!.",
        steps: [
          { text: "First division: 100 ÷ 5 = 20.", reveal_hint: "Divide by 5." },
          { text: "Second division: 100 ÷ 25 = 4.", reveal_hint: "Divide by 25." },
          { text: "Third division: 100 ÷ 125 = 0. Stop here.", reveal_hint: "Stop check." },
          { text: "Add results: 20 + 4 = 24 zeros.", reveal_hint: "Sum values." }
        ],
        answer: "24",
        is_tcs_style: false
      },
      {
        question: "How many trailing zeros are in 126! - 125!?",
        steps: [
          { text: "Rewrite the expression: 125! * (126 - 1) = 125! * 125.", reveal_hint: "Factorize." },
          { text: "Find zeros in 125!: 125/5 + 125/25 + 125/125 = 25 + 5 + 1 = 31 zeros.", reveal_hint: "Zeros in 125!." },
          { text: "125 is 5^3, which contributes 3 extra factors of 5.", reveal_hint: "Extra factor contributions." },
          { text: "Total zeros = 31 + 3 = 34 zeros.", reveal_hint: "Sum zeros." }
        ],
        answer: "34",
        is_tcs_style: true
      },
      {
        question: "Find trailing zeros in 50!.",
        steps: [
          { text: "Calculate 50 ÷ 5 = 10.", reveal_hint: "Divide by 5." },
          { text: "Calculate 50 ÷ 25 = 2.", reveal_hint: "Divide by 25." },
          { text: "Sum results: 10 + 2 = 12.", reveal_hint: "Sum zeros." }
        ],
        answer: "12",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Zeros in 50!",
        long_method_time: "10 minutes",
        long_method_steps: "Multiply out 50! fully and count zeros. Impossible during exam limits.",
        short_method_time: "10 seconds",
        short_method_steps: "Calculate floor(50/5) + floor(50/25) = 10 + 2 = 12."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 4,
    section: "numerical",
    topic: "Number System",
    trick_name: "Last Two Digits of a^n",
    when_to_spot: "Use this when the question asks for the last two digits of a number ending in 1.",
    formula_text: "Last two digits of tens digit a1^x = (tens digit of base * unit digit of exponent) followed by 1.",
    intuition: "When binomial theorem is applied to (10k + 1)^n, only the last two terms contribute to the last two digits.",
    trap_box: "If the product of tens digit and exponent unit digit is double digit (e.g. 12), take only the unit digit (2).",
    worked_examples_json: [
      {
        question: "Find the last two digits of 21^234.",
        steps: [
          { text: "Tens digit of base = 2. Unit digit of exponent = 4.", reveal_hint: "Find parameters." },
          { text: "Product: 2 * 4 = 8.", reveal_hint: "Multiply digits." },
          { text: "Last two digits are 81 (8 followed by 1).", reveal_hint: "Build answer." }
        ],
        answer: "81",
        is_tcs_style: false
      },
      {
        question: "What are the last two digits of 71^159?",
        steps: [
          { text: "Tens digit of base = 7. Unit digit of exponent = 9.", reveal_hint: "Find parameters." },
          { text: "Product: 7 * 9 = 63. Take only unit digit 3.", reveal_hint: "Multiply and slice." },
          { text: "Last two digits are 31 (3 followed by 1).", reveal_hint: "Build answer." }
        ],
        answer: "31",
        is_tcs_style: true
      },
      {
        question: "Find the last two digits of 31^40.",
        steps: [
          { text: "Tens digit of base = 3. Unit digit of exponent = 0.", reveal_hint: "Find parameters." },
          { text: "Product: 3 * 0 = 0.", reveal_hint: "Multiply digits." },
          { text: "Last two digits are 01.", reveal_hint: "Build answer." }
        ],
        answer: "01",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Last two digits of 71^159",
        long_method_time: "3 minutes",
        long_method_steps: "Calculate 71 * 71... keeping track of last two digits through modulo 100 division.",
        short_method_time: "10 seconds",
        short_method_steps: "tens digit (7) * exponent unit (9) = 63 => ends in 3 => answer 31."
      }
    ],
    difficulty_tier: 2,
    prerequisite_trick_ids: []
  },
  {
    id: 5,
    section: "numerical",
    topic: "Number System",
    trick_name: "HCF × LCM Product Rule",
    when_to_spot: "Use this when you are given numbers and their HCF/LCM, and need to find the missing variable.",
    formula_text: "HCF(a, b) * LCM(a, b) = a * b.",
    intuition: "Every number is composed of prime factors. The product of numbers replicates the factors represented in LCM and HCF.",
    trap_box: "This rule applies strictly to TWO numbers. Do not use this for HCF and LCM of three or more numbers.",
    worked_examples_json: [
      {
        question: "The HCF of two numbers is 12 and their LCM is 72. If one number is 24, find the other.",
        steps: [
          { text: "Use formula: HCF * LCM = a * b.", reveal_hint: "Recall formula." },
          { text: "Substitute values: 12 * 72 = 24 * b.", reveal_hint: "Substitute values." },
          { text: "Solve for b: b = (12 * 72) / 24 = 36.", reveal_hint: "Calculate other number." }
        ],
        answer: "36",
        is_tcs_style: false
      },
      {
        question: "The product of two numbers is 2028. Their HCF is 13. Find the number of such pairs.",
        steps: [
          { text: "Let numbers be 13x and 13y, where x and y are coprime.", reveal_hint: "Define numbers." },
          { text: "Product: 13x * 13y = 2028 => 169xy = 2028 => xy = 12.", reveal_hint: "Find xy product." },
          { text: "Find coprime pairs (x, y) that multiply to 12: (1, 12), (3, 4). (2, 6 is not coprime).", reveal_hint: "Find coprimes." },
          { text: "Number of pairs = 2.", reveal_hint: "Count pairs." }
        ],
        answer: "2",
        is_tcs_style: true
      },
      {
        question: "LCM of two numbers is 48. HCF is 8. One number is 16. Find the other.",
        steps: [
          { text: "Apply formula: 8 * 48 = 16 * b.", reveal_hint: "Recall formula." },
          { text: "Solve for b: b = 384 / 16 = 24.", reveal_hint: "Result." }
        ],
        answer: "24",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Find other number",
        long_method_time: "45 seconds",
        long_method_steps: "Find prime factors of 24 and reconstruct options matching HCF 12 and LCM 72.",
        short_method_time: "10 seconds",
        short_method_steps: "b = (12 * 72) / 24 = 36."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 6,
    section: "numerical",
    topic: "Number System",
    trick_name: "Sum of First n Natural Numbers",
    when_to_spot: "Use this when you need the sum of consecutive integers, squares, or cubes.",
    formula_text: "Sum = n(n+1)/2. Squares = n(n+1)(2n+1)/6. Cubes = [n(n+1)/2]^2.",
    intuition: "These arithmetic sequences reflect triangle area approximations in geometry.",
    trap_box: "Ensure the sequence starts at 1. If it starts at 10 (e.g. 10 to 20), calculate Sum(20) - Sum(9).",
    worked_examples_json: [
      {
        question: "Find the sum of first 50 natural numbers.",
        steps: [
          { text: "Use formula: n(n+1)/2 with n = 50.", reveal_hint: "Recall formula." },
          { text: "Substitute: 50 * 51 / 2 = 25 * 51.", reveal_hint: "Substitute." },
          { text: "Calculate: 1275.", reveal_hint: "Solve." }
        ],
        answer: "1275",
        is_tcs_style: false
      },
      {
        question: "Find the sum of squares of numbers from 11 to 20.",
        steps: [
          { text: "Formula is Sum(20) - Sum(10).", reveal_hint: "Split calculation." },
          { text: "Sum(20) = 20 * 21 * 41 / 6 = 2870.", reveal_hint: "Sum of first 20 squares." },
          { text: "Sum(10) = 10 * 11 * 21 / 6 = 385.", reveal_hint: "Sum of first 10 squares." },
          { text: "Difference: 2870 - 385 = 2485.", reveal_hint: "Subtract values." }
        ],
        answer: "2485",
        is_tcs_style: true
      },
      {
        question: "Find the sum of cubes of first 10 numbers.",
        steps: [
          { text: "Formula: [10 * 11 / 2]^2.", reveal_hint: "Recall formula." },
          { text: "Calculate: 55^2 = 3025.", reveal_hint: "Result." }
        ],
        answer: "3025",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Sum of 11^2 + ... + 20^2",
        long_method_time: "2 minutes",
        long_method_steps: "Write down 121 + 144 + 169 + ... and add manually. Slow and risky.",
        short_method_time: "20 seconds",
        short_method_steps: "Apply formula: SumOfSquares(20) - SumOfSquares(10) = 2870 - 385 = 2485."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 7,
    section: "numerical",
    topic: "Number System",
    trick_name: "Number of Factors / Sum of Factors",
    when_to_spot: "Use this when the question asks for factor count or the sum of all divisors of a number.",
    formula_text: "If N = p^a * q^b, FactorsCount = (a+1)(b+1). Sum = [(p^(a+1)-1)/(p-1)] * [(q^(b+1)-1)/(q-1)].",
    intuition: "Every factor is a combinations of prime factors. Combinations of power components calculate factor count.",
    trap_box: "You must prime-factorize the base first. Do not use composite bases directly.",
    worked_examples_json: [
      {
        question: "Find the number of factors of 72.",
        steps: [
          { text: "Prime factorize 72: 72 = 8 * 9 = 2^3 * 3^2.", reveal_hint: "Factorize base." },
          { text: "Powers: a = 3, b = 2.", reveal_hint: "Find powers." },
          { text: "Factor count: (3+1) * (2+1) = 4 * 3 = 12.", reveal_hint: "Multiply values." }
        ],
        answer: "12",
        is_tcs_style: false
      },
      {
        question: "Find the sum of all factors of 36.",
        steps: [
          { text: "Prime factorize 36: 36 = 2^2 * 3^2.", reveal_hint: "Factorize." },
          { text: "Apply sum formula: [(2^3 - 1)/(2-1)] * [(3^3 - 1)/(3-1)].", reveal_hint: "Apply formula." },
          { text: "Calculate terms: [7/1] * [26/2] = 7 * 13 = 91.", reveal_hint: "Multiply terms." }
        ],
        answer: "91",
        is_tcs_style: true
      },
      {
        question: "Find the number of prime factors of 60.",
        steps: [
          { text: "Prime factorize 60: 2^2 * 3 * 5.", reveal_hint: "Factorize." },
          { text: "The prime factors are 2, 3, and 5. There are 3 distinct prime factors.", reveal_hint: "Count primes." }
        ],
        answer: "3",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Factors of 72",
        long_method_time: "60 seconds",
        long_method_steps: "List divisors manually: 1,2,3,4,6,8,9,12,18,24,36,72. Easy to miss one.",
        short_method_time: "10 seconds",
        short_method_steps: "72 = 2^3 * 3^2 => (3+1)*(2+1) = 12."
      }
    ],
    difficulty_tier: 2,
    prerequisite_trick_ids: []
  },
  {
    id: 8,
    section: "numerical",
    topic: "Percentages",
    trick_name: "Fraction-to-Percentage Quick Conversions",
    when_to_spot: "Use this to speed up any percentage calculation involving standard fractions.",
    formula_text: "1/8 = 12.5%, 1/6 = 16.67%, 1/7 = 14.29%, 1/9 = 11.11%, 1/11 = 9.09%, 1/12 = 8.33%.",
    intuition: "Knowing fractional shortcuts eliminates division arithmetic.",
    trap_box: "Do not round too aggressively. 16.66% is 1/6, not 16/100.",
    worked_examples_json: [
      {
        question: "Calculate 12.5% of 800.",
        steps: [
          { text: "Recall shortcut: 12.5% = 1/8.", reveal_hint: "Use fraction." },
          { text: "Calculate: 800 * (1/8) = 100.", reveal_hint: "Divide." }
        ],
        answer: "100",
        is_tcs_style: false
      },
      {
        question: "Find the value of 14.28% of 490 + 9.09% of 220.",
        steps: [
          { text: "Recall shortcuts: 14.28% = 1/7 and 9.09% = 1/11.", reveal_hint: "Use fractions." },
          { text: "Substitute: (490 / 7) + (220 / 11).", reveal_hint: "Substitute." },
          { text: "Calculate terms: 70 + 20 = 90.", reveal_hint: "Sum terms." }
        ],
        answer: "90",
        is_tcs_style: true
      },
      {
        question: "Find 16.67% of 180.",
        steps: [
          { text: "Recall shortcut: 16.67% = 1/6.", reveal_hint: "Use fraction." },
          { text: "Compute: 180 ÷ 6 = 30.", reveal_hint: "Divide." }
        ],
        answer: "30",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "12.5% of 800",
        long_method_time: "30 seconds",
        long_method_steps: "Multiply: 12.5 * 800 / 100 = 12.5 * 8 = 100.",
        short_method_time: "5 seconds",
        short_method_steps: "800 / 8 = 100."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 9,
    section: "numerical",
    topic: "Percentages",
    trick_name: "Successive Percentage Change",
    when_to_spot: "Use this when a quantity changes by x%, then the result changes by y%.",
    formula_text: "Net Change % = x + y + (xy / 100).",
    intuition: "Calculates the compounded impact of consecutive percentage changes directly.",
    trap_box: "Always use negative values for percentage decreases or discounts.",
    worked_examples_json: [
      {
        question: "A salary increases by 20% and then decreases by 10%. Find net change.",
        steps: [
          { text: "Identify parameters: x = 20, y = -10.", reveal_hint: "Find parameters." },
          { text: "Apply formula: 20 + (-10) + (20 * -10)/100.", reveal_hint: "Apply formula." },
          { text: "Calculate: 10 - 2 = 8%. Since positive, it is an 8% increase.", reveal_hint: "Solve." }
        ],
        answer: "8% increase",
        is_tcs_style: false
      },
      {
        question: "A price is discounted by 30% and then by 20%. Find single discount equivalent.",
        steps: [
          { text: "Identify parameters (decreases): x = -30, y = -20.", reveal_hint: "Find parameters." },
          { text: "Apply formula: -30 + (-20) + (-30 * -20)/100.", reveal_hint: "Apply formula." },
          { text: "Calculate: -50 + 6 = -44%. The equivalent discount is 44%.", reveal_hint: "Solve." }
        ],
        answer: "44%",
        is_tcs_style: true
      },
      {
        question: "A stock price rises 10% and then rises 10% again. Find net increase.",
        steps: [
          { text: "Parameters: x = 10, y = 10.", reveal_hint: "Identify." },
          { text: "Formula: 10 + 10 + 1 = 21%.", reveal_hint: "Solve." }
        ],
        answer: "21%",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Salary +20% then -10%",
        long_method_time: "45 seconds",
        long_method_steps: "Let original salary = 100. Step 1: 100 * 1.2 = 120. Step 2: 120 * 0.9 = 108. Compare 108 to 100.",
        short_method_time: "10 seconds",
        short_method_steps: "20 - 10 - 2 = 8%."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 10,
    section: "numerical",
    topic: "Percentages",
    trick_name: "Same x% Up and Down Decrease",
    when_to_spot: "Use this when a value is increased by x% and then decreased by the same x% (or vice versa).",
    formula_text: "Net Change = Always Decrease of (x^2 / 100)%.",
    intuition: "Compounding same up-down shifts always results in a net decrease because the second shift is applied to a larger/smaller base.",
    trap_box: "Remember this is ALWAYS a decrease. Do not write 'no change'.",
    worked_examples_json: [
      {
        question: "A price is increased by 20% and then decreased by 20%. Find net change.",
        steps: [
          { text: "Identify parameters: x = 20.", reveal_hint: "Identify." },
          { text: "Apply formula: Decrease of 20^2 / 100 = 400 / 100 = 4%.", reveal_hint: "Solve." }
        ],
        answer: "4% decrease",
        is_tcs_style: false
      },
      {
        question: "A shopkeeper raises prices by 30% and then runs a 30% discount sale. Find loss.",
        steps: [
          { text: "x = 30. Apply formula: Loss = 30^2 / 100 = 900 / 100 = 9%.", reveal_hint: "Recall formula." },
          { text: "Net result is a 9% loss.", reveal_hint: "Solve." }
        ],
        answer: "9% loss",
        is_tcs_style: true
      },
      {
        question: "A stock falls 10% and then rises 10%. Find net change.",
        steps: [
          { text: "x = 10. Apply formula: 10^2 / 100 = 1%. Always a decrease.", reveal_hint: "Solve." }
        ],
        answer: "1% decrease",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Rises 20% then falls 20%",
        long_method_time: "30 seconds",
        long_method_steps: "Let base = 100. Rises to 120. Falls 20% of 120 = 24. New price is 96. Decrease is 4%.",
        short_method_time: "5 seconds",
        short_method_steps: "20^2 / 100 = 4% decrease."
      }
    ],
    difficulty_tier: 1,
    prerequisite_trick_ids: []
  },
  {
    id: 11,
    section: "numerical",
    topic: "Percentages",
    trick_name: "Population / Compound Growth",
    when_to_spot: "Use this for population growth or compound growth over n periods.",
    formula_text: "Final = Initial * (1 + r/100)^n. Original = Final / (1 + r/100)^n.",
    intuition: "Compounding increments values by multiplicative factors over successive periods.",
    trap_box: "Check if the rate is compound growth or decline. For decline (e.g. depreciation), use (1 - r/100)^n.",
    worked_examples_json: [
      {
        question: "Population is 10000. It grows 10% annually. Find population in 2 years.",
        steps: [
          { text: "Use formula: 10000 * (1 + 10/100)^2.", reveal_hint: "Recall formula." },
          { text: "Substitute: 10000 * (1.1)^2 = 10000 * 1.21.", reveal_hint: "Substitute." },
          { text: "Calculate: 12100.", reveal_hint: "Solve." }
        ],
        answer: "12100",
        is_tcs_style: false
      },
      {
        question: "A machine value depreciates 20% annually. If current value is ₹64000, find value 2 years ago.",
        steps: [
          { text: "Use formula: Original = Current / (1 - r/100)^2.", reveal_hint: "Recall formula." },
          { text: "Substitute: 64000 / (1 - 0.2)^2 = 64000 / (0.64).", reveal_hint: "Substitute." },
          { text: "Calculate: 100000.", reveal_hint: "Solve." }
        ],
        answer: "₹1,00,000",
        is_tcs_style: true
      },
      {
        question: "Depreciation of car value is 10% annually. If new car is ₹5,00,000, value in 1 year?",
        steps: [
          { text: "Formula: 500000 * (0.9) = 450000.", reveal_hint: "Solve." }
        ],
        answer: "₹4,50,000",
        is_tcs_style: false
      }
    ],
    long_vs_short_examples_json: [
      {
        title: "Value 2 years ago",
        long_method_time: "90 seconds",
        long_method_steps: "Set value 2 years ago as x. Year 1: 0.8x. Year 2: 0.8 * 0.8x = 0.64x. Solve 0.64x = 64000.",
        short_method_time: "15 seconds",
        short_method_steps: "64000 / 0.8^2 = 64000 / 0.64 = 100000."
      }
    ],
    difficulty_tier: 2,
    prerequisite_trick_ids: []
  }
];

const userTrickMasteryMemory = [];
const attemptsMemory = [];
const usersMemory = [];
const vocabCardsMemory = [];
const progressMemory = [];
const submissionsMemory = [];

function getMockTrickName(trickId) {
  let name = null;
  if (trickId < 100) {
    name = TRICK_DATA[trickId - 1]?.name;
  } else {
    const topicId = Math.floor(trickId / 100);
    const index = (trickId % 100) - 1;
    const topic = mockTopics.find(t => t.id === topicId);
    if (topic) {
      const topicTricks = TRICK_DATA.filter(t => t.topic_name === topic.name);
      name = topicTricks[index]?.name;
    }
  }
  return name;
}

function getMockDrillsForTrick(trickId) {
  const trickName = getMockTrickName(trickId);
  if (!trickName) return [];
  const matchingDrills = DRILL_DATA.filter(d => d.trick_name === trickName);
  return matchingDrills.map((d, i) => ({
    id: trickId * 100 + i,
    trick_id: trickId,
    question_text: d.question_text,
    options_json: d.options_json || d.options || [],
    correct_answer: d.correct_answer,
    solution_using_trick: d.solution_steps || d.solution_using_trick || "",
    expected_solve_time_sec: d.expected_solve_time_sec || 20
  }));
}

const mockTopics = [
  { id: 1, section: "Aptitude", name: "Number System", definition: "Integers, prime numbers, rational numbers, cyclicity, unit digit calculations.", questions_count: 5 },
  { id: 2, section: "Aptitude", name: "LCM & HCF", definition: "Least Common Multiple and Highest Common Factor relationships and word problems.", questions_count: 4 },
  { id: 3, section: "Aptitude", name: "Divisibility Rules", definition: "Determining whether an integer is divisible by a fixed divisor quickly.", questions_count: 3 },
  { id: 4, section: "Aptitude", name: "Percentages", definition: "Calculations of percentage increase/decrease, salaries, and index fractions.", questions_count: 6 },
  { id: 5, section: "Aptitude", name: "Profit & Loss", definition: "Cost price, selling price, marked price, discounts, and dealers.", questions_count: 5 },
  { id: 6, section: "Reasoning", name: "Coding-Decoding", definition: "Identifying alphanumeric shifts and substitution patterns to translate code.", questions_count: 8 },
  { id: 7, section: "Reasoning", name: "Blood Relations", definition: "Decoding family trees and relations.", questions_count: 4 },
  { id: 8, section: "Reasoning", name: "Direction Sense", definition: "Navigating directions, degrees, and shortest path calculations.", questions_count: 5 },
  { id: 9, section: "Verbal", name: "Synonyms & Antonyms", definition: "Identifying lexical meanings and word similarities in context.", questions_count: 10 },
  { id: 10, section: "Verbal", name: "Sentence Correction", definition: "Grammar rules, subject-verb agreements, and words replacement.", questions_count: 7 },
  { id: 11, section: "Programming Logic", name: "Loops and Control Flow", definition: "For, while, and do-while loops, break/continue statements.", questions_count: 5 },
  { id: 12, section: "Coding", name: "1-D Arrays Traversal", definition: "Iterating through single-dimensional arrays to find min, max, or sum.", questions_count: 4 },
  { id: 13, section: "Coding", name: "String Operations", definition: "Length calculation, reversals, palindromes, and anagram checks.", questions_count: 3 }
];

function runMockQuery(text, params = []) {
  const queryText = text.trim().toLowerCase();

  // Tricks & Mastery query handlers (handles both 'sqltricks' and 'tricks')
  if (queryText.includes('from tricks') || queryText.includes('from sqltricks')) {
    const joined = mockTricks.map(t => {
      const m = userTrickMasteryMemory.find(x => x.trick_id === t.id && x.user_id === params[0]);
      return {
        ...t,
        drills_attempted: m ? m.drills_attempted : 0,
        drills_correct: m ? m.drills_correct : 0,
        best_avg_time_sec: m ? m.best_avg_time_sec : null,
        last_drilled_at: m ? m.last_drilled_at : null,
        mastery_score: m ? m.mastery_score : 0
      };
    });

    if (queryText.includes('where t.id =') || queryText.includes('where id =')) {
      const trickId = params[1] || params[0];
      const single = joined.find(x => x.id === trickId);
      return { rows: single ? [single] : [], rowCount: single ? 1 : 0 };
    }
    return { rows: joined, rowCount: joined.length };
  }

  if (queryText.includes('from trick_drills')) {
    const trickId = params[0];
    const drills = getMockDrillsForTrick(trickId);
    return { rows: drills, rowCount: drills.length };
  }

  if (queryText.includes('from user_trick_mastery where user_id =')) {
    const userId = params[0];
    const trickId = params[1];
    const m = userTrickMasteryMemory.find(x => x.user_id === userId && x.trick_id === trickId);
    return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
  }

  if (queryText.includes('insert into user_trick_mastery')) {
    const record = {
      user_id: params[0],
      trick_id: params[1],
      drills_attempted: params[2] || 0,
      drills_correct: params[3] || 0,
      best_avg_time_sec: params[4] || null,
      last_drilled_at: new Date(),
      mastery_score: params[5] || 0
    };
    userTrickMasteryMemory.push(record);
    return { rows: [record], rowCount: 1 };
  }

  if (queryText.includes('update user_trick_mastery')) {
    const drillTotal = params[0];
    const drillCorrect = params[1];
    const bestTime = params[2];
    const masteryScore = params[3];
    const userId = params[4];
    const trickId = params[5];

    let m = userTrickMasteryMemory.find(x => x.user_id === userId && x.trick_id === trickId);
    if (m) {
      m.drills_attempted += drillTotal;
      m.drills_correct += drillCorrect;
      m.best_avg_time_sec = bestTime;
      m.last_drilled_at = new Date();
      m.mastery_score = masteryScore;
    } else {
      m = {
        user_id: userId,
        trick_id: trickId,
        drills_attempted: drillTotal,
        drills_correct: drillCorrect,
        best_avg_time_sec: bestTime,
        last_drilled_at: new Date(),
        mastery_score: masteryScore
      };
      userTrickMasteryMemory.push(m);
    }
    return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
  }

  // 1. Topics Check and Topics Queries
  if (queryText.includes('select count(*)') && queryText.includes('topics')) {
    return { rows: [{ count: 99 }], rowCount: 1 };
  }

  if (queryText.includes('select t.*, count(q.id) as questions_count') || 
      (queryText.includes('from topics') && (queryText.includes('vocab_count') || queryText.includes('tricks_count')) && !queryText.includes('where'))) {
    const userId = params[0];
    const rows = mockTopics.map(topic => {
      const vocabCount = VOCABULARY_DATA.filter(v => v.topic_name === topic.name).length || 8;
      const tricksCount = TRICK_DATA.filter(t => t.topic_name === topic.name).length || 0;
      const questionsCount = (topic.name === "Number System" || topic.name === "LCM & HCF") ? 30 : (topic.questions_count || 10);
      
      const mockTrks = mockTricks.filter(mt => mt.topic === topic.name);
      let masteryScore = 0;
      if (mockTrks.length > 0) {
        let sumMastery = 0;
        let counted = 0;
        mockTrks.forEach(mt => {
          const masteryRecord = userTrickMasteryMemory.find(x => x.trick_id === mt.id && x.user_id === userId);
          if (masteryRecord) {
            sumMastery += (masteryRecord.mastery_score || 0);
          }
          counted++;
        });
        masteryScore = counted > 0 ? Math.round(sumMastery / counted) : 0;
      }
      return {
        id: topic.id,
        section: topic.section,
        name: topic.name,
        definition: topic.definition,
        parent_topic_id: topic.parent_topic_id || null,
        vocab_count: vocabCount,
        tricks_count: tricksCount,
        questions_count: questionsCount,
        mastery_score: masteryScore
      };
    });
    return { rows, rowCount: rows.length };
  }

  if (queryText.includes('select * from topics where id =')) {
    const id = params[0];
    const topic = mockTopics.find(t => t.id === id);
    return { rows: topic ? [topic] : [], rowCount: topic ? 1 : 0 };
  }

  if (queryText.includes('select * from topics') && !queryText.includes('where')) {
    const rows = mockTopics.map(topic => ({
      ...topic,
      vocab_count: 8,
      tricks_count: 0,
      questions_count: 10,
      mastery_score: 0
    }));
    return { rows, rowCount: rows.length };
  }

  if (queryText.includes('from vocabulary where topic_id =')) {
    const topicId = params[0];
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) return { rows: [], rowCount: 0 };
    const rows = VOCABULARY_DATA.filter(v => v.topic_name === topic.name)
      .map((v, i) => ({ id: topicId * 100 + i, topic_id: topicId, term: v.term, meaning: v.meaning, example_sentence: v.example_sentence }));
    return { rows, rowCount: rows.length };
  }

  if (queryText.includes('from quick_formulas where topic_id =')) {
    const topicId = params[0];
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) return { rows: [], rowCount: 0 };
    const rows = FORMULA_DATA.filter(f => f.topic_name === topic.name)
      .map((f, i) => ({ id: topicId * 100 + i, topic_id: topicId, formula_text: f.formula_text, use_when_hint: f.use_when_hint }));
    return { rows, rowCount: rows.length };
  }

  if (queryText.includes('from sqltricks') && queryText.includes('where t.topic_id =')) {
    const topicId = params[0];
    const userId = params[1];
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) return { rows: [], rowCount: 0 };
    const topicTricks = TRICK_DATA.filter(t => t.topic_name === topic.name).map((t, i) => {
      const trickId = topicId * 100 + i + 1;
      const mastery = userTrickMasteryMemory.find(m => m.trick_id === trickId && m.user_id === userId);
      return { id: trickId, topic_id: topicId, position_order: t.position_order, name: t.name, spot_when: t.spot_when, method_steps_json: t.method_steps_json, worked_example_json: t.worked_example_json, trap_text: t.trap_text, long_vs_short_json: t.long_vs_short_json, difficulty: t.difficulty, attempts: mastery ? mastery.drills_attempted : 0, correct: mastery ? mastery.drills_correct : 0, best_avg_time_sec: mastery ? mastery.best_avg_time_sec : null, last_drilled_at: mastery ? mastery.last_drilled_at : null, mastery_score: mastery ? mastery.mastery_score : 0 };
    });
    return { rows: topicTricks, rowCount: topicTricks.length };
  }
  if (queryText.includes('where d.concept_topic_id =')) {
    return {
      rows: [
        { id: 101, day_number: 1, section: "Aptitude", difficulty: "Easy", question_text: "Which of the following is a prime number?", options_json: ["2", "4", "6", "8"] },
        { id: 102, day_number: 1, section: "Aptitude", difficulty: "Medium", question_text: "Find the unit digit of 3^41.", options_json: ["1", "3", "7", "9"] }
      ],
      rowCount: 2
    };
  }

  // Mock tests list query
  if (queryText.includes('from mock_tests')) {
    const mocksList = [];
    for (let m = 1; m <= 12; m++) {
      mocksList.push({
        id: m,
        month: m,
        name: `NQT Monthly Full Mock Test - Month ${m}`,
        sections_json: {
          foundation: { duration_minutes: 75, total_questions: 65, sections: [{ name: 'Numerical Ability', count: 20 }, { name: 'Reasoning Ability', count: 25 }, { name: 'Verbal Ability', count: 20 }] },
          advanced: { duration_minutes: 115, mcq_count: 15, coding_count: 2 }
        }
      });
    }
    return { rows: mocksList, rowCount: mocksList.length };
  }

  if (queryText.includes('from user_mock_attempts')) {
    const list = attemptsMemory.filter(a => a.user_id === params[0]);
    return { rows: list, rowCount: list.length };
  }

  if (queryText.includes('insert into user_mock_attempts')) {
    const attempt = { id: attemptsMemory.length + 1, user_id: params[0], mock_test_id: params[1], score_json: params[2], taken_at: new Date() };
    attemptsMemory.push(attempt);
    return { rows: [attempt], rowCount: 1 };
  }

  // 2. User Authentication Queries
  if (queryText.includes('select id from users where email =')) {
    const email = params[0];
    const user = usersMemory.find(u => u.email === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (queryText.includes('insert into users')) {
    // email, password_hash, name
    const id = usersMemory.length + 1;
    const user = { id, email: params[0], password_hash: params[1], name: params[2], streak: 0, last_active_day: 0 };
    usersMemory.push(user);
    return { rows: [user], rowCount: 1 };
  }

  if (queryText.includes('select * from users where email =')) {
    const email = params[0];
    const user = usersMemory.find(u => u.email === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (queryText.includes('select streak from users where id =')) {
    const userId = params[0];
    const user = usersMemory.find(u => u.id === userId);
    return { rows: user ? [{ streak: user.streak }] : [{ streak: 0 }], rowCount: 1 };
  }

  if (queryText.includes('update users set streak =')) {
    // streak, last_active_day, id
    const userId = params[2];
    const user = usersMemory.find(u => u.id === userId);
    if (user) {
      user.streak = params[0];
      user.last_active_day = params[1];
    }
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 3. Spaced Repetition (Vocab cards)
  if (queryText.includes('select * from vocab_cards where user_id =')) {
    const userId = params[0];
    const list = vocabCardsMemory.filter(c => c.user_id === userId);
    return { rows: list, rowCount: list.length };
  }

  if (queryText.includes('select id, leitner_box from vocab_cards')) {
    const cardId = params[0];
    const userId = params[1];
    const card = vocabCardsMemory.find(c => c.id === cardId && c.user_id === userId);
    return { rows: card ? [card] : [], rowCount: card ? 1 : 0 };
  }

  if (queryText.includes('insert into vocab_cards')) {
    // user_id, term, meaning, example, tamil_gloss, hindi_gloss, source
    const userId = params[0];
    const term = params[1];
    const existingIdx = vocabCardsMemory.findIndex(c => c.user_id === userId && c.term.toLowerCase() === term.toLowerCase());
    const card = {
      id: vocabCardsMemory.length + 1,
      user_id: userId,
      term,
      meaning: params[2],
      example: params[3],
      tamil_gloss: params[4],
      hindi_gloss: params[5],
      source: params[6],
      leitner_box: 1,
      next_review_date: new Date()
    };

    if (existingIdx !== -1) {
      vocabCardsMemory[existingIdx].meaning = card.meaning;
      vocabCardsMemory[existingIdx].example = card.example;
      return { rows: [vocabCardsMemory[existingIdx]], rowCount: 1 };
    } else {
      vocabCardsMemory.push(card);
      return { rows: [card], rowCount: 1 };
    }
  }

  if (queryText.includes('update vocab_cards')) {
    // leitner_box, cardId, userId
    const nextBox = params[0];
    const cardId = params[1];
    const userId = params[2];
    const card = vocabCardsMemory.find(c => c.id === cardId && c.user_id === userId);
    if (card) {
      card.leitner_box = nextBox;
      const days = Math.pow(2, nextBox - 1);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + days);
      card.next_review_date = nextDate;
    }
    return { rows: card ? [card] : [], rowCount: card ? 1 : 0 };
  }

  // 4. Day & Topic Curriculum Info
  if (queryText.includes('select d.*, t.name as topic_name')) {
    const dayNum = params[0];
    return {
      rows: [{
        day_number: dayNum,
        month: Math.ceil(dayNum / 30),
        week: Math.ceil(dayNum / 7),
        concept_topic_id: 1,
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        topic_name: "Number System",
        topic_definition: "Concepts of division, remainders, factors, and cyclicity."
      }],
      rowCount: 1
    };
  }

  if (queryText.includes('select * from vocabulary where topic_id =')) {
    return {
      rows: [
        { id: 1, topic_id: 1, term: "Cyclicity", meaning: "The repeating cycle pattern of the unit digits.", example_sentence: "The cyclicity of 2 is 4." },
        { id: 2, topic_id: 1, term: "Divisor", meaning: "A number by which another number is to be divided.", example_sentence: "In 10 divided by 2, 2 is the divisor." }
      ],
      rowCount: 2
    };
  }

  // 5. User Progress & Streak Recalculation
  if (queryText.includes('select section, attempts, correct_count from user_progress')) {
    const userId = params[0];
    const dayNum = params[1];
    const list = progressMemory.filter(p => p.user_id === userId && p.day_number === dayNum);
    return { rows: list, rowCount: list.length };
  }

  if (queryText.includes('select distinct day_number from user_progress')) {
    const userId = params[0];
    const uniqueDays = Array.from(new Set(progressMemory.filter(p => p.user_id === userId).map(p => p.day_number)))
      .sort((a, b) => b - a);
    return { rows: uniqueDays.map(d => ({ day_number: d })), rowCount: uniqueDays.length };
  }

  if (queryText.includes('insert into user_progress')) {
    // user_id, day_number, section, attempts, correct_count
    const existingIdx = progressMemory.findIndex(p => p.user_id === params[0] && p.day_number === params[1] && p.section === params[2]);
    const progress = { user_id: params[0], day_number: params[1], section: params[2], attempts: params[3], correct_count: params[4] };
    if (existingIdx !== -1) {
      progressMemory[existingIdx] = progress;
    } else {
      progressMemory.push(progress);
    }
    return { rows: [progress], rowCount: 1 };
  }

  if (queryText.includes('update user_progress')) {
    const userId = params[1];
    const dayNum = params[2];
    const section = params[3];
    const progress = progressMemory.find(p => p.user_id === userId && p.day_number === dayNum && p.section === section);
    if (progress) {
      progress.attempts = (progress.attempts || 0) + 1;
      progress.correct_count = (progress.correct_count || 0) + (params[0] === true || params[0] === 1 ? 1 : 0);
    }
    return { rows: progress ? [progress] : [], rowCount: progress ? 1 : 0 };
  }

  // 6. MCQs (questions)
  if (queryText.includes('select id, section, type, question_text, options_json, difficulty from questions')) {
    const dayNum = params[0];
    return {
      rows: [
        { id: 1, day_number: dayNum, section: "Aptitude", type: "MCQ", question_text: "Find the unit digit of 3^41.", options_json: ["1", "3", "7", "9"], correct_answer: "3", solution_explanation: "Cyclicity of 3 is 4. 41 % 4 = 1. 3^1 = 3.", difficulty: "Easy" },
        { id: 2, day_number: dayNum, section: "Reasoning", type: "MCQ", question_text: "If A+B means A is brother of B, what does A+B+C mean?", options_json: ["A is brother of C", "A is cousin of C", "A is uncle of C", "None of these"], correct_answer: "A is brother of C", solution_explanation: "Since A is brother of B and B is brother of C, A is brother of C.", difficulty: "Medium" }
      ],
      rowCount: 2
    };
  }

  if (queryText.includes('select correct_answer, solution_explanation from questions where id =')) {
    return {
      rows: [{ correct_answer: "3", solution_explanation: "Cyclicity of 3 is 4. 41 % 4 = 1. 3^1 = 3." }],
      rowCount: 1
    };
  }

  // 7. Coding Problems
  if (queryText.includes('select id, slot, title, statement, input_format, output_format, constraints, sample_tests_json, difficulty, hint, approach from coding_problems')) {
    const dayNum = params[0];
    return {
      rows: [
        {
          id: 1,
          day_number: dayNum,
          slot: 1,
          title: `Sum of Array Elements - Day ${dayNum}`,
          statement: "Write a program to calculate the sum of all elements in a 1-D array.",
          input_format: "First line contains N, size of array. Next line contains N integers.",
          output_format: "Print the sum of array elements.",
          constraints: "1 <= N <= 100",
          sample_tests_json: [{ input: "5\n1 2 3 4 5", output: "15" }],
          difficulty: "Easy",
          hint: "Loop through the array and accumulate values.",
          approach: "Initialize a sum variable to 0, iterate index 0 to N-1, add values, and print sum."
        }
      ],
      rowCount: 1
    };
  }

  if (queryText.includes('select id, day_number, slot, title, difficulty, topic_id from coding_problems')) {
    return {
      rows: [
        { id: 1, day_number: 1, slot: 1, title: "Sum of Array Elements", difficulty: "Easy", topic_id: 12 },
        { id: 2, day_number: 2, slot: 1, title: "String Reversal", difficulty: "Easy", topic_id: 13 }
      ],
      rowCount: 2
    };
  }

  // Mock Test Questions retrieval (between parameters)
  if (queryText.includes('between') && queryText.includes('from questions')) {
    const section = params[0];
    const list = [];
    for (let i = 1; i <= 25; i++) {
      list.push({
        id: 1000 + i,
        day_number: 1,
        section: section,
        type: "MCQ",
        question_text: `Mock ${section} Question ${i}`,
        options_json: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "Option A",
        solution_explanation: "This is a detailed mock explanation.",
        difficulty: "Medium"
      });
    }
    return { rows: list, rowCount: list.length };
  }

  if (queryText.includes('between') && queryText.includes('from coding_problems')) {
    return {
      rows: [
        { id: 201, day_number: 1, slot: 1, title: "Mock Coding Problem 1", statement: "Write a program to print Hello World.", input_format: "None", output_format: "Print Hello World", constraints: "None", sample_tests_json: [{ input: "", output: "Hello World" }], hidden_tests_json: [{ input: "", output: "Hello World" }], hint: "Use print statement.", approach: "Use console log or print.", solution_code_by_lang_json: { python: "print('Hello World')" }, difficulty: "Easy" }
      ],
      rowCount: 1
    };
  }

  if (queryText.includes('select solution_code_by_lang_json from coding_problems where id =')) {
    return {
      rows: [{ solution_code_by_lang_json: { python: "def sum_arr(arr):\n    return sum(arr)" } }],
      rowCount: 1
    };
  }

  // 8. English Stories & Comics
  if (queryText.includes('select * from stories where day_number =')) {
    const dayNum = params[0];
    return {
      rows: [{
        id: 1,
        day_number: dayNum,
        title: `IT Placement Journey - Day ${dayNum}`,
        level: "Beginner (A2)",
        body: "Anish is practicing his english skills today. He writes clean source code. He does not fear compile errors. Errors are just helpful messages. He fixes his loop counter. He will pass his placement exams.",
        vocab_terms_json: [
          { term: 'practice', meaning: 'Perform an activity repeatedly to improve skills.', tamil: 'பயிற்சி செய்', hindi: 'अभ्यास करना' },
          { term: 'compile error', meaning: 'An error reported by compiler during program translation.', tamil: 'தொகுப்பு பிழை', hindi: 'संकलन त्रुटி' },
          { term: 'counter', meaning: 'A variable used to keep track of iterations.', tamil: 'எண்ணி (மாறி)', hindi: 'காண்டர்' }
        ]
      }],
      rowCount: 1
    };
  }

  if (queryText.includes('select * from comics where day_number =')) {
    const dayNum = params[0];
    return {
      rows: [{
        id: 1,
        day_number: dayNum,
        title: `Anish learns variables - Day ${dayNum}`,
        panels_json: [
          { character: 'Anish', avatar: '👨‍💻', text: `I am writing code for Day ${dayNum}. It works!`, translation: `நான் நாள் ${dayNum} க்கான குறியீட்டை எழுதுகிறேன். அது வேலை செய்கிறது!` },
          { character: 'Tutor', avatar: '🤖', text: 'Excellent work! Your code variables look clean.', translation: 'சிறந்த வேலை! உங்கள் மாறி பெயர்கள் தெளிவாக உள்ளன.' }
        ]
      }],
      rowCount: 1
    };
  }

  // 9. English Listening
  if (queryText.includes('select * from listening where day_number =')) {
    const dayNum = params[0];
    return {
      rows: [{
        id: 1,
        day_number: dayNum,
        title: `Listening Skill - Session ${dayNum}`,
        transcript: "Continuous delivery is a software engineering approach. Teams produce software in short cycles. This ensures that software can be reliably released. It reduces the risk and cost of release cycles.",
        mcqs_json: [
          {
            question: "What is continuous delivery?",
            options: ["A software engineering approach", "A manual testing tool", "A database server storage method", "A cloud security protocol"],
            correct: "A software engineering approach",
            explanation: "Continuous delivery is described as a software engineering approach in the transcript."
          },
          {
            question: "How do teams produce software in continuous delivery?",
            options: ["In very long cycles", "In short cycles", "Without testing any code", "Using local server copies"],
            correct: "In short cycles",
            explanation: "The transcript mentions teams produce software in short cycles."
          }
        ]
      }],
      rowCount: 1
    };
  }

  // 10. DSA Lesson visualizer (DsaLab)
  if (queryText.includes('select * from dsa_lessons where slug =')) {
    const slug = params[0];
    return {
      rows: [{
        slug,
        title: slug.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        topic: "Data Structures",
        narration_frames_json: ["Initial state.", "Loop started.", "Step finished."],
        animation_frames_json: [{}],
        code_by_lang_json: { python: "def run(): pass" },
        broken_version_by_lang_json: { python: "def run(): pass" },
        test_cases_json: {}
      }],
      rowCount: 1
    };
  }

  // 11. Code Runner Submissions
  if (queryText.includes('insert into user_code_submissions')) {
    const submission = {
      id: submissionsMemory.length + 1,
      user_id: params[0],
      problem_id: params[1],
      language: params[2],
      code: params[3],
      passed_count: params[4],
      total_count: params[5],
      submitted_at: new Date()
    };
    submissionsMemory.push(submission);
    return { rows: [submission], rowCount: 1 };
  }

  // 12. Speaking Evaluator attempts
  if (queryText.includes('insert into speaking_attempts')) {
    const attempt = {
      id: attemptsMemory.length + 1,
      user_id: params[0],
      prompt: params[1],
      transcript: params[2],
      ai_feedback_json: params[3],
      created_at: new Date()
    };
    attemptsMemory.push(attempt);
    return { rows: [attempt], rowCount: 1 };
  }

  // 13. AI Tutor Messages and Rate Limiting Checks
  if (queryText.includes('ai_messages') && queryText.includes('count(*)')) {
    return { rows: [{ count: 0 }], rowCount: 1 };
  }

  if (queryText.includes('insert into ai_messages')) {
    return { rows: [], rowCount: 0 };
  }

  // 14. Dashboard summaries
  if (queryText.includes('select count(distinct day_number) as count from user_progress')) {
    const userId = params[0];
    const uniqueDays = new Set(progressMemory.filter(p => p.user_id === userId).map(p => p.day_number));
    return { rows: [{ count: uniqueDays.size }], rowCount: 1 };
  }

  if (queryText.includes('select section, sum(correct_count) as correct, sum(attempts) as attempts')) {
    const userId = params[0];
    const grouped = {};
    progressMemory.filter(p => p.user_id === userId).forEach(p => {
      if (!grouped[p.section]) {
        grouped[p.section] = { section: p.section, correct: 0, attempts: 0 };
      }
      grouped[p.section].correct += p.correct_count;
      grouped[p.section].attempts += p.attempts;
    });
    return { rows: Object.values(grouped), rowCount: Object.keys(grouped).length };
  }

  if (queryText.includes('having (sum(up.correct_count)::float / sum(up.attempts)::float) < 0.6')) {
    return { rows: [], rowCount: 0 };
  }

  if (queryText.includes('select day_number, count(section) as completed_sections')) {
    const userId = params[0];
    const grouped = {};
    progressMemory.filter(p => p.user_id === userId).forEach(p => {
      if (!grouped[p.day_number]) {
        grouped[p.day_number] = { day_number: p.day_number, completed_sections: 0 };
      }
      grouped[p.day_number].completed_sections++;
    });
    return { rows: Object.values(grouped), rowCount: Object.keys(grouped).length };
  }

  // Default clean empty fallback
  return { rows: [], rowCount: 0 };
}

export default {
  query: async (text, params) => {
    if (useMockDb) {
      return runMockQuery(text, params);
    }
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('connect')) {
        console.warn('PostgreSQL Database connection lost. Falling back to resilient in-memory client.');
        useMockDb = true;
        return runMockQuery(text, params);
      }
      throw err;
    }
  },
  pool
};
