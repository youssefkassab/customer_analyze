import onnxruntime as ort
import numpy as np
import pandas as pd

# Load ONNX session once
session = ort.InferenceSession("model/model.onnx")

def preprocess(df: pd.DataFrame) -> np.ndarray:
    # You can adjust this logic as per `model_script.ipynb`
    # Assume model expects 'age' and 'purchase_history' as numerical inputs
    df = df[["age", "purchase_history"]]
    df = df.fillna(0)  # Handle missing values
    return df.to_numpy().astype(np.float32)

def predict(input_array: np.ndarray):
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    outputs = session.run([output_name], {input_name: input_array})
    return outputs[0].tolist()
