
/* ====================================
   MOSQUITOWATCH - SW08
   Frontend JavaScript
==================================== */

// Sample demonstration reports.
// These are NOT live GVMC reports.

let reports = [ ]
    

let surveys = [];

let dashboardMap = null;
let fullMap = null;

let dashboardMarkers = null;
let fullMapMarkers = null;


// ====================================
// PAGE NAVIGATION
// ====================================

function showPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageName);

    if (!selectedPage) return;

    selectedPage.classList.add("active");

    const selectedButton = document.querySelector(
        `.nav-item[data-page="${pageName}"]`
    );

    if (selectedButton) {
        selectedButton.classList.add("active");
    }

    const titles = {
        dashboard: "Dashboard",
        map: "GIS Monitoring Map",
        reports: "Reports",
        citizen: "Citizen Report",
        survey: "Larval Survey"
    };

    document.getElementById("page-title").textContent =
        titles[pageName] || "MosquitoWatch";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    // Leaflet maps need resizing after becoming visible.

    if (pageName === "dashboard") {

        setTimeout(() => {

            if (dashboardMap) {
                dashboardMap.invalidateSize();
            }

        }, 100);

    }

    if (pageName === "map") {

        setTimeout(() => {

            initializeFullMap();

            if (fullMap) {
                fullMap.invalidateSize();
            }

        }, 100);

    }
}


// Attach navigation buttons.

document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

        showPage(button.dataset.page);

    });

});


// ====================================
// MAP INITIALIZATION
// ====================================

function initializeDashboardMap() {

    if (dashboardMap) return;

    // Visakhapatnam demonstration center.

    dashboardMap = L.map("dashboard-map").setView(
        [17.75, 83.30],
        11
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
        }
    ).addTo(dashboardMap);

    dashboardMarkers = L.layerGroup().addTo(dashboardMap);

    updateDashboardMap();

}


function initializeFullMap() {

    if (fullMap) return;

    fullMap = L.map("full-map").setView(
        [17.75, 83.30],
        11
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
        }
    ).addTo(fullMap);

    fullMapMarkers = L.layerGroup().addTo(fullMap);

    updateFullMap();

}


// ====================================
// MAP MARKERS
// ====================================

function getMarkerColor(priority) {

    if (priority === "High") {
        return "#ef4444";
    }

    if (priority === "Medium") {
        return "#f59e0b";
    }

    return "#22c55e";

}


function createMarker(report) {

    const color = getMarkerColor(report.priority);

    const markerIcon = L.divIcon({

        className: "",

        html: `
            <div style="
                background:${color};
                width:18px;
                height:18px;
                border:3px solid white;
                border-radius:50%;
                box-shadow:0 2px 8px rgba(0,0,0,0.4);
            "></div>
        `,

        iconSize: [18, 18],

        iconAnchor: [9, 9]

    });

    const marker = L.marker(
        [report.latitude, report.longitude],
        { icon: markerIcon }
    );

    const popup = `
        <div style="min-width:160px">

            <strong>${escapeHTML(report.id)}</strong>

            <p>${escapeHTML(report.location)}</p>

            <p>Ward: ${escapeHTML(report.ward)}</p>

            <p>
                Priority:
                <strong>${escapeHTML(report.priority)}</strong>
            </p>

            <p>Status: ${escapeHTML(report.status)}</p>

        </div>
    `;

    marker.bindPopup(popup);

    return marker;

}


function updateDashboardMap() {

    if (!dashboardMarkers) return;

    dashboardMarkers.clearLayers();

    reports.forEach(report => {

        createMarker(report).addTo(dashboardMarkers);

    });

}


function updateFullMap() {

    if (!fullMapMarkers) return;

    fullMapMarkers.clearLayers();

    reports.forEach(report => {

        createMarker(report).addTo(fullMapMarkers);

    });

}


// ====================================
// DASHBOARD STATISTICS
// ====================================

function updateStatistics() {

    document.getElementById("total-count").textContent =
        reports.length;

    document.getElementById("pending-count").textContent =
        reports.filter(r => r.status === "Pending").length;

    document.getElementById("verified-count").textContent =
        reports.filter(r => r.status === "Verified").length;

    document.getElementById("resolved-count").textContent =
        reports.filter(r => r.status === "Resolved").length;

}


// ====================================
// HTML ESCAPING
// ====================================

function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );

}


// ====================================
// REPORT TABLE
// ====================================

function getStatusClass(status) {

    return status.toLowerCase();

}


function getPriorityClass(priority) {

    return priority.toLowerCase();

}


function renderReports() {

    const recentTable = document.getElementById("recent-reports");

    const allTable = document.getElementById("all-reports");

    recentTable.innerHTML = "";

    allTable.innerHTML = "";


    // Recent reports

    reports.slice(-5).reverse().forEach(report => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="report-id">
                ${escapeHTML(report.id)}
            </td>

            <td>${escapeHTML(report.location)}</td>

            <td>${escapeHTML(report.ward)}</td>

            <td>
                <span class="priority-badge ${getPriorityClass(report.priority)}">
                    ${escapeHTML(report.priority)}
                </span>
            </td>

            <td>
                <span class="status ${getStatusClass(report.status)}">
                    ${escapeHTML(report.status)}
                </span>
            </td>
        `;

        recentTable.appendChild(row);

    });


    // All reports

    reports.slice().reverse().forEach(report => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="report-id">
                ${escapeHTML(report.id)}
            </td>

            <td>${escapeHTML(report.location)}</td>

            <td>${escapeHTML(report.ward)}</td>

            <td>
                <span class="priority-badge ${getPriorityClass(report.priority)}">
                    ${escapeHTML(report.priority)}
                </span>
            </td>

            <td>
                <span class="status ${getStatusClass(report.status)}">
                    ${escapeHTML(report.status)}
                </span>
            </td>

            <td>
                <button
                    class="action-btn"
                    data-report-id="${escapeHTML(report.id)}">

                    ${getNextAction(report.status)}

                </button>
            </td>
        `;

        allTable.appendChild(row);

    });


    updatePriorityList();

    updateStatistics();

    updateDashboardMap();

    updateFullMap();

}


function getNextAction(status) {

    if (status === "Pending") {
        return "Verify";
    }

    if (status === "Verified") {
        return "Resolve";
    }

    return "Resolved";

}


// Report status updates.

document.getElementById("all-reports").addEventListener(
    "click",
    event => {

        const button = event.target.closest("[data-report-id]");

        if (!button) return;

        const report = reports.find(
            r => r.id === button.dataset.reportId
        );

        if (!report) return;

        if (report.status === "Pending") {

            report.status = "Verified";

        } else if (report.status === "Verified") {

            report.status = "Resolved";

        }

        renderReports();

    }
);


// ====================================
// PRIORITY LOCATIONS
// ====================================

function updatePriorityList() {

    const priorityList =
        document.getElementById("priority-list");

    priorityList.innerHTML = "";

    const highPriorityReports = reports
        .filter(r => r.priority === "High" &&
                     r.status !== "Resolved")
        .slice(0, 5);

    if (highPriorityReports.length === 0) {

        priorityList.innerHTML =
            "<p>No high-priority reports.</p>";

        return;

    }

    highPriorityReports.forEach(report => {

        const item = document.createElement("div");

        item.className = "priority-item";

        item.innerHTML = `
            <div class="priority-marker">!</div>

            <div class="priority-info">

                <strong>${escapeHTML(report.location)}</strong>

                <small>
                    Ward ${escapeHTML(report.ward)}
                    · ${escapeHTML(report.status)}
                </small>

            </div>
        `;

        priorityList.appendChild(item);

    });

}


// ====================================
// SEARCH AND FILTER
// ====================================

function filterReports() {

    const searchValue =
        document.getElementById("search-input")
        .value.toLowerCase();

    const selectedStatus =
        document.getElementById("status-filter").value;

    document.querySelectorAll("#all-reports tr").forEach(row => {

        const text = row.textContent.toLowerCase();

        const matchesSearch =
            text.includes(searchValue);

        const matchesStatus =
            selectedStatus === "All" ||
            text.includes(selectedStatus.toLowerCase());

        row.style.display =
            matchesSearch && matchesStatus ? "" : "none";

    });

}


document.getElementById("search-input").addEventListener(
    "input",
    filterReports
);


document.getElementById("status-filter").addEventListener(
    "change",
    filterReports
);


// ====================================
// PHOTO PREVIEW
// ====================================

let uploadedPhoto = "";

document.getElementById("photo").addEventListener(
    "change",
    event => {

        const file = event.target.files[0];

        const preview =
            document.getElementById("photo-preview");

        if (!file) {

            uploadedPhoto = "";

            preview.hidden = true;

            return;

        }

        if (!file.type.startsWith("image/")) {

            alert("Please select an image file.");

            event.target.value = "";

            return;

        }

        if (file.size > 5 * 1024 * 1024) {

            alert("Please select an image smaller than 5 MB.");

            event.target.value = "";

            return;

        }

        uploadedPhoto = URL.createObjectURL(file);

        preview.src = uploadedPhoto;

        preview.hidden = false;

    }
);


// ====================================
// GPS LOCATION
// ====================================

document.getElementById("gps-btn").addEventListener(
    "click",
    () => {

        if (!navigator.geolocation) {

            alert("GPS location is not supported.");

            return;

        }

        const button =
            document.getElementById("gps-btn");

        button.textContent = "Getting location...";

        navigator.geolocation.getCurrentPosition(

            position => {

                document.getElementById("latitude").value =
                    position.coords.latitude.toFixed(6);

                document.getElementById("longitude").value =
                    position.coords.longitude.toFixed(6);

                button.textContent =
                    "✓ Location captured";

            },

            error => {

                alert(
                    "Unable to get location. Please enter it manually."
                );

                button.textContent =
                    "⌖ Get My Current Location";

            },

            {
                enableHighAccuracy: true,
                timeout: 10000
            }

        );

    }
);


// ====================================
// CITIZEN REPORT SUBMISSION
// ====================================

document.getElementById("report-form").addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const location =
            document.getElementById("location-name").value.trim();

        const ward =
            Number(document.getElementById("ward-number").value);

        const latitude =
            Number(document.getElementById("latitude").value);

        const longitude =
            Number(document.getElementById("longitude").value);

        const photo =
            document.getElementById("photo").files[0];

        if (!location || !ward || !photo) {

            alert("Please complete all required fields.");

            return;

        }

        if (
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180
        ) {

            alert("Please enter valid GPS coordinates.");

            return;

        }

        const report = {

            id: "SW08-" + String(
                Date.now()
            ).slice(-6),

            location: location,

            ward: ward,

            type: document.getElementById(
                "location-type"
            ).value,

            priority: document.getElementById(
                "priority"
            ).value,

            status: "Pending",

            latitude: latitude,

            longitude: longitude,

            description: document.getElementById(
                "description"
            ).value,

            photo: uploadedPhoto,

            date: new Date().toLocaleDateString()

        };

        reports.push(report);

        renderReports();

        document.getElementById("report-form").reset();

        document.getElementById("photo-preview").hidden = true;

        uploadedPhoto = "";

        document.getElementById("gps-btn").textContent =
            "⌖ Get My Current Location";

        document.getElementById("form-message").textContent =
            "Report submitted successfully! Report ID: " + report.id;

        document.getElementById("form-message").style.color =
            "#15803d";

        showPage("reports");

    }
);


// ====================================
// LARVAL SURVEY
// ====================================

document.getElementById("survey-form").addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const survey = {

            id: "SUR-" + String(Date.now()).slice(-6),

            ward: document.getElementById(
                "survey-ward"
            ).value,

            location: document.getElementById(
                "survey-location"
            ).value,

            date: document.getElementById(
                "survey-date"
            ).value,

            larvae: document.getElementById(
                "larvae-found"
            ).value,

            remarks: document.getElementById(
                "survey-remarks"
            ).value

        };

        surveys.push(survey);

        document.getElementById("survey-form").reset();

        document.getElementById("survey-message").textContent =
            "Survey saved successfully! Survey ID: " + survey.id;

        document.getElementById("survey-message").style.color =
            "#15803d";

    }
);


// ====================================
// INITIALIZE APPLICATION
// ====================================

initializeDashboardMap();

renderReports();


// Today's date for survey.

document.getElementById("survey-date").value =
    new Date().toISOString().split("T")[0];
