const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { spawn } = require("child_process");
const xlsx = require("xlsx");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3000;

app.use(cors());

// Upload CSV or Excel → Convert if needed → Run Python → Return clustering result
app.post("/cluster", upload.single("file"), (req, res) => {
  const ext = path.extname(req.file.originalname);
  const tempPath = req.file.path;
  const inputPath = path.join(__dirname, "uploads/input.csv");

  try {
    // Convert Excel to CSV if necessary
    if (ext === ".xlsx" || ext === ".xls") {
      const workbook = xlsx.readFile(tempPath);
      const csvData = xlsx.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
      fs.writeFileSync(inputPath, csvData);
      fs.unlinkSync(tempPath);
    } else if (ext === ".csv") {
      fs.renameSync(tempPath, inputPath);
    } else {
      return res.status(400).json({ error: "Unsupported file format" });
    }

    // Run Python script
    const py = spawn("python", [path.resolve(__dirname, "../Traning/main.py")]);


    py.stdout.on("data", d => console.log("📤 Python:", d.toString()));
    py.stderr.on("data", d => console.error("❌ Python Error:", d.toString()));

    py.on("close", code => {
      if (code !== 0) return res.status(500).json({ error: "Python clustering failed" });

      const resultPath = path.join(__dirname, "clusters.json");
      fs.readFile(resultPath, "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Failed to read cluster file" });
        res.json(JSON.parse(data));
      });
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Optional endpoint to serve the clustering result
app.get("/clusters", (req, res) => {
  const filePath = path.join(__dirname, "clusters.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to load cluster summary" });
    res.json(JSON.parse(data));
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const ort = require("onnxruntime-node");
// const xlsx = require("xlsx");
// const { spawn } = require("child_process");

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(express.static("../frontend"));

// const upload = multer({ dest: "uploads/" });

// app.post("/upload", upload.single("file"), async (req, res) => {
//   const excelFile = req.file.path;
//   const imagePath = path.join(__dirname, "cluster_output.png");

//   try {
//     const workbook = xlsx.readFile(excelFile);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     const inputData = sheet.map(row => [
//       parseFloat(row.age) || 0,
//       parseFloat(row.purchase_history) || 0,
//       row.gender === "male" ? 1 : 0,
//       parseFloat(row.income) || 0,
//       parseFloat(row.tenure) || 0,
//       parseFloat(row.region) || 0
//     ]);

//     if (inputData.length === 0 || inputData[0].length !== 6) {
//       throw new Error("Invalid input data dimensions. Required: 6 features per sample.");
//     }

//     const tensor = new ort.Tensor("float32", new Float32Array(inputData.flat()), [inputData.length, 6]);

//     const session = await ort.InferenceSession.create("C:/GitHub/customer_analyze/Traning/models/model.onnx");
//     const feeds = {};
//     feeds[session.inputNames[0]] = tensor;

//     const results = await session.run(feeds);
//     const labels = results["label"].data;
//     const scores = results["scores"].data;

//     // Write temporary JSON for Python to generate image
//     const clusterData = sheet.map((row, i) => ({
//       x: Number(row.age) || 0,
//       y: Number(row.purchase_history) || 0,
//       label: Number(labels[i])
//     }));

//     fs.writeFileSync("clustering.json", JSON.stringify(clusterData));

//     // Spawn Python script to create matplotlib image
//     await new Promise((resolve, reject) => {
//       const py = spawn("python", ["generate_cluster_plot.py"]);
//       py.on("close", code => {
//         if (code === 0) resolve();
//         else reject(new Error("Image generation failed"));
//       });
//     });

//     res.json({
//       message: "✅ Prediction successful!",
//       image: "/cluster_output.png",
//       predictions: labels.map((label, i) => ({
//         customer_id: String(sheet[i].customer_id),
//         label: label,
//         scores: Array.from(scores.slice(i * 5, i * 5 + 5), v => Number(v))
//       }))
//     });
//   } catch (err) {
//     console.error("Prediction error:", err);
//     res.status(500).json({ error: "Prediction failed. Please check your file and try again." });
//   } finally {
//     fs.unlinkSync(excelFile);
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
