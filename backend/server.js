// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const ort = require("onnxruntime-node");
// const xlsx = require("xlsx");

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(express.static("../frontend"));

// const upload = multer({ dest: "uploads/" });

// app.post("/upload", upload.single("file"), async (req, res) => {
//   const excelFile = req.file.path;

//   try {
//     const workbook = xlsx.readFile(excelFile);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // Convert data to match model input: 6 features per row
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
//     const output = results[session.outputNames[0]].data;

//     const predictions = sheet.map((row, i) => ({
//       customer_id: String(row.customer_id),
//       age: Number(row.age),
//       purchase_history: Number(row.purchase_history),
//       gender: String(row.gender),
//       income: Number(row.income),
//       tenure: Number(row.tenure),
//       region: Number(row.region),
//       prediction: Number(output[i])
//     }));

//     res.json({ message: "Success", predictions });
//   } catch (err) {
//     console.error("Prediction error:", err);
//     res.status(500).json({ error: "Prediction failed" });
//   } finally {
//     fs.unlinkSync(excelFile);
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const ort = require("onnxruntime-node");
const xlsx = require("xlsx");
const { spawn } = require("child_process");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static("../frontend"));

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  const excelFile = req.file.path;
  const imagePath = path.join(__dirname, "cluster_output.png");

  try {
    const workbook = xlsx.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const inputData = sheet.map(row => [
      parseFloat(row.age) || 0,
      parseFloat(row.purchase_history) || 0,
      row.gender === "male" ? 1 : 0,
      parseFloat(row.income) || 0,
      parseFloat(row.tenure) || 0,
      parseFloat(row.region) || 0
    ]);

    if (inputData.length === 0 || inputData[0].length !== 6) {
      throw new Error("Invalid input data dimensions. Required: 6 features per sample.");
    }

    const tensor = new ort.Tensor("float32", new Float32Array(inputData.flat()), [inputData.length, 6]);

    const session = await ort.InferenceSession.create("C:/GitHub/customer_analyze/Traning/models/model.onnx");
    const feeds = {};
    feeds[session.inputNames[0]] = tensor;

    const results = await session.run(feeds);
    const labels = results["label"].data;
    const scores = results["scores"].data;

    // Write temporary JSON for Python to generate image
    const clusterData = sheet.map((row, i) => ({
      x: Number(row.age) || 0,
      y: Number(row.purchase_history) || 0,
      label: Number(labels[i])
    }));

    fs.writeFileSync("clustering.json", JSON.stringify(clusterData));

    // Spawn Python script to create matplotlib image
    await new Promise((resolve, reject) => {
      const py = spawn("python", ["generate_cluster_plot.py"]);
      py.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error("Image generation failed"));
      });
    });

    res.json({
      message: "✅ Prediction successful!",
      image: "/cluster_output.png",
      predictions: labels.map((label, i) => ({
        customer_id: String(sheet[i].customer_id),
        label: Number(label),
        scores: Array.from(scores.slice(i * 5, i * 5 + 5)).map(Number)
      }))
    });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Prediction failed. Please check your file and try again." });
  } finally {
    fs.unlinkSync(excelFile);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});