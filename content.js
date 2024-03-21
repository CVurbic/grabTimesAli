// content.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    if (request.action === "fetchElement") {
        var elements = document.querySelectorAll('span.font-weight-bold.text-white');

        var extractedData = [];
        elements.forEach(function (element) {
            extractedData.push(element.innerText);
        });
        chrome.runtime.sendMessage({ action: "elementsExtracted", data: extractedData });

    }
});
