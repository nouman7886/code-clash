// ── Gemini AI Service ─────────────────────────────────────────────────────────
// Auto-analyses coding challenges and assigns difficulty + tags.
// Falls back gracefully if the API key is missing or the call fails.

const { GoogleGenerativeAI } = require('@google/generative-ai');

const VALID_TAGS = [
  'Arrays', 'Strings', 'Recursion', 'OOP', 'GUI', 'Networking',
  'File Handling', 'Math', 'Sorting', 'Graph', 'Dynamic Programming',
  'Tree', 'Stack', 'Queue', 'Hash Table', 'Binary Search',
  'Two Pointers', 'Greedy', 'Bit Manipulation', 'Matrix',
];

/**
 * Analyses a challenge and returns { difficulty, tags }.
 * Never throws — always returns a usable default on failure.
 */
async function analyseChallenge(title, problem) {
  const key = process.env.GEMINI_API_KEY;

  // ── No key → use defaults ─────────────────────────────────────────────────
  if (!key || key === 'AIzaSyA5GteJQXAF7u1LgJWnopQCPbUdW8UiLsA') {
    console.warn('⚠️  GEMINI_API_KEY not set — returning default analysis');
    return { difficulty: 'Intermediate', tags: ['Arrays', 'Strings'] };
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a coding challenge analyser. Read the challenge below and respond ONLY with
a single valid JSON object — no markdown, no explanation, no code fences.

Challenge Title: ${title}
Problem Statement: ${problem}

Respond with exactly this shape:
{
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "tags": [2-5 items from: ${VALID_TAGS.join(', ')}]
}

Guidelines:
- Beginner:      simple loops, basic I/O, straightforward math
- Intermediate:  data structures, OOP patterns, moderate algorithms
- Advanced:      graph theory, dynamic programming, complex system design
`;

    const result  = await model.generateContent(prompt);
    const text    = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    const difficulty = ['Beginner', 'Intermediate', 'Advanced'].includes(parsed.difficulty)
      ? parsed.difficulty
      : 'Intermediate';

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter(t => VALID_TAGS.includes(t)).slice(0, 5)
      : ['Arrays'];

    return { difficulty, tags };
  } catch (err) {
    console.error('Gemini analysis error:', err.message);
    return { difficulty: 'Intermediate', tags: ['Arrays', 'Strings'] };
  }
}

module.exports = { analyseChallenge };