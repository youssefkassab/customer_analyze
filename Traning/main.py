from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
from sqlalchemy.orm import sessionmaker
from database import engine, CustomerRecord
from model_utils import preprocess, predict
from io import BytesIO

app = FastAPI()
SessionLocal = sessionmaker(bind=engine)

@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file format")

    content = await file.read()
    df = pd.read_excel(BytesIO(content))

    # Validate expected columns
    expected = {"customer_id", "age", "purchase_history"}
    if not expected.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"Missing columns. Expected: {expected}")

    input_array = preprocess(df)
    predictions = predict(input_array)

    # Save to DB
    db = SessionLocal()
    for i, row in df.iterrows():
        db_record = CustomerRecord(
            customer_id=row["customer_id"],
            age=row["age"],
            purchase_history=row["purchase_history"],
            churn_prediction=predictions[i][0] if isinstance(predictions[i], list) else predictions[i]
        )
        db.add(db_record)
    db.commit()
    db.close()

    return {
        "message": "File processed successfully",
        "predictions": predictions
    }
