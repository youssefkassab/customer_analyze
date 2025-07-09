
const express = require('express');
const app = express();
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Serve static files (CSS, JS, etc.) from "public" or custom dir
app.use(express.static(path.join(__dirname, 'public'))); // optional

// ✅ Render index.ejs on /
app.get('/', (req, res) => {
  res.render('index');
});

// ✅ Handle clustering submission
app.post('/submit', (req, res) => {
  const { customers } = req.body;

  const python = spawn('python', ['../Traning/cluster.py']); // adjust path if needed
  let resultData = '';
  let errorData = '';

  python.stdin.write(JSON.stringify(customers));
  python.stdin.end();

  python.stdout.on('data', (data) => {
    resultData += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  python.on('close', (code) => {
    if (errorData) {
      console.error(`❌ Python stderr:\n${errorData}c`);
    }

    try {
      const result = JSON.parse(resultData);
      res.json(result);
    } catch (err) {
      console.error("❌ JSON parse error:", err.message);
      console.error("🔍 Raw resultData:", resultData);
      res.status(500).send("Invalid clustering response.");
    }
  });
});


// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
