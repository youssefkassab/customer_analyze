
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_excel("D:\youssef kassab\Downloads\Ai\P2\customer_analyze\Traning\Online Retail.xlsxpip")
print(df.head())       # first 5 rows
print(df.info())       # types, nulls
print(df.describe())   # statistical summary

