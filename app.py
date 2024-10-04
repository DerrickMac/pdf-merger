from flask import Flask, request, send_file, render_template
from pypdf import PdfWriter, PdfReader
from io import BytesIO

app = Flask(__name__)
MAX_FILE_SIZE = 16 * 1024 * 1024

@app.route('/')
def index():
    return render_template('index.html')
        
@app.route('/merge', methods=['POST'])
def merge_pdfs():
    merger = PdfWriter()
    total_input_size = 0

    try:
        files = request.files.getlist('pdfs')
        if not files or len(files) < 2:
            return 'Please select at least two files to merge', 400

        for file in files:
            if file:
                file_content = file.read()
                file_stream = BytesIO(file_content)
                a_PDF = PdfReader(file_stream)
                if not a_PDF:
                    return 'Invalid file type found', 400
                
                file_stream.seek(0)

                file_size = len(file_content)
                total_input_size += file_size
                if file_size > MAX_FILE_SIZE or total_input_size > MAX_FILE_SIZE:
                    return 'Exceeded total merged file size of 16mb.', 400
                
                # Read the file content into a BytesIO object and append to merger
                merger.append(file_stream)

        # Write the merged PDF to a BytesIO object
        merge_pdf_io = BytesIO()
        merger.write(merge_pdf_io)
        merger.close()
        merge_pdf_io.seek(0)

        # Send the merged PDF back to the user
        return send_file(merge_pdf_io, as_attachment=True, download_name='merged.pdf', mimetype='application/pdf')

    except Exception:
        return 'An internal error occurred during merging.', 500
            
# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', port=5100)
