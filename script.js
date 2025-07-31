// Global variables to store generated data and custom lists
let generatedData = [];
let customRegions = null;
let customProducts = null;

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the entire application
function initializeApp() {
    initializeEventListeners();
    initializeMeasureRanges();
    initializeDarkMode();
    initializeCustomLists(); // Load custom lists first
    disableDataControls(); // Disable data-related controls initially
    // Don't auto-load full configuration on startup to avoid overriding custom lists
}



// Initialize all event listeners
function initializeEventListeners() {
    // Core functionality
    document.getElementById('generateBtn').addEventListener('click', handleGenerateData);
    document.getElementById('downloadBtn').addEventListener('click', handleDownloadCSV);
    document.getElementById('downloadJsonBtn').addEventListener('click', handleDownloadJSON);
    document.getElementById('copyJsonBtn').addEventListener('click', handleCopyJSON);
    
    // Configuration management
    document.getElementById('saveConfig').addEventListener('click', handleSaveConfiguration);
    document.getElementById('loadConfig').addEventListener('click', handleLoadConfiguration);
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Measure checkboxes
    const measureCheckboxes = document.querySelectorAll('input[name="measures"]');
    measureCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateMeasureRanges);
    });
    
    // Time period validation
    document.getElementById('startMonth').addEventListener('change', validateTimePeriod);
    document.getElementById('endMonth').addEventListener('change', validateTimePeriod);
    
    // File upload functionality
    document.getElementById('uploadRegionBtn').addEventListener('click', () => {
        document.getElementById('regionFileInput').click();
    });
    document.getElementById('uploadProductBtn').addEventListener('click', () => {
        document.getElementById('productFileInput').click();
    });
    document.getElementById('regionFileInput').addEventListener('change', handleRegionFileUpload);
    document.getElementById('productFileInput').addEventListener('change', handleProductFileUpload);
    
    // Reset buttons
    document.getElementById('resetRegionBtn').addEventListener('click', resetRegionDropdown);
    document.getElementById('resetProductBtn').addEventListener('click', resetProductDropdown);
    
    // Output view controls
    document.getElementById('tableView').addEventListener('click', () => switchView('table'));
    document.getElementById('jsonView').addEventListener('click', () => switchView('json'));
    
    // Table controls
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('expandAllBtn').addEventListener('click', expandTable);
    document.getElementById('refreshTableBtn').addEventListener('click', refreshTable);
    document.getElementById('prettifyJsonBtn').addEventListener('click', prettifyJson);
    
    // Horizontal scroll controls
    document.getElementById('scrollLeftBtn').addEventListener('click', scrollTableLeft);
    document.getElementById('scrollRightBtn').addEventListener('click', scrollTableRight);
}

// Initialize measure ranges for default checked measures
function initializeMeasureRanges() {
    updateMeasureRanges();
}

// Initialize dark mode based on saved preference
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('sac-theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateDarkModeIcon(true);
    }
}

// Initialize custom lists from localStorage on app start
function initializeCustomLists() {
    const savedConfig = localStorage.getItem('sac-config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            
            // Load custom regions if they exist
            if (config.customRegions && Array.isArray(config.customRegions)) {
                customRegions = config.customRegions;
                updateRegionDropdown(config.customRegions);
            }
            
            // Load custom products if they exist
            if (config.customProducts && Array.isArray(config.customProducts)) {
                customProducts = config.customProducts;
                updateProductDropdown(config.customProducts);
            }
        } catch (e) {
            console.error('Error loading custom lists:', e);
        }
    }
}

// Disable data-related controls when no data is available
function disableDataControls() {
    const controlsToDisable = [
        'downloadBtn',
        'downloadJsonBtn', 
        'copyJsonBtn',
        'scrollLeftBtn',
        'scrollRightBtn',
        'expandAllBtn',
        'refreshTableBtn',
        'prettifyJsonBtn',
        'searchInput',
        'tableView',
        'jsonView'
    ];
    
    controlsToDisable.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = true;
            element.style.opacity = '0.5';
            element.style.cursor = 'not-allowed';
            element.style.pointerEvents = 'none';
        }
    });
    
    // Hide scroll controls
    const scrollControls = document.querySelector('.scroll-controls');
    if (scrollControls) {
        scrollControls.classList.remove('active');
        scrollControls.style.display = 'none';
        scrollControls.style.visibility = 'hidden';
    }
    
    // Update scroll info to indicate no data
    const scrollInfo = document.getElementById('scrollInfo');
    if (scrollInfo) {
        scrollInfo.textContent = 'Generate data to enable controls';
        scrollInfo.style.color = 'var(--text-tertiary)';
    }
    
    // Update data stats
    const dataStats = document.getElementById('dataStats');
    if (dataStats) {
        dataStats.innerHTML = '<span class="stats-text">No data generated yet</span>';
    }
}

// Enable data-related controls when data is available
function enableDataControls() {
    const controlsToEnable = [
        'downloadBtn',
        'downloadJsonBtn',
        'copyJsonBtn', 
        'scrollLeftBtn',
        'scrollRightBtn',
        'expandAllBtn',
        'refreshTableBtn',
        'prettifyJsonBtn',
        'searchInput',
        'tableView',
        'jsonView'
    ];
    
    controlsToEnable.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            element.style.opacity = '';
            element.style.cursor = '';
            element.style.pointerEvents = '';
        }
    });
    
    // Show scroll controls
    const scrollControls = document.querySelector('.scroll-controls');
    if (scrollControls) {
        scrollControls.classList.add('active');
        scrollControls.style.display = 'flex';
        scrollControls.style.visibility = 'visible';
    }
    
    // Update scroll info
    const scrollInfo = document.getElementById('scrollInfo');
    if (scrollInfo) {
        scrollInfo.textContent = 'Use ◀ ▶ to scroll horizontally';
        scrollInfo.style.color = '';
    }
}

// Handle Generate Data button click
function handleGenerateData() {
    const form = document.getElementById('dataForm');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Read values from form inputs
    const formInputs = readFormInputs();
    
    // Validate selected measures
    if (formInputs.selectedMeasures.length === 0) {
        alert('Please select at least one measure');
        return;
    }
    
    // Validate min/max values for each measure
    for (const measure of formInputs.selectedMeasures) {
        const range = formInputs.measureRanges[measure];
        if (range.min >= range.max) {
            alert(`Min value must be less than Max value for ${measure}`);
            return;
        }
    }

    // Generate mock data with selected measures
    generatedData = generateMockData(formInputs);
    
    // Enable data controls now that we have data
    enableDataControls();
    
    // Display data in table format
    displayDataTable(generatedData);
    
    // Display data in JSON format
    displayJsonOutput(generatedData);
    
    // Show success message
    showToast(`Generated ${generatedData.length} records successfully!`, 'success');
}

// Update measure ranges based on selected measures
function updateMeasureRanges() {
    const measureRangesContainer = document.getElementById('measureRanges');
    const selectedMeasures = getSelectedMeasures();
    
    // Clear existing ranges
    measureRangesContainer.innerHTML = '';
    
    if (selectedMeasures.length === 0) {
        measureRangesContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">Please select at least one measure.</p>';
        return;
    }
    
    // Create range inputs for each selected measure
    selectedMeasures.forEach(measure => {
        const rangeItem = createMeasureRangeItem(measure);
        measureRangesContainer.appendChild(rangeItem);
    });
}

// Create a measure range item
function createMeasureRangeItem(measure) {
    const rangeItem = document.createElement('div');
    rangeItem.className = 'measure-range-item';
    
    const defaultRanges = {
        'Revenue': { min: 10000, max: 1000000 },
        'Cost': { min: 5000, max: 800000 },
        'EBITDA': { min: 1000, max: 200000 },
        'Margin': { min: 5, max: 45 }
    };
    
    const defaults = defaultRanges[measure] || { min: 0, max: 10000 };
    
    rangeItem.innerHTML = `
        <div class="measure-range-header">${measure} Value Range</div>
        <div class="measure-range-inputs">
            <div>
                <label>Min ${measure}</label>
                <input type="number" id="min${measure}" name="min${measure}" 
                       value="${defaults.min}" min="0" required>
            </div>
            <div>
                <label>Max ${measure}</label>
                <input type="number" id="max${measure}" name="max${measure}" 
                       value="${defaults.max}" min="1" required>
            </div>
        </div>
    `;
    
    return rangeItem;
}

// Get selected measures
function getSelectedMeasures() {
    const checkboxes = document.querySelectorAll('input[name="measures"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Read all form input values
function readFormInputs() {
    const selectedMeasures = getSelectedMeasures();
    const measureRanges = {};
    
    // Read value ranges for each selected measure
    selectedMeasures.forEach(measure => {
        const minInput = document.getElementById(`min${measure}`);
        const maxInput = document.getElementById(`max${measure}`);
        
        if (minInput && maxInput) {
            measureRanges[measure] = {
                min: parseInt(minInput.value) || 0,
                max: parseInt(maxInput.value) || 1000
            };
        }
    });
    
    // Generate time periods array
    const startMonth = document.getElementById('startMonth').value;
    const endMonth = document.getElementById('endMonth').value;
    const timePeriods = generateTimePeriods(startMonth, endMonth);
    
    return {
        region: document.getElementById('region').value,
        product: document.getElementById('product').value,
        startMonth: startMonth,
        endMonth: endMonth,
        timePeriods: timePeriods,
        selectedMeasures: selectedMeasures,
        measureRanges: measureRanges
    };
}

// Generate time periods in YYYY.MMM format
function generateTimePeriods(startMonth, endMonth) {
    const periods = [];
    const start = new Date(startMonth + '-01');
    const end = new Date(endMonth + '-01');
    
    const current = new Date(start);
    while (current <= end) {
        const year = current.getFullYear();
        const month = current.toLocaleString('en-US', { month: 'short' });
        periods.push(`${year}.${month}`);
        current.setMonth(current.getMonth() + 1);
    }
    
    return periods;
}

// Validate time period inputs
function validateTimePeriod() {
    const startMonth = document.getElementById('startMonth').value;
    const endMonth = document.getElementById('endMonth').value;
    
    if (startMonth && endMonth && startMonth > endMonth) {
        alert('Start month must be before or equal to end month');
        document.getElementById('endMonth').value = startMonth;
    }
}

// Generate mock data with combinations of selected measures
function generateMockData(inputs) {
    const { region, product, timePeriods, selectedMeasures, measureRanges } = inputs;
    const data = [];
    
    // Get countries for the selected region
    const countries = getCountriesForRegion(region);
    
    // Generate combinations of countries, time periods, and selected measures
    countries.forEach(country => {
        timePeriods.forEach(timePeriod => {
            selectedMeasures.forEach(measure => {
                const range = measureRanges[measure];
                const value = generateRandomValue(range.min, range.max);
                
                data.push({
                    Region: region,
                    Country: country,
                    Product: product,
                    TimePeriod: timePeriod,
                    Measure: measure,
                    Value: value,
                    Currency: measure === 'Margin' ? '%' : 'USD',
                    Timestamp: new Date().toISOString()
                });
            });
        });
    });
    
    return data;
}

// Generate random value between min and max
function generateRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get countries based on region
function getCountriesForRegion(region) {
    const regionCountries = {
        'North America': ['USA', 'Canada', 'Mexico'],
        'Europe': ['Germany', 'France', 'UK', 'Italy', 'Spain'],
        'Asia Pacific': ['China', 'Japan', 'India', 'Australia', 'Singapore'],
        'Latin America': ['Brazil', 'Argentina', 'Colombia', 'Chile'],
        'Middle East & Africa': ['UAE', 'Saudi Arabia', 'South Africa', 'Egypt']
    };
    
    // If it's a predefined region, return its countries
    if (regionCountries[region]) {
        return regionCountries[region];
    }
    
    // For custom regions, generate some generic countries or use the region name as country
    // This is a simple fallback - in real scenarios, you might want to upload countries too
    return [
        `${region}_Country_1`,
        `${region}_Country_2`,
        `${region}_Country_3`
    ];
}

// Handle region file upload
function handleRegionFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!validateFile(file, ['csv', 'txt'])) {
        showToast('Please upload a valid CSV or TXT file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const regions = parseFileContent(content);
            
            if (regions.length === 0) {
                showToast('No valid regions found in the file', 'warning');
                return;
            }
            
            customRegions = regions;
            updateRegionDropdown(regions);
            showToast(`Successfully loaded ${regions.length} regions`, 'success');
            
        } catch (error) {
            console.error('Error parsing region file:', error);
            showToast('Error parsing the file. Please check the format.', 'error');
        }
    };
    
    reader.onerror = function() {
        showToast('Error reading the file', 'error');
    };
    
    reader.readAsText(file);
    
    // Clear the input for re-upload of same file
    event.target.value = '';
}

// Handle product file upload
function handleProductFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!validateFile(file, ['csv', 'txt'])) {
        showToast('Please upload a valid CSV or TXT file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const products = parseFileContent(content);
            
            if (products.length === 0) {
                showToast('No valid products found in the file', 'warning');
                return;
            }
            
            customProducts = products;
            updateProductDropdown(products);
            showToast(`Successfully loaded ${products.length} products`, 'success');
            
        } catch (error) {
            console.error('Error parsing product file:', error);
            showToast('Error parsing the file. Please check the format.', 'error');
        }
    };
    
    reader.onerror = function() {
        showToast('Error reading the file', 'error');
    };
    
    reader.readAsText(file);
    
    // Clear the input for re-upload of same file
    event.target.value = '';
}

// Validate file type
function validateFile(file, allowedTypes) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(fileExtension);
}

// Parse file content (CSV or TXT)
function parseFileContent(content) {
    const lines = content.split(/\r?\n/);
    const items = [];
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) { // Skip empty lines and comments
            // Handle CSV format (take first column) or simple text format
            const item = trimmedLine.split(',')[0].trim();
            if (item && !items.includes(item)) {
                items.push(item);
            }
        }
    });
    
    return items;
}

// Update region dropdown with custom regions
function updateRegionDropdown(regions) {
    const regionSelect = document.getElementById('region');
    const currentValue = regionSelect.value;
    
    // Clear existing options except the first one
    regionSelect.innerHTML = '<option value="">Select Region</option>';
    
    // Add custom regions
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && regions.includes(currentValue)) {
        regionSelect.value = currentValue;
    }
}

// Update product dropdown with custom products
function updateProductDropdown(products) {
    const productSelect = document.getElementById('product');
    const currentValue = productSelect.value;
    
    // Clear existing options except the first one
    productSelect.innerHTML = '<option value="">Select Product</option>';
    
    // Add custom products
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productSelect.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && products.includes(currentValue)) {
        productSelect.value = currentValue;
    }
}

// Reset region dropdown to defaults
function resetRegionDropdown() {
    customRegions = null;
    const regionSelect = document.getElementById('region');
    const currentValue = regionSelect.value;
    
    regionSelect.innerHTML = `
        <option value="">Select Region</option>
        <option value="North America">North America</option>
        <option value="Europe">Europe</option>
        <option value="Asia Pacific">Asia Pacific</option>
        <option value="Latin America">Latin America</option>
        <option value="Middle East & Africa">Middle East & Africa</option>
    `;
    
    // Restore selection if it's a default option
    const defaultRegions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];
    if (currentValue && defaultRegions.includes(currentValue)) {
        regionSelect.value = currentValue;
    }
    
    showToast('Region list reset to defaults', 'info');
}

// Reset product dropdown to defaults
function resetProductDropdown() {
    customProducts = null;
    const productSelect = document.getElementById('product');
    const currentValue = productSelect.value;
    
    productSelect.innerHTML = `
        <option value="">Select Product</option>
        <option value="Product A">Product A</option>
        <option value="Product B">Product B</option>
        <option value="Product C">Product C</option>
        <option value="Product D">Product D</option>
        <option value="Product E">Product E</option>
    `;
    
    // Restore selection if it's a default option
    const defaultProducts = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
    if (currentValue && defaultProducts.includes(currentValue)) {
        productSelect.value = currentValue;
    }
    
    showToast('Product list reset to defaults', 'info');
}

// Display data in table format
function displayDataTable(data) {
    const outputDisplay = document.getElementById('outputDisplay');
    const tableFooter = document.getElementById('tableFooter');
    const dataStats = document.getElementById('dataStats');
    
    if (data.length === 0) {
        outputDisplay.innerHTML = 'No data generated.';
        outputDisplay.className = 'output-display empty';
        tableFooter.style.display = 'none';
        dataStats.innerHTML = '<span class="stats-text">No data generated yet</span>';
        disableDataControls(); // Disable controls when no data
        return;
    }

    outputDisplay.className = 'output-display';
    
    // Update data statistics
    updateDataStats(data);
    
    // Create table HTML
    let tableHTML = '<table class="data-table"><thead><tr>';
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // Add data rows with enhanced formatting
    data.forEach((row, index) => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            let cellValue = row[header];
            let cellTitle = '';
            
            // Format values based on measure type
            if (header === 'Value') {
                if (row.Currency === '%') {
                    cellValue = cellValue.toFixed(2) + '%';
                } else {
                    cellValue = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                    }).format(cellValue);
                }
            } else if (header === 'Timestamp') {
                const date = new Date(cellValue);
                cellValue = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                cellTitle = date.toISOString();
            } else {
                cellTitle = cellValue;
            }
            
            tableHTML += `<td title="${cellTitle}">${cellValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    outputDisplay.innerHTML = tableHTML;
    
    // Show table footer with record count
    document.getElementById('recordCount').textContent = `${data.length} records`;
    tableFooter.style.display = 'flex';
    
    // Initialize horizontal scroll detection
    setTimeout(() => {
        initializeHorizontalScroll();
    }, 100);
}

// Update data statistics
function updateDataStats(data) {
    const dataStats = document.getElementById('dataStats');
    const uniqueRegions = [...new Set(data.map(row => row.Region))].length;
    const uniqueProducts = [...new Set(data.map(row => row.Product))].length;
    const uniqueMeasures = [...new Set(data.map(row => row.Measure))].length;
    
    dataStats.innerHTML = `
        <span class="stats-text">
            ${data.length} records | ${uniqueRegions} regions | ${uniqueProducts} products | ${uniqueMeasures} measures
        </span>
    `;
}

// Switch between table and JSON views
function switchView(viewType) {
    if (generatedData.length === 0) {
        showToast('No data to view. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    
    const tableSection = document.getElementById('tableSection');
    const jsonSection = document.getElementById('jsonSection');
    const tableViewBtn = document.getElementById('tableView');
    const jsonViewBtn = document.getElementById('jsonView');
    
    if (viewType === 'table') {
        tableSection.style.display = 'block';
        jsonSection.style.display = 'none';
        tableViewBtn.classList.add('active');
        jsonViewBtn.classList.remove('active');
        showToast('Switched to table view', 'info');
    } else {
        tableSection.style.display = 'none';
        jsonSection.style.display = 'block';
        tableViewBtn.classList.remove('active');
        jsonViewBtn.classList.add('active');
        showToast('Switched to JSON view', 'info');
    }
}

// Handle search functionality
function handleSearch(event) {
    if (generatedData.length === 0) {
        event.target.value = '';
        showToast('No data to search. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    
    const searchTerm = event.target.value.toLowerCase();
    const table = document.querySelector('.data-table');
    
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update record count
    const recordCount = document.getElementById('recordCount');
    if (searchTerm) {
        recordCount.textContent = `${visibleCount} of ${rows.length} records (filtered)`;
    } else {
        recordCount.textContent = `${rows.length} records`;
    }
}

// Expand table to full width
function expandTable() {
    if (generatedData.length === 0) {
        showToast('No data to expand. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    
    const tableWrapper = document.querySelector('.table-wrapper');
    const expandBtn = document.getElementById('expandAllBtn');
    
    if (tableWrapper.style.maxHeight === 'none') {
        tableWrapper.style.maxHeight = '600px';
        expandBtn.innerHTML = '<span class="icon">⛶</span>';
        expandBtn.title = 'Expand table';
        showToast('Table view restored', 'info');
    } else {
        tableWrapper.style.maxHeight = 'none';
        expandBtn.innerHTML = '<span class="icon">⊟</span>';
        expandBtn.title = 'Restore table';
        showToast('Table expanded', 'info');
    }
}

// Refresh table view
function refreshTable() {
    if (generatedData.length > 0) {
        displayDataTable(generatedData);
        document.getElementById('searchInput').value = '';
        showToast('Table refreshed', 'success');
    } else {
        showToast('No data to refresh. Please generate data first.', 'warning');
        disableDataControls();
    }
}

// Prettify JSON output
function prettifyJson() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (generatedData.length > 0) {
        try {
            const formatted = JSON.stringify(generatedData, null, 4);
            jsonOutput.textContent = formatted;
            showToast('JSON formatted', 'success');
        } catch (e) {
            showToast('Error formatting JSON', 'error');
        }
    } else {
        showToast('No data to format. Please generate data first.', 'warning');
        disableDataControls();
    }
}

// Initialize horizontal scroll detection and controls
function initializeHorizontalScroll() {
    const tableWrapper = document.getElementById('tableWrapper');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    const scrollIndicator = document.getElementById('scrollIndicator');
    const scrollInfo = document.getElementById('scrollInfo');
    
    if (!tableWrapper) return;
    
    // Check if horizontal scrolling is needed
    function updateScrollState() {
        const hasHorizontalScroll = tableWrapper.scrollWidth > tableWrapper.clientWidth;
        const isAtStart = tableWrapper.scrollLeft <= 0;
        const isAtEnd = tableWrapper.scrollLeft >= tableWrapper.scrollWidth - tableWrapper.clientWidth - 1;
        
        console.log('Scroll Debug:', {
            scrollWidth: tableWrapper.scrollWidth,
            clientWidth: tableWrapper.clientWidth,
            hasHorizontalScroll: hasHorizontalScroll,
            scrollLeft: tableWrapper.scrollLeft
        });
        

        
        // Update scroll indicator visibility
        if (hasHorizontalScroll) {
            tableWrapper.classList.add('has-horizontal-scroll');
            scrollIndicator.classList.add('show');
            scrollInfo.textContent = `Scroll right to see all columns (${tableWrapper.scrollLeft}/${tableWrapper.scrollWidth - tableWrapper.clientWidth})`;
        } else {
            tableWrapper.classList.remove('has-horizontal-scroll');
            scrollIndicator.classList.remove('show');
            scrollInfo.textContent = 'All columns visible';
        }
        
        // Update button states
        scrollLeftBtn.disabled = isAtStart;
        scrollRightBtn.disabled = isAtEnd;
        
        // Show indicator for longer when horizontal scroll is available
        if (hasHorizontalScroll && isAtStart) {
            scrollIndicator.classList.add('show');
            scrollIndicator.textContent = '→ Scroll right to see VALUE, CURRENCY, TIMESTAMP →';
        } else if (hasHorizontalScroll) {
            scrollIndicator.textContent = '← Scroll to navigate all columns →';
        }
    }
    
    // Add scroll event listener
    tableWrapper.addEventListener('scroll', updateScrollState);
    
    // Initial state update
    updateScrollState();
    
    // Show scroll indicator prominently when data is first loaded
    if (tableWrapper.scrollWidth > tableWrapper.clientWidth) {
        setTimeout(() => {
            scrollIndicator.classList.add('show');
            scrollIndicator.textContent = '→ Scroll right to see VALUE, CURRENCY, TIMESTAMP →';
        }, 300);
    }
}

// Scroll table left
function scrollTableLeft() {
    if (generatedData.length === 0) {
        showToast('No data to scroll. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    
    const tableWrapper = document.getElementById('tableWrapper');
    if (tableWrapper) {
        const scrollAmount = Math.min(200, tableWrapper.clientWidth * 0.5);
        tableWrapper.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
        showScrollHint('Scrolling left');
    }
}

// Scroll table right
function scrollTableRight() {
    if (generatedData.length === 0) {
        showToast('No data to scroll. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    
    const tableWrapper = document.getElementById('tableWrapper');
    if (tableWrapper) {
        const scrollAmount = Math.min(200, tableWrapper.clientWidth * 0.5);
        tableWrapper.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
        showScrollHint('Scrolling right');
    }
}

// Show scroll hint
function showScrollHint(message) {
    const scrollInfo = document.getElementById('scrollInfo');
    const originalText = scrollInfo.textContent;
    
    scrollInfo.textContent = message;
    scrollInfo.style.color = 'var(--accent-primary)';
    
    setTimeout(() => {
        scrollInfo.textContent = originalText;
        scrollInfo.style.color = '';
    }, 1000);
}

// Add keyboard navigation for horizontal scrolling
document.addEventListener('keydown', function(event) {
    const tableWrapper = document.getElementById('tableWrapper');
    const isTableFocused = document.activeElement === tableWrapper || 
                          tableWrapper.contains(document.activeElement);
    
    if (isTableFocused && tableWrapper) {
        if (event.key === 'ArrowLeft' && event.shiftKey) {
            event.preventDefault();
            scrollTableLeft();
        } else if (event.key === 'ArrowRight' && event.shiftKey) {
            event.preventDefault();
            scrollTableRight();
        }
    }
});

// Display data in JSON format in <pre> element
function displayJsonOutput(data) {
    const jsonOutput = document.getElementById('jsonOutput');
    
    if (data.length === 0) {
        jsonOutput.textContent = 'No data generated yet.';
        return;
    }
    
    // Format JSON with proper indentation
    const formattedJson = JSON.stringify(data, null, 2);
    jsonOutput.textContent = formattedJson;
}

// Handle Download CSV button click
function handleDownloadCSV() {
    if (generatedData.length === 0) {
        showToast('No data to download. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    downloadCSV(generatedData);
}

// Handle Download JSON button click
function handleDownloadJSON() {
    if (generatedData.length === 0) {
        showToast('No data to download. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    downloadJSON(generatedData);
}

// Handle Copy JSON button click
function handleCopyJSON() {
    if (generatedData.length === 0) {
        showToast('No data to copy. Please generate data first.', 'warning');
        disableDataControls();
        return;
    }
    copyJSONToClipboard();
}

// Handle Save Configuration button click
function handleSaveConfiguration() {
    saveConfiguration();
    showToast('Configuration saved successfully!', 'success');
}

// Handle Load Configuration button click
function handleLoadConfiguration() {
    const loaded = loadConfiguration();
    if (loaded) {
        updateMeasureRanges();
        showToast('Configuration loaded successfully!', 'success');
    } else {
        showToast('No saved configuration found.', 'warning');
    }
}

// Download data as CSV file
function downloadCSV(data) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sac_mock_data_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
}

// Utility function to format numbers as currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

// Utility function to get current timestamp
function getCurrentTimestamp() {
    return new Date().toISOString();
}

// Download data as JSON file
function downloadJSON(data) {
    if (data.length === 0) return;
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sac_mock_data_${timestamp}.json`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
}

// Copy JSON to clipboard
function copyJSONToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');
    const jsonText = jsonOutput.textContent;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(jsonText).then(() => {
            showToast('JSON copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyToClipboard(jsonText);
        });
    } else {
        fallbackCopyToClipboard(jsonText);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('JSON copied to clipboard!', 'success');
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        showToast('Failed to copy JSON to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Dark mode functionality
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sac-theme', newTheme);
    updateDarkModeIcon(newTheme === 'dark');
}

// Update dark mode icon
function updateDarkModeIcon(isDark) {
    const icon = document.querySelector('#darkModeToggle .icon');
    icon.textContent = isDark ? '☀️' : '🌙';
}

// Save configuration to localStorage
function saveConfiguration() {
    const config = {
        region: document.getElementById('region').value,
        product: document.getElementById('product').value,
        startMonth: document.getElementById('startMonth').value,
        endMonth: document.getElementById('endMonth').value,
        measures: getSelectedMeasures(),
        measureRanges: {},
        customRegions: customRegions,
        customProducts: customProducts
    };
    
    // Save measure ranges
    config.measures.forEach(measure => {
        const minInput = document.getElementById(`min${measure}`);
        const maxInput = document.getElementById(`max${measure}`);
        if (minInput && maxInput) {
            config.measureRanges[measure] = {
                min: parseInt(minInput.value) || 0,
                max: parseInt(maxInput.value) || 1000
            };
        }
    });
    
    localStorage.setItem('sac-config', JSON.stringify(config));
}

// Load configuration from localStorage
function loadConfiguration() {
    const savedConfig = localStorage.getItem('sac-config');
    if (!savedConfig) return false;
    
    try {
        const config = JSON.parse(savedConfig);
        
        // Load custom lists first
        if (config.customRegions) {
            customRegions = config.customRegions;
            updateRegionDropdown(config.customRegions);
        }
        
        if (config.customProducts) {
            customProducts = config.customProducts;
            updateProductDropdown(config.customProducts);
        }
        
        // Load basic form values
        if (config.region) document.getElementById('region').value = config.region;
        if (config.product) document.getElementById('product').value = config.product;
        if (config.startMonth) document.getElementById('startMonth').value = config.startMonth;
        if (config.endMonth) document.getElementById('endMonth').value = config.endMonth;
        
        // Load measure selections
        if (config.measures) {
            // First uncheck all measures
            document.querySelectorAll('input[name="measures"]').forEach(cb => cb.checked = false);
            
            // Then check the saved measures
            config.measures.forEach(measure => {
                const checkbox = document.getElementById(measure.toLowerCase());
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // Load measure ranges (will be set when updateMeasureRanges is called)
        setTimeout(() => {
            if (config.measureRanges) {
                Object.keys(config.measureRanges).forEach(measure => {
                    const minInput = document.getElementById(`min${measure}`);
                    const maxInput = document.getElementById(`max${measure}`);
                    if (minInput && maxInput) {
                        minInput.value = config.measureRanges[measure].min;
                        maxInput.value = config.measureRanges[measure].max;
                    }
                });
            }
        }, 100);
        
        return true;
    } catch (e) {
        console.error('Error loading configuration:', e);
        return false;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Export functions for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateMockData,
        downloadCSV,
        downloadJSON,
        formatCurrency,
        getCurrentTimestamp,
        toggleDarkMode,
        copyJSONToClipboard,
        handleRegionFileUpload,
        handleProductFileUpload,
        updateRegionDropdown,
        updateProductDropdown,
        resetRegionDropdown,
        resetProductDropdown,
        initializeHorizontalScroll,
        scrollTableLeft,
        scrollTableRight,
        disableDataControls,
        enableDataControls
    };
} 