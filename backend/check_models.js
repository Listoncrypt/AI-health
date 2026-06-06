const apiKey = process.env.GEMINI_API_KEY || '';

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Available Models:');
    data.models.forEach(m => console.log('-', m.name));
  } catch (err) {
    console.error('Request error:', err.message);
  }
}

listModels();
