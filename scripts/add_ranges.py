import mysql.connector
import random

cnx = mysql.connector.connect(
    host='localhost',
    user='root',
    password='12345',
    database='landlord'
)

cursor = cnx.cursor()

# Step 1: Iterate through each property
cursor.execute("SELECT ID FROM Properties")
property_ids = cursor.fetchall()

for property_id in property_ids:
    property_id = property_id[0]

    # Step 2: Generate 1-3 floor plans with random data
    num_floor_plans = random.randint(1, 3)
    for _ in range(num_floor_plans):
        # Generate random data for the floor plan
        security_deposit = random.uniform(500, 2000)
        sq_footage = random.uniform(500, 2000)
        bedrooms = random.randint(1, 3)
        bathrooms = random.randint(1, 3)
        images = "image_path"
        monthly_cost = random.uniform(1000, 3000)

        # Step 3: Insert the floor plan into the FloorPlans table
        cursor.execute(f"INSERT INTO FloorPlans (PropertyID, SecurityDeposit, SqFootage, Bedrooms, Bathrooms, Images, MonthlyCost) \
                        VALUES ({property_id}, {security_deposit}, {sq_footage}, {bedrooms}, {bathrooms}, '{images}', {monthly_cost})")

# Step 4: Update the bed, bath, sqfootage, and price ranges in the Properties table
# Step 4: Update the bed, bath, sqfootage, and price ranges in the Properties table
cursor.execute("UPDATE Properties AS p \
                JOIN (SELECT PropertyID, \
                              CONCAT(MIN(Bedrooms), '-', MAX(Bedrooms)) AS BedRange, \
                              CONCAT(MIN(Bathrooms), '-', MAX(Bathrooms)) AS BathRange, \
                              CONCAT(MIN(SqFootage), '-', MAX(SqFootage)) AS SqFootageRange, \
                              CONCAT(MIN(MonthlyCost), '-', MAX(MonthlyCost)) AS PriceRange \
                      FROM FloorPlans \
                      GROUP BY PropertyID) AS fp ON p.ID = fp.PropertyID \
                SET p.BedRange = fp.BedRange, \
                    p.BathRange = fp.BathRange, \
                    p.SqFootageRange = fp.SqFootageRange, \
                    p.PriceRange = fp.PriceRange")


cnx.commit()
cnx.close()
