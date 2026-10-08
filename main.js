        // DOM Elements
        const csvInput = document.getElementById('csv-input');
        const jsonOutput = document.getElementById('json-output');
        const fileInput = document.getElementById('file-input');
        const optDelimiter = document.getElementById('opt-delimiter');
        const optHeader = document.getElementById('opt-header');
        const optStructure = document.getElementById('opt-structure');
        const optParseTypes = document.getElementById('opt-parse-types');
        const optMinify = document.getElementById('opt-minify');
        
        const copyBtn = document.getElementById('copy-btn');
        const copyText = document.getElementById('copy-text');
        const downloadBtn = document.getElementById('download-btn');
        const resetBtn = document.getElementById('reset-btn');
        const loadSampleBtn = document.getElementById('load-sample-btn');
        
        const errorBanner = document.getElementById('error-banner');
        const errorMessage = document.getElementById('error-message');
        
        const csvStatSize = document.getElementById('csv-stat-size');
        const csvStatLines = document.getElementById('csv-stat-lines');
        const jsonStatSize = document.getElementById('json-stat-size');
        const jsonStatItems = document.getElementById('json-stat-items');

        let rawParsedJson = null;

        // Sample Data
        const sampleCSV = `id,nama_produk,kategori,harga,stok,tersedia
101,Laptop Gaming Pro,Elektronik,15000000,12,true
102,Mouse Wireless,Aksesoris,250000,45,true
103,Keyboard Mekanikal,Aksesoris,750000,0,false
104,Monitor 4K 27 Inch,Elektronik,4200000,8,true
105,"Kabel HDMI 2.0, 2 Meter",Aksesoris,85000,120,true`;

        // Initialize App
        function init() {
            csvInput.value = sampleCSV;
            processCSV();
            addEventListeners();
        }

        // Attach Event Listeners
        function addEventListeners() {
            csvInput.addEventListener('input', processCSV);
            
            [optDelimiter, optHeader, optStructure, optParseTypes, optMinify].forEach(elem => {
                elem.addEventListener('change', processCSV);
            });

            fileInput.addEventListener('change', handleFileUpload);
            copyBtn.addEventListener('click', copyToClipboard);
            downloadBtn.addEventListener('click', downloadJSON);
            resetBtn.addEventListener('click', resetAll);
            loadSampleBtn.addEventListener('click', () => {
                csvInput.value = sampleCSV;
                processCSV();
                showToast('Contoh data berhasil dimuat', 'info');
            });
        }

        // Auto Detect Delimiter
        function detectDelimiter(text) {
            const delimiters = [',', ';', '\t', '|'];
            const firstLine = text.split(/\r\n|\n/)[0] || '';
            
            let bestDelimiter = ',';
            let maxCount = 0;

            delimiters.forEach(del => {
                // Count occurrences not inside quotes
                const count = (firstLine.match(new RegExp(`\\${del}`, 'g')) || []).length;
                if (count > maxCount) {
                    maxCount = count;
                    bestDelimiter = del;
                }
            });

            return bestDelimiter;
        }

        // CSV Parser Logic with Quote Handling & Escaping
        function parseCSVLine(line, delimiter) {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') { // Escaped Quote ("")
                        current += '"';
                        i++;
                    } else { // Toggle Quote State
                        inQuotes = !inQuotes;
                    }
                } else if (char === delimiter && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        }

        // Parse Primitive Data Types (Numbers, Booleans, Nulls)
        function parseValue(val, shouldParse) {
            if (!shouldParse) return val;
            
            if (val === '' || val === null || val === undefined) return null;
            
            // Boolean
            if (val.toLowerCase() === 'true') return true;
            if (val.toLowerCase() === 'false') return false;

            // Number
            if (!isNaN(val) && val.trim() !== '') {
                return Number(val);
            }

            return val;
        }

        // Core CSV Processing Function
        function processCSV() {
            clearError();
            const text = csvInput.value.trim();

            // Update CSV Stats
            csvStatSize.textContent = formatBytes(new Blob([csvInput.value]).size);
            const lines = text ? text.split(/\r\n|\n/).filter(l => l.trim().length > 0) : [];
            csvStatLines.textContent = `${lines.length} Lines`;

            if (!text) {
                jsonOutput.innerHTML = '';
                jsonStatSize.textContent = '0 KB';
                jsonStatItems.textContent = '0 Item';
                rawParsedJson = null;
                return;
            }

            try {
                let delimiter = optDelimiter.value;
                if (delimiter === 'auto') {
                    delimiter = detectDelimiter(text);
                }

                const hasHeader = optHeader.value === 'true';
                const asObjects = optStructure.value === 'object';
                const parseTypes = optParseTypes.value === 'true';

                // Split into lines respecting quotes with newlines
                const rawLines = text.split(/\r\n|\n/);
                const parsedRows = [];
                let buffer = '';

                for (let i = 0; i < rawLines.length; i++) {
                    buffer += (buffer ? '\n' : '') + rawLines[i];
                    // Check if quote count is even (balanced)
                    const quoteCount = (buffer.match(/"/g) || []).length;
                    if (quoteCount % 2 === 0) {
                        if (buffer.trim()) {
                            parsedRows.push(parseCSVLine(buffer, delimiter));
                        }
                        buffer = '';
                    }
                }

                if (parsedRows.length === 0) {
                    throw new Error('Tidak ada data CSV valid yang ditemukan.');
                }

                let resultJSON = [];

                if (hasHeader) {
                    const headers = parsedRows[0].map(h => h.replace(/^"(.*)"$/, '$1')); // Strip outer quotes from header
                    const dataRows = parsedRows.slice(1);

                    if (asObjects) {
                        resultJSON = dataRows.map((row, rowIdx) => {
                            const obj = {};
                            headers.forEach((header, colIdx) => {
                                const key = header || `column_${colIdx + 1}`;
                                const rawVal = row[colIdx] !== undefined ? row[colIdx] : '';
                                obj[key] = parseValue(rawVal, parseTypes);
                            });
                            return obj;
                        });
                    } else {
                        // Array of Arrays with Header as first row
                        resultJSON = parsedRows.map(row => 
                            row.map(val => parseValue(val, parseTypes))
                        );
                    }
                } else {
                    if (asObjects) {
                        // Generate col_1, col_2 keys
                        resultJSON = parsedRows.map(row => {
                            const obj = {};
                            row.forEach((val, idx) => {
                                obj[`col_${idx + 1}`] = parseValue(val, parseTypes);
                            });
                            return obj;
                        });
                    } else {
                        resultJSON = parsedRows.map(row => 
                            row.map(val => parseValue(val, parseTypes))
                        );
                    }
                }

                rawParsedJson = resultJSON;

                // Render JSON Output
                const isMinified = optMinify.value === 'minified';
                const jsonString = isMinified 
                    ? JSON.stringify(resultJSON) 
                    : JSON.stringify(resultJSON, null, 2);

                jsonOutput.innerHTML = jsonString;

                // Update Output Stats
                jsonStatSize.textContent = formatBytes(new Blob([jsonString]).size);
                jsonStatItems.textContent = `${resultJSON.length} Item`;

            } catch (err) {
                showError('Error Parsing CSV: ' + err.message);
                jsonOutput.innerHTML = '';
                jsonStatSize.textContent = '0 KB';
                jsonStatItems.textContent = '0 Item';
                rawParsedJson = null;
            }
        }

        // File Upload Handler
        function handleFileUpload(e) {
            const file = e.target.files[0];
            if (!file) return;

            if(file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                showToast('File yang diunggah bukan CSV.', 'error');
                fileInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                csvInput.value = evt.target.result;
                processCSV();
                showToast(`File "${file.name}" berhasil diunggah`, 'success');
            };
            reader.onerror = function() {
                showError('Gagal membaca file.');
            };
            reader.readAsText(file);
            fileInput.value = ''; // Reset input file
        }

        // Copy to Clipboard
        function copyToClipboard() {
            if (!rawParsedJson) {
                showToast('Tidak ada data JSON untuk disalin', 'error');
                return;
            }

            const isMinified = optMinify.value === 'minified';
            const textToCopy = isMinified 
                ? JSON.stringify(rawParsedJson) 
                : JSON.stringify(rawParsedJson, null, 2);

            // Using execCommand for cross-browser / iframe support
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                copyText.textContent = 'Tersalin!';
                showToast('JSON berhasil disalin ke clipboard!', 'success');
                setTimeout(() => { copyText.textContent = 'Salin'; }, 2000);
            } catch (err) {
                showToast('Gagal menyalin teks', 'error');
            }
            document.body.removeChild(textarea);
        }

        // Download JSON File
        function downloadJSON() {
            if (!rawParsedJson) {
                showToast('Tidak ada data JSON untuk diunduh', 'error');
                return;
            }

            const isMinified = optMinify.value === 'minified';
            const jsonString = isMinified 
                ? JSON.stringify(rawParsedJson) 
                : JSON.stringify(rawParsedJson, null, 2);

            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('File JSON berhasil diunduh', 'success');
        }

        // Reset All Inputs
        function resetAll() {
            csvInput.value = '';
            optDelimiter.value = 'auto';
            optHeader.value = 'true';
            optStructure.value = 'object';
            optParseTypes.value = 'true';
            optMinify.value = 'pretty';
            processCSV();
            showToast('All inputs have been reset', 'info');
        }

        // Helper: Display Errors
        function showError(msg) {
            errorMessage.textContent = msg;
            errorBanner.classList.remove('hidden');
        }

        function clearError() {
            errorBanner.classList.add('hidden');
            errorMessage.textContent = '';
        }

        // Helper: Toast Notifications
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toast-msg');
            const toastIcon = document.getElementById('toast-icon');

            toastMsg.textContent = message;

            if (type === 'success') {
                toastIcon.className = 'fa-solid fa-circle-check text-emerald-400';
            } else if (type === 'error') {
                toastIcon.className = 'fa-solid fa-circle-xmark text-red-400';
            } else {
                toastIcon.className = 'fa-solid fa-circle-info text-blue-400';
            }

            toast.classList.remove('translate-y-16', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-16', 'opacity-0');
            }, 3000);
        }

        // Helper: Bytes Formatter
        function formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        // Run on Page Load
        window.onload = init;