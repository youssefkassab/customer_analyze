    # from fastapi import FastAPI, UploadFile, File, HTTPException
    # import pandas as pd
    # from sqlalchemy.orm import sessionmaker
    # from database import engine, CustomerRecord
    # from model_utils import preprocess, predict
    # from io import BytesIO

    # app = FastAPI()
    # SessionLocal = sessionmaker(bind=engine)

    # @app.post("/upload/")
    # async def upload_excel(file: UploadFile = File(...)):
    #     if not file.filename.endswith((".xls", ".xlsx")):
    #         raise HTTPException(status_code=400, detail="Invalid file format")

    #     content = await file.read()
    #     df = pd.read_excel(BytesIO(content))

    #     # Validate expected columns
    #     expected = {"customer_id", "age", "purchase_history"}
    #     if not expected.issubset(df.columns):
    #         raise HTTPException(status_code=400, detail=f"Missing columns. Expected: {expected}")

    #     input_array = preprocess(df)
    #     predictions = predict(input_array)

    #     # Save to DB
    #     db = SessionLocal()
    #     for i, row in df.iterrows():
    #         db_record = CustomerRecord(
    #             customer_id=row["customer_id"],
    #             age=row["age"],
    #             purchase_history=row["purchase_history"],
    #             churn_prediction=predictions[i][0] if isinstance(predictions[i], list) else predictions[i]
    #         )
    #         db.add(db_record)
    #     db.commit()
    #     db.close()

    #     return {
    #         "message": "File processed successfully",
    #         "predictions": predictions
    #     }



    # auto_kmeans_summary.py
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import json
import os

def auto_cluster_summary(df, feature_cols, k_range=range(2, 10)):
    X = df[feature_cols].copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    best_k = k_range[0]
    best_score = -1
    for k in k_range:
        model = KMeans(n_clusters=k, random_state=42)
        labels = model.fit_predict(X_scaled)
        score = silhouette_score(X_scaled, labels)
        if score > best_score:
            best_k = k
            best_score = score

    kmeans = KMeans(n_clusters=best_k, random_state=42)
    labels = kmeans.fit_predict(X_scaled)

    # ✅ Export to ONNX
    initial_type = [('float_input', FloatTensorType([None, len(feature_cols)]))]
    onnx_model = convert_sklearn(kmeans, initial_types=initial_type)

    with open("model.onnx", "wb") as f:
        f.write(onnx_model.SerializeToString())
    print("✅ model.onnx written")

    # ✅ Build cluster descriptions
    df['Cluster'] = labels
    cluster_stats = df.groupby('Cluster')[feature_cols].mean().round(2)
    cluster_sizes = df['Cluster'].value_counts().sort_index()
    overall_means = df[feature_cols].mean()

    clusters = []
    for cluster_id in cluster_stats.index:
        desc = []
        for col in feature_cols:
            val = cluster_stats.loc[cluster_id, col]
            avg = overall_means[col]
            if val > avg * 1.2:
                desc.append(f"high {col}")
            elif val < avg * 0.8:
                desc.append(f"low {col}")
            else:
                desc.append(f"avg {col}")
        clusters.append({
            "Cluster": int(cluster_id),
            "Num_Elements": int(cluster_sizes[cluster_id]),
            "Description": ", ".join(desc),
            "Statistics": cluster_stats.loc[cluster_id].to_dict()
        })

    return clusters, best_k

if __name__ == "__main__":
    try:
        input_path = "uploads/input.csv"
        if not os.path.exists(input_path):
            raise FileNotFoundError("Missing uploads/input.csv")

        df = pd.read_csv(input_path)
        features = ['total_spend', 'purchase_frequency', 'avg_order_value']

        missing = [col for col in features if col not in df.columns]
        if missing:
            raise ValueError(f"Missing columns: {', '.join(missing)}")

        clusters, best_k = auto_cluster_summary(df, features)

        with open("clusters.json", "w") as f:
            json.dump({"best_k": best_k, "clusters": clusters}, f)

        print("✅ clusters.json written")

    except Exception as e:
        print("❌", str(e))
        exit(1)
