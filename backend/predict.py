import sys
import json
import pandas as pd
import onnxruntime as ort

input_path = sys.argv[1]

# Load model
session = ort.InferenceSession("model.onnx")
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

# Read Excel
df = pd.read_excel(input_path)
df = df[["customer_id", "age", "purchase_history"]].fillna(0)

# Preprocess
features = df[["age", "purchase_history"]].to_numpy().astype("float32")
output = session.run([output_name], {input_name: features})[0]

# Package results
df["prediction"] = output.flatten()
print(df.to_json(orient="records"))
