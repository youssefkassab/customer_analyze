// const express = require('express');
// const onnx = require('onnxruntime-node');
// const app = express();
// const path = require('path');
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
// app.use(express.json());
// app.use(express.static(path.join(__dirname, '/../frontend')));
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Methods", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });


// app.post('/submit', (req, res) => {
//     const { headers, rows } = req.body;
//     console.log("Received data:", headers, rows.length);
//     res.send('✅ Data received successfully.');
//   });
const express = require('express');
const path = require('path');
const onnx = require('onnxruntime-node');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/submit', (req, res) => {
  const { headers, rows } = req.body;
  console.log("Received data:", headers, rows.length);
  res.send('✅ Data received successfully.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
