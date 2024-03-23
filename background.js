/* background.js */

let poslovnica = "CCOE";
const supabaseUrl = 'https://xxqeupvmmmxltbtxcgvp.supabase.co/rest/v1';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cWV1cHZtbW14bHRidHhjZ3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk1Nzk3MDYsImV4cCI6MTk4NTE1NTcwNn0.Pump9exBhsc1TbUGqegEsqIXnmsmlUZMVlo2gSHoYDo';

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension Installed');

    fetchLokali(supabaseUrl, supabaseKey)
        .then(lokali => {
            chrome.storage.local.set({ poslovnica: poslovnica, lokali: lokali }, function () {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                } else {
                    console.log('Data successfully saved in local storage:', { poslovnica: poslovnica, supabaseUrl: supabaseUrl, supabaseKey: supabaseKey, lokali: lokali });
                    chrome.storage.local.get(['poslovnica', 'supabaseUrl', 'supabaseKey'], function (data) {
                        const selectedLocation = data.poslovnica || 'CCOE';
                        chrome.runtime.sendMessage({ action: 'sendCurrentLocation', poslovnica: selectedLocation }, function (response) {
                            if (chrome.runtime.lastError) {
                                console.error(chrome.runtime.lastError.message);
                            } else {
                                console.log('Current location sent to popup.js:', selectedLocation);
                            }
                        });
                    });
                    chrome.storage.local.set({ intervalId: setInterval(fetchElement, 5000) });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching locations:', error);
        });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "updateLocation") {
        const selectedLocation = request.poslovnica;
        poslovnica = selectedLocation;
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "elementsExtracted") {
        let median = "5"; // Default median value if no data is available

        if (request.data.length > 0) {
            const timeToMinutes = request.data.map(time => {
                const [hours, minutes, seconds] = time.split(':').map(Number);
                return (hours * 60) + minutes + (seconds / 60);
            });
            const sortedData = timeToMinutes.sort((a, b) => a - b);
            const middleIndex = Math.floor(sortedData.length / 2);
            median = sortedData.length % 2 === 0 ? (sortedData[middleIndex - 1] + sortedData[middleIndex]) / 2 : sortedData[middleIndex];
            const medianHours = Math.floor(median / 60);
            const medianMinutes = Math.round(median % 60);
            median = medianHours === 0 ? (medianMinutes < 10 ? '0' : '') + medianMinutes : (medianHours + ':') + (medianMinutes < 10 ? '0' : '') + medianMinutes;
        }

        console.log("Median:", median);
        sendMedianSupa(median);
    }
});

async function fetchLokali(url, key) {
    const response = await fetch(`${url}/lokacije`, {
        method: 'GET',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
        },
    });
    if (!response.ok) {
        throw new Error('Unable to fetch locations from Supabase');
    }
    return await response.json();
}

async function sendMedianSupa(median) {
    console.log("Poslovnica: ", poslovnica);
    const response = await fetch(`${supabaseUrl}/waitTime?poslovnica=eq.${poslovnica}`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
        },
    });
    if (!response.ok) {
        console.error('Error fetching data:', response.statusText);
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    if (data.length === 0) {
        try {
            const response = await fetch(`${supabaseUrl}/waitTime`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ wait_time: median, poslovnica: poslovnica }),
            });
            if (!response.ok) {
                console.error('Error creating new record:', response.statusText);
                throw new Error('Network response was not ok');
            }
            const newData = await response.json();
            console.log('New record created successfully:', newData);
        } catch (error) {
            console.error('Error creating new record:', error);
        }
    } else {
        const recordId = data[0].id;
        try {
            const response = await fetch(`${supabaseUrl}/waitTime?id=eq.${recordId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ wait_time: median }),
            });
            if (!response.ok) {
                console.error('Error updating record:', response.statusText);
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            console.error('Error updating record:', error);
        }
    }
}

function fetchElement() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "fetchElement" });
    });
}
