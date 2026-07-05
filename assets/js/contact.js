// ============================================================
// ONYX PC STUDIO — contact.js
// Writes contact/enquiry form submissions to a Firestore collection
// so the admin panel (or Firebase console) can review them.
// ============================================================

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    formStatus.textContent = "Sending…";

    const data = new FormData(contactForm);
    const entry = {
      name: data.get("name").trim(),
      phone: data.get("phone").trim(),
      interest: data.get("interest"),
      message: data.get("message").trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: "new"
    };

    try {
      await db.collection("enquiries").add(entry);
      formStatus.textContent = "Thanks — we'll get back to you shortly.";
      contactForm.reset();
    } catch (err) {
      console.error("Enquiry submission failed:", err);
      formStatus.textContent = "Something went wrong. Please call or WhatsApp us instead.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
