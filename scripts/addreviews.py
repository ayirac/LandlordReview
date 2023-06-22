import random
import string
import mysql.connector

# Database connection configuration
db_config = {
    'user': 'root',
    'password': '12345',
    'host': 'localhost',
    'database': 'landlord'
}

# Number of apartments
n = 619

# Generate random attributes and insert into the Attributes table
def populate_attributes():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    for i in range(1, n+1):
        property_id = i
        hoa = random.choice([0, 1])  # Random HOA value (0 or 1)
        view = ''.join(random.choices(string.ascii_letters, k=10))  # Random view value
        cost = round(random.uniform(1000, 5000), 2)  # Random cost value between 1000 and 5000
        avg_rating = round(random.uniform(1, 5), 2)  # Random average rating between 1 and 5
        bathrooms = random.randint(1, 4)  # Random number of bathrooms (1 to 4)
        bedrooms = random.randint(1, 3)  # Random number of bedrooms (1 to 3)
        name = ''.join(random.choices(string.ascii_letters, k=10))  # Random name value
        rating_count = random.randint(1, 30)  # Random rating count (1 to 30)

        query = "INSERT INTO Attributes (PropertyID, HOA, View, Cost, AvgRating, Bathrooms, Bedrooms, Name, RatingCount) " \
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
        values = (property_id, hoa, view, cost, avg_rating, bathrooms, bedrooms, name, rating_count)
        cursor.execute(query, values)

    conn.commit()
    cursor.close()
    conn.close()


# Generate random reviews and insert into the Reviews table
def populate_reviews():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    for i in range(1, n+1):
        property_id = i

        # Get the current rating count for the property from the Attributes table
        cursor.execute("SELECT RatingCount FROM Attributes WHERE PropertyID = %s", (property_id,))
        result = cursor.fetchone()
        current_rating_count = result[0] if result else 0

        review_count = random.randint(1, 30)  # Random number of reviews (1 to 30)

        for j in range(review_count):
            reviewer_name = ''.join(random.choices(string.ascii_letters, k=8))  # Random reviewer name
            review = ''.join(random.choices(string.ascii_letters, k=20))  # Random review text
            rating = round(random.uniform(1, 5), 2)  # Random rating between 1 and 5

            query = "INSERT INTO Reviews (PropertyID, ReviewerName, Review, Rating) " \
                    "VALUES (%s, %s, %s, %s)"
            values = (property_id, reviewer_name, review, rating)
            cursor.execute(query, values)

        # Update the RatingCount in the Attributes table
        updated_rating_count = current_rating_count + review_count
        cursor.execute("UPDATE Attributes SET RatingCount = %s WHERE PropertyID = %s",
                       (updated_rating_count, property_id))

    conn.commit()
    cursor.close()
    conn.close()

populate_reviews()