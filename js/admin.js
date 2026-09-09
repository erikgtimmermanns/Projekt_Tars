const supabaseUrl = config.url || "https://lybzifzwgvttyhwqpaig.supabase.co";
const supabaseKey = config.anonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YnppZnp3Z3Z0dHlod3FwYWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTMwNDcsImV4cCI6MjEwNDUyOTA0N30.LaRdl7zXgNX_GE3jOMfZ085tGcdFNFxpDIuhbLfoqgk";
const bucketName = config.bucketName || "visitor-assets";
const tableName = config.tableName || "visitor_profiles";

const configIsSet = Boolean(supabaseUrl && supabaseKey) && !supabaseUrl.includes("YOUR-") && !supabaseKey.includes("YOUR-");
const supabase = window.supabaseClient || null;

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
const visitorNameInput = document.getElementById("visitorName");

let authMode = "login";
let selectedFile = null;
let uploadedPublicUrl = "";

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

function renderPreview(url, fileName) {
  if (!url) {
    previewBox.classList.add("empty");
    previewBox.innerHTML = "Noch keine Vorschau vorhanden";
    return;
  }

  previewBox.classList.remove("empty");
  previewBox.innerHTML = `<img src="${url}" alt="${fileName || "Visitor Preview"}">`;
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

  const visitorName = visitorNameInput.value.trim();
  if (!visitorName) {
    showNotice(uploadMessage, "error", "Bitte geben Sie einen Namen ein.");
    return;
  }

  if (!selectedFile) {
    showNotice(uploadMessage, "error", "Bitte wählen Sie eine Bilddatei aus.");
    return;
  }

  const fileCheck = validateFile(selectedFile);
  if (!fileCheck.valid) {
    showNotice(uploadMessage, "error", fileCheck.message);
    return;
  }

  try {
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

    const { error: dbError } = await supabase.from(tableName).upsert([
      {
        id: 1,
        visitor_name: visitorName,
        image_url: uploadedPublicUrl,
        updated_at: new Date().toISOString()
      }
    ]);

    if (dbError) throw dbError;

    showNotice(uploadMessage, "success", "Besucher und Bild wurden erfolgreich gespeichert.");
    window.visitorName = visitorName;
    window.visitorImageUrl = uploadedPublicUrl;
    renderPreview(uploadedPublicUrl, selectedFile.name);
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

  selectedFile = file;
  showNotice(uploadMessage, "success", "Datei akzeptiert: " + file.name);

  const previewUrl = URL.createObjectURL(file);
  renderPreview(previewUrl, file.name);
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

previewButton.addEventListener("click", () => {
  const name = visitorNameInput.value.trim();
  if (!selectedFile) {
    showNotice(uploadMessage, "error", "Bitte wählen Sie zuerst eine Datei aus.");
    return;
  }

  if (!name) {
    showNotice(uploadMessage, "error", "Bitte geben Sie zuerst den Namen des Besuchers ein.");
    return;
  }

  renderPreview(URL.createObjectURL(selectedFile), selectedFile.name);
  showNotice(uploadMessage, "success", "Vorschau aktualisiert.");
});

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
  }
}

restoreSession();
