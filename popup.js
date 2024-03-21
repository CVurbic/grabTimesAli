chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension Installed');
});

chrome.action.onClicked.addListener(async (tab) => {
    const times = await fetchTimes(tab.id);
    displayTimes(times);
});

async function fetchTimes(tabId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const times = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            const spans = document.querySelectorAll('span.font-weight-bold.text-white');
            const timesArray = Array.from(spans).map(span => span.getAttribute('date-time'));
            return timesArray;
        }
    });

    return times[0].result;
}

function displayTimes(times) {
    const timesList = document.getElementById('timesList');
    timesList.innerHTML = '';
    times.forEach(time => {
        const listItem = document.createElement('li');
        listItem.textContent = time;
        timesList.appendChild(listItem);
    });
}
