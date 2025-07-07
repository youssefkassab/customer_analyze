import onnx

model = onnx.load("C:\GitHub\customer_analyze\Traning\models\model.onnx")
inputs = model.graph.input
outputs = model.graph.output

print("Inputs:")
for inp in inputs:
    print(f"- {inp.name}: {[d.dim_value for d in inp.type.tensor_type.shape.dim]}")

print("\nOutputs:")
for out in outputs:
    print(f"- {out.name}: {[d.dim_value for d in out.type.tensor_type.shape.dim]}")
