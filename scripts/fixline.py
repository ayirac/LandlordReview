import re

def remove_duplicates_and_comma(line):
    # Remove the comma and duplicated zip code
    line = re.sub(r', (\d{5}), \1', r', \1', line)
    
    return line

# Read input from file
with open("output1.txt", "r") as input_file:
    lines = input_file.readlines()

# Process each line
modified_lines = [remove_duplicates_and_comma(line) for line in lines]

# Write output to file
with open("output2.txt", "w") as output_file:
    output_file.writelines(modified_lines)
