import { renderVisitorPanel } from "../shared/visitor-panel.js";
import { bucketName, configIsReady as configIsSet, supabase, tableName } from "../shared/supabase.js";
console.log("Admin script loaded. Supabase config ready:", configIsSet, "Supabase object:", supabase, "Bucket:", bucketName, "Table:", tableName);

const authScreen = document.getElementById("authScreen");
const adminScreen = document.getElementById("adminScreen");
const authStatus = document.getElementById("auth-status");
const logoutButton = document.getElementById("logoutButton");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const submitAuthBtn = document.getElementById("submitAuthBtn");
const toggleModeLink = document.getElementById("toggleModeLink");
const resetPasswordLink = document.getElementById("resetPasswordLink");
const confirmField = document.getElementById("confirmField");
const formModeText = document.getElementById("formModeText");
const authTabs = document.querySelectorAll(".auth-tab");
const uploadDropZone = document.getElementById("uploadDropZone");
const fileInput = document.getElementById("visitorImageFile");
const uploadMessage = document.getElementById("uploadMessage");
const previewButton = document.getElementById("previewButton");
const visitorForm = document.getElementById("visitorForm");
const previewBox = document.getElementById("previewBox");
const previewStage = document.getElementById("previewStage");
const previewPanel = document.getElementById("visitor-panel");
const visitorNameInput = document.getElementById("visitorNameInput"); // fallback for older admin markup
const visitorSelect = document.getElementById("visitorNameSelect");

function getVisitorTextValue() {
  const el = visitorNameInput || document.getElementById("visitorNameInput");
  return (el && typeof el.value === 'string') ? el.value.trim() : '';
}

let authMode = "login";
let selectedFile = null;
let selectedFilePreviewUrl = ""; // blob-URL der lokal gewählten Datei
let uploadedPublicUrl = "";
let selectedVisitorId = null; // null = "neuer Besucher"-Modus
let visitorsCache = [];
let selectedName = "";
let selectedTemplateId = null;

function showMessage(el, type, text) {
  el.className = `inline-message ${type}`;
  el.textContent = text;
}

function showNotice(el, type, text) {
  el.className = `notice-box ${type}`;
  el.textContent = text;
}

function setAuthMode(mode) {
  authMode = mode;
  authTabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  if (mode === "login") {
    submitAuthBtn.textContent = "Anmelden";
    formModeText.textContent = "Sie haben noch kein Konto?";
    toggleModeLink.textContent = "Registrieren";
    confirmField.style.display = "none";
    resetPasswordLink.style.display = "inline";
  } else {
    submitAuthBtn.textContent = "Konto erstellen";
    formModeText.textContent = "Sie haben schon ein Konto?";
    toggleModeLink.textContent = "Zum Login";
    confirmField.style.display = "grid";
    resetPasswordLink.style.display = "none";
  }
}

function showAuthScreen() {
  authScreen.classList.add("active");
  adminScreen.classList.remove("active");
  authStatus.textContent = "Nicht angemeldet";
  logoutButton.style.display = "none";
}

function showAdminScreen() {
  authScreen.classList.remove("active");
  adminScreen.classList.add("active");
  authStatus.textContent = "Angemeldet";
  logoutButton.style.display = "inline-flex";
}

function validateFile(file) {
  if (!file) {
    return { valid: false, message: "Bitte wählen Sie eine Datei aus." };
  }

  const allowedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml"
  ];

  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".svg"
  ];

  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  const mimeValid = allowedMimeTypes.includes(file.type);
  const extensionValid = allowedExtensions.includes(extension);

  if (!mimeValid && !extensionValid) {
    return {
      valid: false,
      message: "Ungültiger Dateityp. Erlaubt sind nur PNG, JPG/JPEG, WEBP oder SVG."
    };
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: "Die Datei ist zu groß. Bitte wählen Sie eine Datei bis 5 MB."
    };
  }

  return { valid: true, message: "Datei gültig." };
}

const PREVIEW_STAGE_WIDTH = 1080; // Kiosk-Display (Hochformat)

function clearSelectedFile() {
  if (selectedFilePreviewUrl) URL.revokeObjectURL(selectedFilePreviewUrl);
  selectedFile = null;
  selectedFilePreviewUrl = "";
  fileInput.value = "";
}

// Zeigt das Panel mit dem aktuellen Formularstand: neu gewählte Datei, sonst das gespeicherte Bild
function renderPreview() {
  renderVisitorPanel(previewPanel, {
    name: getVisitorTextValue(),
    imageUrl: selectedFilePreviewUrl || uploadedPublicUrl,
    alwaysVisible: true
  });
}

// Skaliert die 1080-px-Bühne auf die Kartenbreite; alle Proportionen bleiben identisch
function fitPreviewStage() {
  const width = previewBox.clientWidth;
  if (!width) return;
  const scale = width / PREVIEW_STAGE_WIDTH;
  previewStage.style.transform = `scale(${scale})`;
  previewBox.style.height = `${previewStage.offsetHeight * scale}px`;
}

async function populateVisitorDropdown() {
  console.log("Populating visitor dropdown...");
  if (!configIsSet || !supabase || !visitorSelect) { 
    console.log("Supabase not configured or visitorSelect not found.");
    return; 
  }
  const { data, error } = await supabase  
    .from(tableName)
    .select("id, visitor_name, image_url, updated_at, template_id, visit_date")
    .order("updated_at", { ascending: false })
  ;
  console.log("Fetched visitors:", data, "Error:", error);
  if (error) {
    showNotice(uploadMessage, "error", error.message || "Besucherliste konnte nicht geladen werden.");
    return;
  }

  visitorsCache = data || [];

  const placeholderOption = visitorSelect.querySelector('option[value=""]');
  visitorSelect.innerHTML = "";
  if (placeholderOption) {
    visitorSelect.appendChild(placeholderOption);
  } else {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Neuen Benutzer";
    visitorSelect.appendChild(opt);
  }

  visitorsCache.forEach(visitor => {
    const option = document.createElement("option");
    option.value = String(visitor.id);
    option.textContent = visitor.visitor_name;
    visitorSelect.appendChild(option);
  });

  if (selectedVisitorId && visitorsCache.some(v => String(v.id) === String(selectedVisitorId))) {
    visitorSelect.value = String(selectedVisitorId);
  }
}

function loadVisitorIntoForm(id) {
  if (!id) {
    selectedVisitorId = null;
    clearSelectedFile();
    uploadedPublicUrl = "";
    if (visitorNameInput) visitorNameInput.value = "";
    renderPreview();
    return;
  }

  const record = visitorsCache.find(v => String(v.id) === String(id));
  if (!record) {
    showNotice(uploadMessage, "error", "Besucher nicht gefunden.");
    return;
  }

  selectedVisitorId = record.id;
  clearSelectedFile();
  uploadedPublicUrl = record.image_url || "";
  selectedName = record.visitor_name;
  selectedTemplateId = record.template_id || null;
  if (visitorNameInput) visitorNameInput.value = record.visitor_name || "";
  renderPreview();
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  authMessage.className = "inline-message";

  if (!configIsSet || !supabase) {
    showMessage(authMessage, "error", "Supabase ist noch nicht konfiguriert. Bitte ergänze in config.js die Projekt-URL und den anon-Key.");
    return;
  }

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!email || !password) {
    showMessage(authMessage, "error", "Bitte füllen Sie E-Mail und Passwort aus.");
    return;
  }

  if (authMode === "signup" && password !== confirmPassword) {
    showMessage(authMessage, "error", "Die Passwörter stimmen nicht überein.");
    return;
  }

  submitAuthBtn.disabled = true;
  submitAuthBtn.textContent = authMode === "login" ? "Anmeldung..." : "Erstelle Konto...";

  try {
    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      showMessage(authMessage, "success", "Konto erstellt. Bitte prüfe deine E-Mails für die Bestätigung.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showAdminScreen();
      await populateVisitorDropdown();
      showMessage(authMessage, "success", "Erfolgreich angemeldet.");
    }
  } catch (error) {
    showMessage(authMessage, "error", error.message || "Authentifizierung fehlgeschlagen.");
  } finally {
    submitAuthBtn.disabled = false;
    submitAuthBtn.textContent = authMode === "login" ? "Anmelden" : "Konto erstellen";
  }
}

async function handleResetPassword(event) {
  event.preventDefault();

  if (!configIsSet || !supabase) {
    showMessage(authMessage, "error", "Supabase ist noch nicht konfiguriert. Bitte ergänze die Zugangsdaten in config.js.");
    return;
  }

  const email = document.getElementById("email").value.trim();

  if (!email) {
    showMessage(authMessage, "error", "Bitte geben Sie zuerst Ihre E-Mail ein.");
    return;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/admin.html"
    });
    if (error) throw error;
    showMessage(authMessage, "success", "Link zum Zurücksetzen des Passworts wurde gesendet.");
  } catch (error) {
    showMessage(authMessage, "error", error.message || "Passwort-Reset fehlgeschlagen.");
  }
}

async function handleVisitorSave(event) {
  event.preventDefault();

  if (!configIsSet || !supabase) {
    showNotice(uploadMessage, "error", "Supabase ist noch nicht konfiguriert. Bitte ergänze die Zugangsdaten in config.js.");
    return;
  }

  const visitorName = getVisitorTextValue();
  if (!visitorName) {
    showNotice(uploadMessage, "error", "Bitte geben Sie einen Begrüßungstext ein.");
    return;
  }

  if (!selectedVisitorId && !selectedFile) {
    showNotice(uploadMessage, "error", "Bitte wählen Sie eine Bilddatei aus.");
    return;
  }

  if (selectedFile) {
    const fileCheck = validateFile(selectedFile);
    if (!fileCheck.valid) {
      showNotice(uploadMessage, "error", fileCheck.message);
      return;
    }
  }

  try {
    if (selectedFile) {
      showNotice(uploadMessage, "success", "Datei wird nach Supabase hochgeladen...");

      const fileExt = selectedFile.name.split(".").pop();
      const safeFileName = `${Date.now()}-${visitorName.replace(/[^a-zA-Z0-9-_]/g, "-")}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(safeFileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type || "image/png"
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
      uploadedPublicUrl = publicData.publicUrl;
    }

    const payload = {
      visitor_name: visitorName, 
      image_url: uploadedPublicUrl,
      template_id: null,
    };

    let dbError;
    if (selectedVisitorId) {
      ({ error: dbError } = await supabase.from(tableName).update(payload).eq("id", selectedVisitorId));
    } else {
      const { data: inserted, error } = await supabase.from(tableName).insert([payload]).select("id").single();
      dbError = error;
      if (!error && inserted) selectedVisitorId = inserted.id;
    }

    if (dbError) throw dbError;

    showNotice(uploadMessage, "success", "Besucher und Bild wurden erfolgreich gespeichert.");
    window.visitorName = visitorName;
    window.visitorImageUrl = uploadedPublicUrl;
    clearSelectedFile();
    renderPreview();
    await populateVisitorDropdown();
  } catch (error) {
    showNotice(uploadMessage, "error", error.message || "Upload fehlgeschlagen.");
  }
}

function onFileSelected(file) {
  const result = validateFile(file);
  if (!result.valid) {
    showNotice(uploadMessage, "error", result.message);
    return;
  }

  if (selectedFilePreviewUrl) URL.revokeObjectURL(selectedFilePreviewUrl);
  selectedFile = file;
  selectedFilePreviewUrl = URL.createObjectURL(file);
  showNotice(uploadMessage, "success", "Datei akzeptiert: " + file.name);
  renderPreview();
}

uploadDropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) onFileSelected(file);
});

["dragenter", "dragover"].forEach(eventName => {
  uploadDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadDropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(eventName => {
  uploadDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadDropZone.classList.remove("dragover");
  });
});

uploadDropZone.addEventListener("drop", (event) => {
  const data = event.dataTransfer?.files?.[0];
  if (data) onFileSelected(data);
});

if (visitorSelect) {
  visitorSelect.addEventListener("change", (event) => {
    loadVisitorIntoForm(event.target.value || null);
  });
}

previewButton.addEventListener("click", () => {
  renderPreview();
  showNotice(uploadMessage, "success", "Vorschau aktualisiert.");
});

if (visitorNameInput) visitorNameInput.addEventListener("input", renderPreview);

new ResizeObserver(fitPreviewStage).observe(previewBox); // Kartenbreite
new ResizeObserver(fitPreviewStage).observe(previewStage); // Bühnenhöhe (Textumbruch)
renderPreview();

authTabs.forEach(tab => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.mode));
});

toggleModeLink.addEventListener("click", (event) => {
  event.preventDefault();
  setAuthMode(authMode === "login" ? "signup" : "login");
});

resetPasswordLink.addEventListener("click", handleResetPassword);

authForm.addEventListener("submit", handleAuthSubmit);
visitorForm.addEventListener("submit", handleVisitorSave);
logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showAuthScreen();
  showMessage(authMessage, "success", "Erfolgreich abgemeldet.");
});

setAuthMode("login");
showAuthScreen();

async function restoreSession() {
  if (!configIsSet || !supabase) {
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session) {
    showAdminScreen();
    await populateVisitorDropdown();
  }
}

restoreSession();
