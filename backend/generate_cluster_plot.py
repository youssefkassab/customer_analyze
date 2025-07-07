# generate_cluster_plot.py
import json
import matplotlib.pyplot as plt

# Load data
with open("clustering.json", "r") as f:
    data = json.load(f)

# Extract points
x = [row["x"] for row in data]
y = [row["y"] for row in data]
labels = [row["label"] for row in data]

# Plot
plt.figure(figsize=(8, 6))
scatter = plt.scatter(x, y, c=labels, cmap="tab10", alpha=0.7, edgecolors="k")
plt.title("Customer Clusters by Model")
plt.xlabel("Age")
plt.ylabel("Purchase History")
plt.colorbar(scatter, label="Cluster Label")
plt.grid(True)

# Save
plt.savefig("cluster_output.png", bbox_inches="tight")
