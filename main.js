
let wakeLock = null;

const wakeStatus = document.getElementById("wakeStatus");

// -----------------------------
// Wake Lock Logic
// -----------------------------

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeStatus.textContent = "Active";
    console.log("Wake lock acquired");

    wakeLock.addEventListener("release", () => {
    const wakeAlert = document.getElementById("wakeAlert");
      console.log("Wake lock was released");
      wakeStatus.textContent = "Lost  Reacquiring";
      wakeLock = null;
    });
  } catch (err) {
    console.error("Wake lock error:", err);
    wakeStatus.textContent = "Error";
  }
}



// Reacquire loop (no session reset)
setInterval(async () => {
  if (!wakeLock) {
          if (wakeAlert) {
            wakeAlert.currentTime = 0;
            wakeAlert.play().catch(() => {});
          }
    try {
      await requestWakeLock();
    } catch (err) {
      console.log("Reacquire failed:", err);
    }
  }
}, 2000);

// -----------------------------
// Launch Google Maps (platform aware)
// -----------------------------
function launchMaps() {
  const androidIntent =
    "intent://maps.google.com/#Intent;scheme=https;package=com.google.android.apps.maps;end";
  const iosURL = "maps://";

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("android")) {
    window.open(androidIntent, "_blank");
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    window.open(iosURL, "_blank");
  } else {
    window.open("https://www.google.com/maps", "_blank");
  }
}



// --- GPS Logging & Diagnostics ---
let gpsLog = [];
let gpsFixCount = 0;
let gpsInterruptCount = 0;
let lastFixTimestamp = null;
let gpsIntervalId = null;

function startGPSLogging() {
  if (gpsIntervalId) return; // Already running
  gpsIntervalId = setInterval(() => {
    let gotFix = false;
    let fixTimeout = setTimeout(() => {
      if (!gotFix) {
        recordInterrupt();
        updateGPSUI();
      }
    }, 4000); // 4s interruption threshold

    navigator.geolocation.getCurrentPosition(
      (position) => {
        gotFix = true;
        clearTimeout(fixTimeout);
        recordFix(position);
        updateGPSUI();
      },
      (err) => {
        clearTimeout(fixTimeout);
        recordInterrupt();
        updateGPSUI();
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 0 }
    );
  }, 2000);
}

function recordFix(position) {
  gpsLog.push(position);
  gpsFixCount++;
  lastFixTimestamp = Date.now();
}

function recordInterrupt() {
  gpsInterruptCount++;
}

function getFixAge() {
  if (!lastFixTimestamp) return '--';
  return Math.floor((Date.now() - lastFixTimestamp) / 1000);
}

function updateGPSUI() {
  const fixEl = document.getElementById('gpsFixCount');
  const intEl = document.getElementById('gpsInterruptCount');
  const ageEl = document.getElementById('gpsFixAge');
  if (fixEl) fixEl.textContent = gpsFixCount;
  if (intEl) intEl.textContent = gpsInterruptCount;
  if (ageEl) ageEl.textContent = getFixAge();
}

// Request wake lock and start GPS logging on page load
window.addEventListener("DOMContentLoaded", () => {
  requestWakeLock();
  startGPSLogging();
  setInterval(updateGPSUI, 1000); // Keep fix age fresh
});

// -----------------------------
// PWA Service Worker Registration
// -----------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js');
  });
}