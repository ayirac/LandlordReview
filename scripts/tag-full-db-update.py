import re
import mysql.connector
import random

cnx = mysql.connector.connect(
    host='localhost',
    user='root',
    password='12345',
    database='landlord'
)

cursor = cnx.cursor()


query = f"SELECT * FROM PropertyTags"
cursor.execute(query)

result = cursor.fetchall()

rows, cols = (619, 11)
arr = [[0] * cols for _ in range(rows)]

# Process the result
# Process the result
for row in result:
    prop_id = row[0] 
    tag_id = row[1]
    arr[prop_id-1][tag_id-1] += 1

# Access all elements in the second row

filteredArr = []

for row_num, row in enumerate (arr):
    print(row_num+1)
    tagsForProp = []
    for col_num, col_val in enumerate(row):
        if col_val == 1:
            print(col_num + 1)
            tagsForProp.append(col_num+1)
    filteredArr.append(tagsForProp)

for x in filteredArr:
    print(x)

# Insert data into PropFullTags table
for prop_id, tags in enumerate(filteredArr, start=1):
    for tag_id in tags:
        query = f"INSERT INTO PropFullTags (PropID, TagID, Count) VALUES ({prop_id}, {tag_id}, 1)"
        cursor.execute(query)
        print(query)

# Commit the changes
cnx.commit()


cnx.close()
