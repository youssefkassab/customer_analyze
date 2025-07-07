
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_excel("./Traning/Online Retail.xlsx")
df['InvoiceNo'] = pd.to_numeric(df['InvoiceNo'], errors='coerce')
df = df.dropna()
df = df[df['InvoiceNo'] >= 0]  
df = df[df['Quantity'] >= 0]  
df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
df['CustomerID'] = df['CustomerID'].astype(str)  # ensure consistency
df['line_total'] = df['Quantity'] * df['UnitPrice']
df['day'] = df['InvoiceDate'].dt.day_name()
df['month'] = df['InvoiceDate'].dt.month
df['year'] = df['InvoiceDate'].dt.year
df['time_24h'] = df['InvoiceDate'].dt.strftime('%H:%M')
total_spend = df.groupby('CustomerID')['line_total'].sum().reset_index()
total_spend.rename(columns={'line_total': 'total_spend'}, inplace=True)
purchase_freq = df.groupby('CustomerID')['InvoiceNo'].nunique().reset_index()
purchase_freq.rename(columns={'InvoiceNo': 'purchase_frequency'}, inplace=True)
customer_df = total_spend.merge(purchase_freq, on='CustomerID')
customer_df['avg_order_value'] = customer_df['total_spend'] / customer_df['purchase_frequency']

print(df.head())       # first 5 rows
print(df.info())       # types, nulls
print(df.describe())   # statistical summary
# preprocessor = ColumnTransformer(
#     transformers=[
#         ('assignment_tfidf', TfidfVectorizer(ngram_range=(1,2),min_df=3,max_df=0.85,max_features=8000), 'assignment'),
#         ('full_text_tfidf', TfidfVectorizer(ngram_range=(1,2),min_df=3,max_df=0.85,max_features=8000), 'full_text')
#     ]
# )