import osmnx as ox
import re
import random
import time
import threading
from osmnx.utils_geo import sample_points
import requests

lock = threading.Lock()

def get_address(lat, lon):
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
    response = requests.get(url)
    data = response.json()
    
    if response.status_code == 200:
        if "address" in data:
            address = data["address"]
            road = address.get("road", "")
            house_number = address.get("house_number", "")
            county = address.get("county", "")
            state = address.get("state", "")
            postcode = address.get("postcode", "")
            country = address.get("country", "")
            
            full_address = f"{house_number} {road}, {county}, {state} {postcode}, {country}"
            return full_address
        else:
            print("Error: Unable to retrieve address.")
    else:
        print("Error: Request failed.")

def process_points(points):
    print(len(points))
    for point in points:
        x, y = point.x, point.y
        address = get_address(y, x)
        pattern = r"(\d+) ([A-Za-z\d\s]+), ([A-Za-z\s]+), ([A-Za-z]+) (\d+), ([A-Za-z\s]+)"
        mat = re.match(pattern, address)

        if (mat):
            with lock:
                homes.append((mat, (x, y)))

timeStart = time.time()

# Define the location for Klamath Falls, Oregon
place_name = "Klamath Falls, Oregon, USA"

# Get the coordinates (latitude and longitude) for Klamath Falls
result = ox.geocode(place_name)
latitude = result[0]
longitude = result[1]

# Set the number of random points you want to generate
num_points = 1000
num_threads = 8 # 8 took 122 seconds
points_per_thread = int(num_points/num_threads)
homes = []

points = sample_points(ox.graph_from_place(place_name, network_type="all"), num_points) # Generate random points within the city boundaries
points = points.sort_index()  # Sort the MultiIndex
# Create threads & divy up the points to each thread
threads = []
for i in range(num_threads):
    start_index = i * points_per_thread
    end_index = (i + 1) * points_per_thread
    thread_points = points[start_index:end_index]
    print("Creating a thread with " + str(points_per_thread) + " points " + str(start_index) + " to " + str(end_index))
    t = threading.Thread(target=process_points, args=(thread_points,))
    t.start()
    threads.append(t)

# Wait for all threads to complete
for t in threads:
    t.join()

with open("./output.txt", "w") as file:
    for i, det in enumerate(homes):
        #print(f"{i+1}. {det[0].group(1)} {det[0].group(2)}, {det[0].group(3)}, {det[0].group(4)} {det[0].group(5)}, {det[0].group(5)} ({det[1][0]} LONG, {det[1][1]} LAT)")
        output = (f"{i+1}. {det[0].group(1)} {det[0].group(2)}, {det[0].group(3)}, {det[0].group(4)} {det[0].group(5)}, {det[0].group(6)} ({det[1][0]} LONG, {det[1][1]} LAT)\n")
        file.write(output)

timeEnd = time.time()
elapsedTime = timeEnd - timeStart
print(f"task took {elapsedTime} seconds")