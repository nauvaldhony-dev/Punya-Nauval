
const form = document.getElementById("scheduleForm");
const scheduleList = document.getElementById("scheduleList");
const notificationBtn = document.getElementById("notificationBtn");

const days = [
    "Minggu", "Senin", "Selasa", "Rabu",
    "Kamis", "Jumat", "Sabtu"
];

// Mengambil jadwal dari LocalStorage
let schedules = JSON.parse(
    localStorage.getItem("jadwalKuliah")
) || [];

// Menyimpan data
function saveData() {
    localStorage.setItem(
        "jadwalKuliah",
        JSON.stringify(schedules)
    );
}

// Menghitung jadwal kuliah berikutnya
function getNextClass(schedule) {
    const now = new Date();
    const target = new Date();

    const difference =
        (Number(schedule.day) - now.getDay() + 7) % 7;

    target.setDate(now.getDate() + difference);

    const [hour, minute] = schedule.time.split(":");

    target.setHours(Number(hour), Number(minute), 0, 0);

    if (target <= now) {
        target.setDate(target.getDate() + 7);
    }

    return target;
}

// Menampilkan jadwal
function displaySchedules() {
    scheduleList.innerHTML = "";

    const sortedSchedules = [...schedules].sort(
        (a, b) => getNextClass(a) - getNextClass(b)
    );

    document.getElementById("totalSchedules").textContent =
        schedules.length;

    const today = new Date().getDay();

    document.getElementById("todaySchedules").textContent =
        schedules.filter(
            item => Number(item.day) === today
        ).length;

    document.getElementById("activeReminders").textContent =
        schedules.length;

    document.getElementById("scheduleCount").textContent =
        schedules.length + " Jadwal";

    if (sortedSchedules.length === 0) {
        scheduleList.innerHTML = `
            <div class="empty-state">
                <div>📚</div>
                <h3>Belum ada jadwal</h3>
                <p>Silakan tambahkan jadwal kuliahmu.</p>
            </div>
        `;
        return;
    }

    sortedSchedules.forEach(schedule => {
        const card = document.createElement("div");
        card.className = "schedule-card";

        const top = document.createElement("div");
        top.className = "schedule-top";

        const titleWrapper = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = schedule.subject;
        titleWrapper.appendChild(title);

        const time = document.createElement("span");
        time.className = "schedule-time";
        time.textContent = schedule.time;

        top.append(titleWrapper, time);

        const details = document.createElement("div");
        details.className = "schedule-details";
        details.textContent =
            "Dosen: " + schedule.lecturer +
            " | Ruangan: " + schedule.room;

        const day = document.createElement("span");
        day.className = "schedule-day";
        day.textContent = days[Number(schedule.day)];

        const actions = document.createElement("div");
        actions.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.className = "edit-btn";
        editButton.textContent = "✏️ Edit";
        editButton.addEventListener("click", () => {
            editSchedule(schedule.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "🗑 Hapus";
        deleteButton.addEventListener("click", () => {
            deleteSchedule(schedule.id);
        });

        actions.append(editButton, deleteButton);
        card.append(top, details, day, actions);

        scheduleList.appendChild(card);
    });
}

// Menambah dan mengedit jadwal
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const editId = document.getElementById("editId").value;

    const reminderInput =
        document.getElementById("reminderMinutes");

    const reminderMinutes = reminderInput
        ? Number(reminderInput.value)
        : 15;

    if (
        !Number.isFinite(reminderMinutes) ||
        reminderMinutes < 0 ||
        reminderMinutes > 10080
    ) {
        alert("Waktu pengingat harus antara 0 sampai 10080 menit.");
        return;
    }

    const schedule = {
        id: editId || Date.now().toString(),
        subject: document.getElementById("subject").value.trim(),
        lecturer: document.getElementById("lecturer").value.trim(),
        room: document.getElementById("room").value.trim(),
        day: document.getElementById("day").value,
        time: document.getElementById("time").value,
        reminderMinutes: reminderMinutes
    };

    if (editId) {
        schedules = schedules.map(item =>
            item.id === editId ? schedule : item
        );
    } else {
        schedules.push(schedule);
    }

    saveData();
    displaySchedules();
    resetForm();

    checkReminders();

    alert(editId
        ? "Jadwal berhasil diperbarui!"
        : "Jadwal berhasil ditambahkan!"
    );
});

// Mengedit jadwal
function editSchedule(id) {
    const schedule = schedules.find(item => item.id === id);

    if (!schedule) return;

    document.getElementById("editId").value = schedule.id;
    document.getElementById("subject").value = schedule.subject;
    document.getElementById("lecturer").value = schedule.lecturer;
    document.getElementById("room").value = schedule.room;
    document.getElementById("day").value = schedule.day;
    document.getElementById("time").value = schedule.time;

    const reminderInput =
        document.getElementById("reminderMinutes");

    if (reminderInput) {
        reminderInput.value = schedule.reminderMinutes ?? 15;
    }

    document.getElementById("formTitle").textContent =
        "Edit Jadwal";

    document.getElementById("submitBtn").textContent =
        "Simpan Perubahan";

    document.getElementById("cancelBtn").hidden = false;

    document.querySelector(".form-section").scrollIntoView({
        behavior: "smooth"
    });
}

// Menghapus jadwal
function deleteSchedule(id) {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;

    schedules = schedules.filter(item => item.id !== id);

    saveData();
    displaySchedules();
}

// Mereset form
function resetForm() {
    form.reset();

    document.getElementById("editId").value = "";

    document.getElementById("formTitle").textContent =
        "Tambah Jadwal";

    document.getElementById("submitBtn").textContent =
        "+ Simpan Jadwal";

    document.getElementById("cancelBtn").hidden = true;

    const reminderInput =
        document.getElementById("reminderMinutes");

    if (reminderInput) {
        reminderInput.value = 15;
    }
}

// Tombol batal edit
document.getElementById("cancelBtn").addEventListener(
    "click",
    resetForm
);

// Mengaktifkan notifikasi
notificationBtn.addEventListener("click", async function() {
    if (!("Notification" in window)) {
        alert("Browser tidak mendukung notifikasi.");
        return;
    }

    try {
        const permission =
            await Notification.requestPermission();

        if (permission === "granted") {
            notificationBtn.textContent =
                "🔔 Notifikasi Aktif";

            alert("Notifikasi berhasil diaktifkan!");

            checkReminders();
        } else {
            alert("Izin notifikasi belum diberikan.");
        }
    } catch (error) {
        alert("Terjadi kesalahan saat mengaktifkan notifikasi.");
        console.error(error);
    }
});

// Mencatat notifikasi yang sudah dikirim
let sentReminders = JSON.parse(
    localStorage.getItem("pengingatTerkirim")
) || {};

// Memeriksa jadwal dan mengirim notifikasi
function checkReminders() {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    const now = new Date();

    schedules.forEach(schedule => {
        const classTime = getNextClass(schedule);

        const reminderMinutes =
            Number(schedule.reminderMinutes ?? 15);

        const reminderTime = new Date(
            classTime.getTime() -
            reminderMinutes * 60 * 1000
        );

        const reminderKey =
            schedule.id + "_" + classTime.getTime();

        if (
            now >= reminderTime &&
            now < classTime &&
            !sentReminders[reminderKey]
        ) {
            const notification = new Notification(
                "Pengingat Kuliah 🎓",
                {
                    body:
                        schedule.subject +
                        " akan dimulai dalam " +
                        reminderMinutes +
                        " menit.\n" +
                        "Ruangan: " + schedule.room
                }
            );

            sentReminders[reminderKey] = true;

            localStorage.setItem(
                "pengingatTerkirim",
                JSON.stringify(sentReminders)
            );
        }
    });
}

// Memeriksa setiap 5 detik
setInterval(checkReminders, 5000);

// Memeriksa saat halaman dibuka kembali
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        checkReminders();
    }
});

// Menampilkan jadwal saat aplikasi dibuka
displaySchedules();
checkReminders();

// Memperbarui status tombol
if (
    "Notification" in window &&
    Notification.permission === "granted"
) {
    notificationBtn.textContent = "🔔 Notifikasi Aktif";
}
