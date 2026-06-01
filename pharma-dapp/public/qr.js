
/**
 Generate a QR code into a canvas or img element
 * @param {string} elementId - ID of <canvas> or <div> to render into
 * @param {object} data - Medicine data to encode
 */
function generateQRCode(elementId, data) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const text = JSON.stringify({
    medicineId: data.medicineId,
    name: data.name,
    batchNumber: data.batchNumber,
    manufacturerName: data.manufacturerName,
    expiryDate: data.expiryDate,
  });

  // Clear previous
  el.innerHTML = "";

  new QRCode(el, {
    text: text,
    width: 180,
    height: 180,
    colorDark: "#1e1b4b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

/**
 * Generate QR and also save PNG via server API, return qrPath
 * @param {object} data - medicine data
 * @param {string} txHash - transaction hash
 * @returns {Promise<string|null>} qrPath
 */
async function generateAndSaveQR(data, txHash) {
  try {
    const res = await fetch("/api/medicine/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, txHash }),
    });
    const json = await res.json();
    if (json.success && json.qrPath) {
      return json.qrPath;
    }
    return null;
  } catch (err) {
    console.error("QR save error:", err);
    return null;
  }
}

/**
 * Show QR image from a saved path
 * @param {string} qrPath - e.g. /qr/MED001.png
 * @param {string} imgId - ID of <img> element
 * @param {string} boxId - ID of container div
 */
function showQRImage(qrPath, imgId = "qrImage", boxId = "qrBox") {
  const img = document.getElementById(imgId);
  const box = document.getElementById(boxId);
  if (img) { img.src = qrPath; img.classList.remove("hidden"); }
  if (box) box.classList.remove("hidden");
}

/**
 * Download QR code image
 * @param {string} medicineId
 */
function downloadQR(medicineId) {
  const link = document.createElement("a");
  link.href = `/qr/${medicineId}.png`;
  link.download = `QR_${medicineId}.png`;
  link.click();
}

// ─── QR Scanner (using html5-qrcode library) ─────────────────────────────────

let html5QrCodeInstance = null;
let scannerRunning = false;

/**
 * Start camera-based QR scanner
 * @param {string} readerElementId - ID of div to mount scanner
 * @param {function} onSuccess - callback(decodedText)
 * @param {function} onError - optional error callback
 */
function startQRScanner(readerElementId, onSuccess, onError) {
  if (scannerRunning) {
    console.warn("Scanner already running.");
    return;
  }

  if (!document.getElementById(readerElementId)) {
    console.error(`Element #${readerElementId} not found.`);
    return;
  }

  html5QrCodeInstance = new Html5Qrcode(readerElementId);

  Html5Qrcode.getCameras()
    .then((cameras) => {
      if (!cameras || cameras.length === 0) {
        if (onError) onError("No cameras found on this device.");
        return;
      }

      // Prefer back camera
      const camera = cameras.find((c) =>
        c.label.toLowerCase().includes("back") ||
        c.label.toLowerCase().includes("rear") ||
        c.label.toLowerCase().includes("environment")
      ) || cameras[cameras.length - 1];

      html5QrCodeInstance
        .start(
          camera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onSuccess(decodedText);
          },
          (errorMsg) => {
            // scan frame error — ignore silently
          }
        )
        .then(() => {
          scannerRunning = true;
          updateScannerButtons(true);
        })
        .catch((err) => {
          console.error("Scanner start error:", err);
          if (onError) onError("Camera error: " + err);
        });
    })
    .catch((err) => {
      if (onError) onError("Cannot access cameras: " + err);
    });
}

/**
 * Stop the running QR scanner
 */
function stopQRScanner() {
  if (html5QrCodeInstance && scannerRunning) {
    html5QrCodeInstance
      .stop()
      .then(() => {
        scannerRunning = false;
        updateScannerButtons(false);
        // Clear the scanner UI
        const reader = document.getElementById("qr-reader");
        if (reader) reader.innerHTML = "";
      })
      .catch((err) => console.error("Stop scanner error:", err));
  }
}


function updateScannerButtons(running) {
  const startBtn = document.getElementById("startScanBtn");
  const stopBtn = document.getElementById("stopScanBtn");
  if (startBtn) startBtn.disabled = running;
  if (stopBtn) stopBtn.disabled = !running;
  if (startBtn) startBtn.classList.toggle("opacity-50", running);
  if (stopBtn) stopBtn.classList.toggle("opacity-50", !running);
}

/**
 * Scan QR from an uploaded image file
 * @param {File} file - image file from <input type="file">
 * @param {string} readerElementId - ID of div to mount scanner
 * @param {function} onSuccess - callback(decodedText)
 * @param {function} onError - optional error callback
 */
function scanQRFromFile(file, readerElementId, onSuccess, onError) {
  if (!document.getElementById(readerElementId)) {
    console.error(`Element #${readerElementId} not found.`);
    return;
  }

  const scanner = new Html5Qrcode(readerElementId);
  scanner
    .scanFile(file, true)
    .then((decodedText) => {
      onSuccess(decodedText);
    })
    .catch((err) => {
      if (onError) onError("Could not read QR from image: " + err);
    });
}

/**
 * Parse decoded QR text into a medicine object
 * Handles both JSON-encoded and plain medicine ID strings
 * @param {string} text
 * @returns {object} { medicineId, name, batchNumber, ... } or { medicineId: text }
 */
function parseQRData(text) {
  try {
    const data = JSON.parse(text);
    if (data.medicineId) return data;
  } catch (_) {}
  // Fallback: treat raw text as medicineId
  return { medicineId: text.trim() };
}
