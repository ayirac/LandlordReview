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

with open("./output1.txt", "r") as file:
    lines = file.readlines()
    for line in lines:
        print(line)
        pattern = r"\d+\. (\d+ [A-Za-z\d\s]+, [A-Za-z\s]+, [A-Za-z]+ \d+) \((-*\d+\.*\d*) LONG, (\d+\.*\d*) LAT\)"
        match = re.match(pattern, line)
        address = match.group(1)
        long = match.group(2)
        lat = match.group(3)

        # Generate random values for attributes
        name = "Property " + str(random.randint(1, 100))
        avgRating = random.uniform(1.0, 5.0)
        ratingCount = random.randint(0, 100)
        util = random.choice([0, 1])
        term = random.choice(["6 months", "1 year", "2 years"])
        pool = random.choice([0, 1])
        hvac = random.choice([0, 1])
        gym = random.choice([0, 1])
        parking = random.choice([0, 1])
        furnished = random.choice([0, 1])
        dishwasher = random.choice([0, 1])
        carcharger = random.choice([0, 1])
        gated = random.choice([0, 1])
        accessibility = random.choice([0, 1])
        hoa = random.choice([0, 1])
        nearby = "Nearby location " + str(random.randint(1, 10))

        query = f"INSERT INTO Properties \
            (Name, X, Y, Address, AvgRating, RatingCount, Utilities, LeaseTerm, Pool, \
            HVAC, Gym, Parking, Furnished, Dishwasher, CarCharger, Gated, Accessibility, HOA, Nearby) \
            VALUES ('{name}', {long}, {lat}, '{address}', {avgRating}, {ratingCount}, {util}, '{term}', \
            {pool}, {hvac}, {gym}, {parking}, {furnished}, {dishwasher}, {carcharger}, {gated}, {accessibility}, \
            {hoa}, '{nearby}')"
        #print(query);
        cursor.execute(query)
        cnx.commit()

cnx.close()
