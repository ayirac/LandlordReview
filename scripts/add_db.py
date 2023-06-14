# 1. 2099 Van Ness Avenue, Klamath County, Oregon 97601, U (-121.77436077785265 LONG, 42.24296157686674 LAT)

import re
import mysql.connector

cnx = mysql.connector.connect(
    host = 'localhost',
    user = 'root',
    password = '12345',
    database = 'landlord'
)

cursor = cnx.cursor()

with open("./output.txt", "r") as file:
    lines = file.readlines()
    for line in lines:
        # 1. 2099 Van Ness Avenue, Klamath County, Oregon 97601, U (-121.77436077785265 LONG, 42.24296157686674 LAT)
        pattern = r"\d+\. (\d+ [A-Za-z\d\s]+, [A-Za-z\s]+, [A-Za-z]+ \d+, [A-Za-z]+) \((-*\d+\.*\d*) LONG, (\d+\.*\d*) LAT\)"
        print(line)
        match = re.match(pattern, line)
        address = match.group(1)
        long = match.group(2)
        lat = match.group(3)

        #print(address)
        #print(long)
        #print(lat)

        query = f"INSERT INTO PROPERTIES (Address, X, Y) VALUES ('{address}', {long}, {lat})"
        cursor.execute(query)
        cnx.commit()

    

    
cursor.close()
cnx.close()

    # just adda all above to sql query & send to database ;P. oh yeah use prepared statements/sanitze since this is a real product, atleast in the actual js ;O
