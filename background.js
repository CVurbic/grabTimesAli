/* background.js */

const poslovnica = "langov"

const supabaseUrl = 'https://xxqeupvmmmxltbtxcgvp.supabase.co/rest/v1';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cWV1cHZtbW14bHRidHhjZ3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk1Nzk3MDYsImV4cCI6MTk4NTE1NTcwNn0.Pump9exBhsc1TbUGqegEsqIXnmsmlUZMVlo2gSHoYDo';

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension Installed');
    chrome.storage.local.set({ intervalId: setInterval(fetchElement, 5000) });
});

chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
    if (message.action === "fetchElement") {
        console.log("Content script requested to fetch element");
        fetchElement();
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    if (request.action === "elementsExtracted") {
        console.log("Extracted elements:", request.data);
        let median;

        if (request.data.length < 1) {
            median = "05";
        } else {
            // Pretvaranje vremena u minute
            const timeToMinutes = request.data.map(time => {
                const [hours, minutes, seconds] = time.split(':').map(Number);
                return (hours * 60) + minutes + (seconds / 60);
            });

            const sum = timeToMinutes.reduce((acc, curr) => acc + curr, 0);
            const average = sum / timeToMinutes.length;
            const averageHours = Math.floor(average / 60);
            const averageMinutes = Math.round(average % 60);
            const averageTime = averageHours + ':' + (averageMinutes < 10 ? '0' : '') + averageMinutes;
            console.log("Average time: ", averageTime)
            // Sortirajte niz vrijednosti
            const sortedData = timeToMinutes.sort((a, b) => a - b);
            console.log("Sorted elements:", sortedData);

            const length = sortedData.length;
            if (length % 2 === 0) {
                // Ako je broj elemenata paran, izračunajte aritmetičku sredinu dviju srednjih vrijednosti
                const middleIndex = length / 2;
                median = (sortedData[middleIndex - 1] + sortedData[middleIndex]) / 2;
            } else {
                // Ako je broj elemenata neparan, medijan je srednja vrijednost niza
                const middleIndex = Math.floor(length / 2);
                median = sortedData[middleIndex];
            }

            // Pretvaranje medijana u format vremena
            const medianHours = Math.floor(median / 60);
            const medianMinutes = Math.round(median % 60);
            median = medianHours + ':' + (medianMinutes < 10 ? '0' : '') + medianMinutes;
        }
        /* else{
        } */

        console.log("Median:", median);
        sendMedianSupa(median)
    }
});

async function sendMedianSupa(median) {
    fetch(`${supabaseUrl}/waitTime?poslovnica=eq.${poslovnica}`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                console.error('Error fetching data:', response.statusText);
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                // Ako nema podataka za određenu poslovnicu, stvorite novi redak koristeći metodu POST
                fetch(`${supabaseUrl}/waitTime`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                    },
                    body: JSON.stringify({ wait_time: median, poslovnica: poslovnica }),
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Error creating new record:', response.statusText);
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('New record created successfully:', data);
                    })
                    .catch(error => {
                        console.error('Error creating new record:', error);
                    });
            } else {
                // Ako postoje podaci za određenu poslovnicu, ažurirajte postojeći zapis koristeći metodu PATCH
                const recordId = data[0].id; // Pretpostavljamo da je ID prvi element u rezultatu
                fetch(`${supabaseUrl}/waitTime?id=eq.${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                    },
                    body: JSON.stringify({ wait_time: median }),
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Error updating record:', response.statusText);
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Record updated successfully:', data);
                    })
                    .catch(error => {
                        console.error('Error updating record:', error);
                    });
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}




function fetchElement() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "fetchElement" });
    });
}

