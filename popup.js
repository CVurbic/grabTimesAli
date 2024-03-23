document.addEventListener('DOMContentLoaded', function () {
    // Prikazi trenutnu lokaciju
    chrome.storage.local.get('poslovnica', function (data) {
        const selectedLocation = data.poslovnica || 'CCOE'; // Ako nema trenutno odabrane lokacije, postavi na CCOE
        updateLocationButtonsStyle(selectedLocation); // Ažuriraj stil tipki na temelju odabrane lokacije
    });

    // Dodaj event listener za klik na gumb za promjenu lokacije
    document.getElementById('changeLocationButton').addEventListener('click', changeLocation);
});

// Funkcija za dohvaćanje lokalne poslovnice iz storage.local
function getLocalPoslovnica(callback) {
    chrome.storage.local.get('lokali', function (data) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            callback('CCOE'); // Vratite CCOE ako dohvaćanje nije uspjelo ili nema podataka
        } else {
            const sviLokali = data.lokali || ['CCOE'];
            callback(sviLokali);
        }
    });
}

// Poziv funkcije za dohvaćanje lokalne poslovnice
getLocalPoslovnica(function (sviLokali) {
    const locationButtonsContainer = document.getElementById('locationButtons');
    // Generiraj <div> elemente za svaku lokaciju
    sviLokali.forEach(location => {
        const locationButton = document.createElement('div');
        locationButton.classList.add('location-button');
        locationButton.textContent = location.lokacija;
        locationButton.dataset.location = location.lokacija;
        locationButton.addEventListener('click', () => {
            console.log(location);
            const selectedLocation = location.lokacija;
            setSelectedLocation(selectedLocation);
            updateLocationButtonsStyle(selectedLocation);
        });

        locationButtonsContainer.appendChild(locationButton);
    });
});

// Funkcija za postavljanje odabrane lokacije
function setSelectedLocation(location) {
    // Spremi odabranu lokaciju u lokalno pohranjivanje
    chrome.storage.local.set({ 'poslovnica': location }, function () {
        console.log('Selected location updated to:', location);
        // Pošalji poruku background skripti da ažurira poslovnicu
        chrome.runtime.sendMessage({ action: 'updateLocation', poslovnica: location }, function (response) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            } else {
                console.log('Location updated in background script');
            }
        });
    });
}

// Funkcija za ažuriranje izgleda tipki na temelju odabrane lokacije
function updateLocationButtonsStyle(selectedLocation) {
    const locationButtons = document.querySelectorAll('.location-button');
    locationButtons.forEach(button => {
        if (button.dataset.location === selectedLocation) {
            button.classList.add('selected-location');
        } else {
            button.classList.remove('selected-location');
        }
    });
}

// Funkcija za promjenu lokacije
function changeLocation() {
    const selectedLocation = document.getElementById('locationSelect').value;
    // Spremi odabranu lokaciju u lokalno pohranjivanje
    setSelectedLocation(selectedLocation);
    // Ažuriraj izgled tipki
    updateLocationButtonsStyle();
}
