document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmMessage = document.getElementById("confirm-message");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const confirmDeleteBtn = document.getElementById("confirm-delete");

  let pendingDelete = null;

  // Function to fetch activities from API
  async function fetchActivities() {
    activitiesList.innerHTML = `
      <div class="loading-state" aria-live="polite">
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>Loading activities...</span>
      </div>
    `;

    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = details.participants.length
          ? details.participants
              .map(
                (email) => `
                  <li class="participant-row">
                    <span class="participant-email">${email}</span>
                    <button
                      type="button"
                      class="delete-participant-btn"
                      data-activity="${name}"
                      data-email="${email}"
                      aria-label="Remove ${email} from ${name}"
                      title="Remove participant"
                    >
                      ✕
                    </button>
                  </li>
                `
              )
              .join("")
          : "<li class=\"participant-empty\">No participants yet</li>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <span class="participants-label">Participants:</span>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-participant-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const activity = button.dataset.activity;
          const email = button.dataset.email;

          pendingDelete = { activity, email };
          confirmMessage.textContent = `Are you sure you want to delete this participant?\n\n${email} from ${activity}`;
          confirmModal.classList.remove("hidden");
        });
      });

      confirmDeleteBtn.onclick = async () => {
        if (!pendingDelete) {
          return;
        }

        const { activity, email } = pendingDelete;
        confirmModal.classList.add("hidden");

        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
            { method: "DELETE" }
          );

          const result = await response.json();

          if (response.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = "success";
            await fetchActivities();
          } else {
            messageDiv.textContent = result.detail || "Unable to remove participant.";
            messageDiv.className = "error";
          }

          messageDiv.classList.remove("hidden");
          setTimeout(() => {
            messageDiv.classList.add("hidden");
          }, 5000);
        } catch (error) {
          messageDiv.textContent = "Failed to remove participant.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error removing participant:", error);
        } finally {
          pendingDelete = null;
        }
      };

      cancelDeleteBtn.onclick = () => {
        pendingDelete = null;
        confirmModal.classList.add("hidden");
      };

      confirmModal.addEventListener("click", (event) => {
        if (event.target === confirmModal) {
          pendingDelete = null;
          confirmModal.classList.add("hidden");
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
