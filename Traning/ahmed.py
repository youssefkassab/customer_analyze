import pandas as pd
df = pd.read_excel('C:\GitHub\customer_analyze\Traning\Online Retail.xlsx')
df['InvoiceNo'] = pd.to_numeric(df['InvoiceNo'], errors='coerce')
df = df.dropna()
df = df[df['InvoiceNo'] >= 0]  
df = df[df['Quantity'] >= 0]  
print(df)