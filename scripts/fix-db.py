import mysql.connector

cnx = mysql.connector.connect(
    host='localhost',
    user='root',
    password='12345',
    database='landlord'
)

cursor = cnx.cursor()

cursor.execute("SELECT ID FROM Properties")
property_ids = cursor.fetchall()

# Iterate through each property ID
for property_id in property_ids:
    property_id = property_id[0]  # Extract the property ID from the tuple

    # Fetch all the reviews associated with the current property ID from the Reviews table
    cursor.execute("SELECT Rating FROM Reviews WHERE PropertyID = %s", (property_id,))
    reviews = cursor.fetchall()

    # Calculate the average rating
    if reviews:
        avg_rating = sum(review[0] for review in reviews) / len(reviews)
    else:
        avg_rating = 0

    # Update the AvgRating column in the Properties table with the calculated average rating
    avg_rating_str = "{:.2f}".format(avg_rating)  # Convert avg_rating to string representation
    cursor.execute("UPDATE Properties SET AvgRating = %s WHERE ID = %s", (avg_rating_str, property_id))

# Commit the changes and close the connection
cnx.commit()
cnx.close()
