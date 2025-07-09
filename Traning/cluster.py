# import sys
# import json
# import pandas as pd
# from sklearn.cluster import KMeans
# from sklearn.preprocessing import MinMaxScaler
# from sklearn.decomposition import PCA
# import matplotlib.pyplot as plt
# import uuid
# import os
# import base64

# # Read JSON from stdin
# input_data = sys.stdin.read()
# customers = json.loads(input_data)
# df = pd.DataFrame(customers)
# print("Python script started", file=sys.stderr)
# # Convert to numeric
# df[['InvoiceNo', 'Quantity', 'UnitPrice', 'line_total', 'month']] = df[
#     ['InvoiceNo', 'Quantity', 'UnitPrice', 'line_total', 'month']
# ].astype(float)

# # Normalize
# scaler = MinMaxScaler()
# features_normalized = scaler.fit_transform(df[['InvoiceNo', 'Quantity', 'UnitPrice', 'line_total', 'month']])

# # KMeans
# kmeans = KMeans(n_clusters=5, random_state=1, n_init=10)
# df['cluster'] = kmeans.fit_predict(features_normalized)

# # PCA for 2D plot
# pca = PCA(n_components=2)
# reduced = pca.fit_transform(features_normalized)

# # Plot and save image
# img_id = str(uuid.uuid4())
# img_filename = f"cluster_plot_{img_id}.png"

# plt.figure(figsize=(10, 6))
# scatter = plt.scatter(reduced[:, 0], reduced[:, 1], c=df['cluster'], cmap='viridis', s=50, alpha=0.6)
# plt.title("Customer Clusters (KMeans)")
# plt.xlabel("PCA Component 1")
# plt.ylabel("PCA Component 2")
# plt.colorbar(scatter, label='Cluster Label')
# plt.grid(True)
# plt.tight_layout()
# plt.savefig(img_filename)
# plt.close()

# # Encode plot to base64
# with open(img_filename, 'rb') as f:
#     img_base64 = base64.b64encode(f.read()).decode('utf-8')
# os.remove(img_filename)

# # Output
# output = {
#     "clusters": df[['CustomerID', 'cluster']].to_dict(orient='records'),
#     "plot_base64": img_base64
# }

# print("Clustering complete, returning result", file=sys.stderr)
# print(json.dumps(output))

import sys
import json
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import uuid
import os
import base64

# Step 1: Read JSON from stdin
input_data = sys.stdin.read()
customers = json.loads(input_data)
df = pd.DataFrame(customers)
print("✅ Python script started", file=sys.stderr)

# Step 2: Preprocessing
df[['InvoiceNo', 'Quantity', 'UnitPrice', 'line_total', 'month']] = df[
    ['InvoiceNo', 'Quantity', 'UnitPrice', 'line_total', 'month']
].astype(float)

features = df[['InvoiceNo', 'Quantity', 'UnitPrice', 'line_total', 'month']]
scaler = MinMaxScaler()
features_scaled = scaler.fit_transform(features)

# Step 3: Silhouette scores for different k
silhouette_scores = []
k_range = range(2, 8)

for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=1, n_init=10)
    labels = kmeans.fit_predict(features_scaled)
    score = silhouette_score(features_scaled, labels)
    silhouette_scores.append(score)

# Step 4: Plot silhouette scores
img_id = str(uuid.uuid4())
img_filename = f"silhouette_plot_{img_id}.png"

plt.figure(figsize=(8, 5))
plt.plot(k_range, silhouette_scores, marker='o')
plt.title("Silhouette Score vs Number of Clusters")
plt.xlabel("Number of Clusters (k)")
plt.ylabel("Silhouette Score")
plt.grid(True)
plt.tight_layout()
plt.savefig(img_filename)
plt.close()

# Step 5: Convert plot to base64
with open(img_filename, 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode('utf-8')
os.remove(img_filename)

# ✅ Step 6: Output includes dummy `clusters` field to avoid frontend crash
output = {
    "clusters": [],  # dummy, avoid frontend failure
    "plot_base64": img_base64
}
print("✅ Clustering complete, returning result", file=sys.stderr)
print(json.dumps(output))
