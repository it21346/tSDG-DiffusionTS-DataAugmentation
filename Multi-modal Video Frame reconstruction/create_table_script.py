import os
import urllib.parse
# Define the table header (you can modify it if needed)
header = """| Paper | Synthetic Generation | Multi-modal | Physics-driven | Notes |
| :---  |  :----:   |    :----:   | :----:   | ---: |
"""
# Initialize the content variable with the header
content = header

# Get the list of all PDF files in the current directory
pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf')]
# Generate the table rows
checkbox = [ ]
for pdf in pdf_files:
    # Encode the file name for use in a URL
    encoded_pdf = urllib.parse.quote(pdf)
    # Create the markdown link format for the PDF
    paper_link = f"[{pdf}]({encoded_pdf})"
    # Add a new row with empty columns for now
    content += f"| {paper_link} | {checkbox} | {checkbox} | {checkbox} |  |\n"

# Write the output to a new file or print it
with open('Paper_notes.md', 'w') as f:
    f.write(content)


print("Table rows generated and saved to output.md.")