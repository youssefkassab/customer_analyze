from sqlalchemy import create_engine, Column, Integer, Float, String, MetaData, Table
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = "sqlite:///./customer_data.db"
Base = declarative_base()

class CustomerRecord(Base):
    __tablename__ = "customer_data"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String)
    age = Column(Integer)
    purchase_history = Column(Float)
    churn_prediction = Column(Float)

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
