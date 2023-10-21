import pandas as pd

# Define the order of months
months_order = ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February']

# Read the CSV file
df = pd.read_csv('../data/grouped_chart.csv')

# Convert 'Month' to a categorical type
df['Month'] = pd.Categorical(df['Month'], categories=months_order, ordered=True)

# Group by 'Month' and sum 'Total Commutes'
df_grouped = df.groupby('Month')['Total Commutes'].sum().reset_index()

# Sort by 'Month'
df_grouped = df_grouped.sort_values('Month')

# Write the result to a new CSV file
df_grouped.to_csv('../data/line_chart.csv', index=False)