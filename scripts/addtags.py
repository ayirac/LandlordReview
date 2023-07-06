import mysql.connector
import random

cnx = mysql.connector.connect(
    host='localhost',
    user='root',
    password='12345',
    database='landlord'
)

cursor = cnx.cursor()

# Iterate through properties
ind = 1
while (ind <= 619):
    # Give p a random assortment of tags (1-11)
    unique_values = list(range(1, 12))  # List of unique values from 1 to 11
    list_size = random.randint(1, 11)  # Random size between 1 and 11
    randomTags = random.sample(unique_values, list_size) 
    # Add an entry for each tag to PropertyTags table
    for t in randomTags:
        query = f'INSERT INTO PropertyTags (PropertyID, TagID) VALUES ({ind}, {t})'
        print(query)
        cursor.execute(query)
    ind += 1

cnx.commit()

cnx.close()
