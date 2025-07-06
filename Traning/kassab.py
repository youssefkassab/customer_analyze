
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_excel("D:\youssef kassab\Downloads\Ai\P2\customer_analyze\Traning\Online Retail.xlsxpip")
print(df.head())       # first 5 rows
print(df.info())       # types, nulls
print(df.describe())   # statistical summary

df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
df['CustomerID'] = df['CustomerID'].astype(str)  # ensure consistency
df['line_total'] = df['Quantity'] * df['UnitPrice']
total_spend = df.groupby('CustomerID')['line_total'].sum().reset_index()
total_spend.rename(columns={'line_total': 'total_spend'}, inplace=True)
purchase_freq = df.groupby('CustomerID')['InvoiceNo'].nunique().reset_index()
purchase_freq.rename(columns={'InvoiceNo': 'purchase_frequency'}, inplace=True)
customer_df = total_spend.merge(purchase_freq, on='CustomerID')
customer_df['avg_order_value'] = customer_df['total_spend'] / customer_df['purchase_frequency']
