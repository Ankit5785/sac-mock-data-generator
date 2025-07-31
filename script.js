// Global variable to store generated data
let generatedData = [];

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    document.getElementById('generateBtn').addEventListener('click', handleGenerateData);
    document.getElementById('downloadBtn').addEventListener('click', handleDownloadCSV);
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
    
    // Validate min/max values
    if (formInputs.minValue >= formInputs.maxValue) {
        alert('Min value must be less than Max value');
        return;
    }

    // Generate mock data with Revenue and Cost
    generatedData = generateMockData(formInputs);
    
    // Display data in table format
    displayDataTable(generatedData);
    
    // Display data in JSON format
    displayJsonOutput(generatedData);
}

// Read all form input values
function readFormInputs() {
    return {
        region: document.getElementById('region').value,
        product: document.getElementById('product').value,
        timePeriod: document.getElementById('timePeriod').value,
        minValue: parseInt(document.getElementById('minValue').value),
        maxValue: parseInt(document.getElementById('maxValue').value)
    };
}

// Generate mock data with combinations of Revenue and Cost
function generateMockData(inputs) {
    const { region, product, timePeriod, minValue, maxValue } = inputs;
    const data = [];
    
    // Get countries for the selected region
    const countries = getCountriesForRegion(region);
    
    // Define metrics
    const metrics = ['Revenue', 'Cost'];
    
    // Generate combinations of countries and metrics
    countries.forEach(country => {
        metrics.forEach(metric => {
            // Generate multiple data points for each combination
            for (let i = 0; i < 3; i++) {
                const value = generateRandomValue(minValue, maxValue);
                
                data.push({
                    Region: region,
                    Country: country,
                    Product: product,
                    TimePeriod: timePeriod,
                    Metric: metric,
                    Value: value,
                    Currency: 'USD',
                    Timestamp: new Date().toISOString()
                });
            }
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
    return regionCountries[region] || ['Unknown'];
}

// Display data in table format
function displayDataTable(data) {
    const outputDisplay = document.getElementById('outputDisplay');
    
    if (data.length === 0) {
        outputDisplay.innerHTML = 'No data generated.';
        outputDisplay.className = 'output-display empty';
        return;
    }

    outputDisplay.className = 'output-display';
    
    // Create table HTML
    let tableHTML = '<table class="data-table"><thead><tr>';
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // Add data rows
    data.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            let cellValue = row[header];
            // Format currency values
            if (header === 'Value') {
                cellValue = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(cellValue);
            }
            tableHTML += `<td>${cellValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    outputDisplay.innerHTML = tableHTML;
}

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
        alert('No data to download. Please generate data first.');
        return;
    }
    downloadCSV(generatedData);
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

// Export functions for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateMockData,
        downloadCSV,
        formatCurrency,
        getCurrentTimestamp
    };
} 