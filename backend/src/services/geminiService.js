const { GoogleGenerativeAI } = require('@google/generative-ai');

const VALID_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const VALID_TAGS = [
  'Arrays',
  'Strings',
  'Recursion',
  'OOP',
  'GUI',
  'Networking',
  'File Handling',
  'Math',
  'Sorting',
  'Graph',
  'Dynamic Programming',
  'Tree',
  'Stack',
  'Queue',
  'Hash Table',
  'Binary Search',
  'Two Pointers',
  'Greedy',
  'Bit Manipulation',
  'Matrix',
];

async function analyseChallenge(title, problem) {
  const fallback = inferChallengeMeta(title, problem);
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    console.warn('GEMINI_API_KEY is not set; using local challenge analysis.');
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.15,
        responseMimeType: 'application/json',
      },
    });

    const prompt = buildPrompt(title, problem);
    const result = await model.generateContent(prompt);
    const parsed = parseJson(result.response.text());

    return sanitizeAnalysis(parsed, fallback);
  } catch (err) {
    console.error('AI challenge analysis error:', err.message);
    return fallback;
  }
}

function buildPrompt(title, problem) {
  return `
You classify coding challenges for a competitive programming website.
Return only a JSON object with this exact shape:
{"difficulty":"Beginner|Intermediate|Advanced","tags":["Tag","Tag"]}

Allowed tags:
${VALID_TAGS.join(', ')}

Rules:
- Choose 2 to 5 specific tags from the allowed list.
- Prefer algorithm and data-structure tags over generic tags.
- Use "Beginner" for basic input/output, loops, conditionals, simple math, or direct string/array traversal.
- Use "Intermediate" for common data structures, sorting with reasoning, recursion, binary search, greedy, hash tables, two pointers, or moderate OOP.
- Use "Advanced" for dynamic programming with non-trivial state, graph traversal/pathfinding, tree algorithms, complex optimization, or system-style problems.
- Do not invent tags.

Title:
${title}

Problem:
${problem}
`.trim();
}

function parseJson(text) {
  const cleaned = String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

function sanitizeAnalysis(parsed, fallback) {
  const difficulty = VALID_DIFFICULTIES.includes(parsed?.difficulty)
    ? parsed.difficulty
    : fallback.difficulty;

  const tags = Array.isArray(parsed?.tags)
    ? parsed.tags
        .map(tag => String(tag).trim())
        .filter(tag => VALID_TAGS.includes(tag))
    : [];

  const uniqueTags = [...new Set(tags)].slice(0, 5);

  return {
    difficulty,
    tags: uniqueTags.length >= 2 ? uniqueTags : fallback.tags,
  };
}

function inferChallengeMeta(title, problem) {
  const text = `${title} ${problem}`.toLowerCase();
  const tags = [];

  addTag(tags, text, 'Dynamic Programming', ['dynamic programming', 'dp', 'memo', 'subsequence', 'knapsack']);
  addTag(tags, text, 'Graph', ['graph', 'node', 'edge', 'path', 'shortest', 'dfs', 'bfs']);
  addTag(tags, text, 'Tree', ['tree', 'binary tree', 'root', 'leaf']);
  addTag(tags, text, 'Binary Search', ['binary search', 'sorted array', 'log n']);
  addTag(tags, text, 'Hash Table', ['hash', 'frequency', 'map', 'dictionary', 'duplicate']);
  addTag(tags, text, 'Two Pointers', ['two pointer', 'two-pointer', 'sliding window']);
  addTag(tags, text, 'Greedy', ['greedy', 'minimum number', 'maximum profit', 'optimal']);
  addTag(tags, text, 'Stack', ['stack', 'parentheses', 'bracket']);
  addTag(tags, text, 'Queue', ['queue']);
  addTag(tags, text, 'Matrix', ['matrix', 'grid', '2d']);
  addTag(tags, text, 'Sorting', ['sort', 'sorted', 'order']);
  addTag(tags, text, 'Strings', ['string', 'substring', 'palindrome', 'character']);
  addTag(tags, text, 'Arrays', ['array', 'list', 'sequence']);
  addTag(tags, text, 'Math', ['sum', 'number', 'integer', 'prime', 'gcd', 'modulo']);
  addTag(tags, text, 'Recursion', ['recursion', 'recursive']);
  addTag(tags, text, 'OOP', ['class', 'object', 'inheritance']);
  addTag(tags, text, 'File Handling', ['file', 'read from', 'write to']);
  addTag(tags, text, 'Networking', ['socket', 'http', 'network']);
  addTag(tags, text, 'GUI', ['button', 'window', 'interface', 'form']);

  const advancedSignals = ['dynamic programming', 'graph', 'shortest path', 'tree', 'optimization'];
  const beginnerSignals = ['print', 'basic', 'simple', 'sum', 'average', 'area', 'even', 'odd'];

  const difficulty = advancedSignals.some(token => text.includes(token))
    ? 'Advanced'
    : beginnerSignals.some(token => text.includes(token)) && problem.length < 700
      ? 'Beginner'
      : 'Intermediate';

  return {
    difficulty,
    tags: tags.length ? tags.slice(0, 5) : ['Arrays', 'Math'],
  };
}

function addTag(tags, text, tag, keywords) {
  if (tags.includes(tag)) return;
  if (keywords.some(keyword => text.includes(keyword))) tags.push(tag);
}

module.exports = { analyseChallenge };
