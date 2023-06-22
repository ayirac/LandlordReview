import mysql.connector

# Connect to the MySQL database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="12345",
    database="landlord"
)

# Create a cursor object to interact with the database
cursor = db.cursor()

# Select all records from the table
cursor.execute("SELECT * FROM PROPERTIES")

# Fetch all the selected rows
rows = cursor.fetchall()

# Iterate over each row and update the address field
for row in rows:
    row_id = row[0]
    address = row[1]

    # Replace "Oregon" with "OR" in the address field
    new_address = address.replace("Oregon", "OR")

    # Remove ", U" from the address field
    new_address = new_address.replace(", U", "")

    # Update the row with the new address
    update_query = "UPDATE PROPERTIES SET Address = %s WHERE ID = %s"
    cursor.execute(update_query, (new_address, row_id))
    db.commit()

# Close the database connection
db.close()