document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const addPdfButton = document.getElementById('addPdfButton');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const mergeButton = document.getElementById('mergeButton');

    let selectedFiles = [];

    // Helper function to update the file list UI
    function updateFileList() {
        fileList.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.classList.add('file-item');

            const fileName = document.createElement('span');
            fileName.classList.add('file-name');
            fileName.textContent = file.name;

            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-button');
            removeButton.innerHTML = '&times;';
            removeButton.addEventListener('click', () => {
                removeFile(index);
            });

            fileItem.appendChild(fileName);
            fileItem.appendChild(removeButton);
            fileList.appendChild(fileItem);
        });

        // Enable the merge button only if at least two files are selected
        mergeButton.disabled = selectedFiles.length < 2;
    }

    // Function to add files to the selectedFiles array
    function addFiles(files) {
        for (let file of files) {
            if (file.type === 'application/pdf') {
                // Avoid adding duplicate files
                if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    selectedFiles.push(file);
                }
            }
        }
        updateFileList();
    }

    // Function to remove a file from the selectedFiles array
    function removeFile(index) {
        const file = selectedFiles[index];
        selectedFiles.splice(index, 1);
        updateFileList();
    }

    // Handle click on "Add PDF" button
    addPdfButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection via file input
    fileInput.addEventListener('change', (e) => {
        addFiles(e.target.files);
        fileInput.value = ''; // Reset the input
    });

    // Handle drag over event
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    // Handle drag leave event
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    // Handle drop event
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        addFiles(e.dataTransfer.files);
    });

    // Handle merge button click
    mergeButton.addEventListener('click', () => {
        if (selectedFiles.length < 2) {
            alert('Please select at least two PDF files to merge.');
            return;
        }

        // Disable the merge button to prevent multiple clicks
        mergeButton.disabled = true;
        mergeButton.textContent = 'Merging...';

        // Create a FormData object and append the selected files
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('pdfs', file);
        });

        // Send the files to the server via POST request
        fetch('/merge', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.blob();
        })
        .then(blob => {
            // Create a link to download the merged PDF
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'merged.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            // Reset the selected files and UI
            selectedFiles = [];
            updateFileList();
        })
        .catch(error => {
            alert(`Error: ${error.message}`);
        })
        .finally(() => {
            // Re-enable the merge button
            mergeButton.disabled = false;
            mergeButton.textContent = 'Merge PDFs';
        });
    });
});
