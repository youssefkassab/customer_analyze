import pandas as pd
df = pd.read_csv("C:\\GitHub\\customer_analyze\\Traning\\datasets\\Online_Retail_cleaned.csv")

df = df.iloc[:10000]
df.to_excel(r"C:\GitHub\customer_analyze\output.xlsx", index=False)

