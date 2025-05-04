let isDragging = false;

let draggedRow = null;
let draggedMemoRow = null;

function onDragStart(event) {
  draggedRow = event.target;
  draggedRow.classList.add("dragging");

  // 메모 row 찾기
  draggedMemoRow = draggedRow.nextElementSibling;
  if (!draggedMemoRow?.classList.contains("memo-row")) {
    draggedMemoRow = null;
  }

  event.dataTransfer.effectAllowed = "move";

  // 🔥 드래그 시작과 동시에 메모 row를 본체 바로 아래로 재정렬
  if (draggedMemoRow) {
    draggedRow.parentNode.insertBefore(draggedMemoRow, draggedRow.nextSibling);
  }
}

function onDragEnd() {
  if (draggedRow) draggedRow.classList.remove("dragging");

  draggedRow = null;
  draggedMemoRow = null;
}

function onDragOver(event) {
  event.preventDefault();
  const targetRow = event.target.closest("tr");

  // 메모 row이면 무시
  if (targetRow?.classList.contains("memo-row") || targetRow === draggedRow)
    return;

  targetRow.classList.add("drag-over");
}

function onDrop(event) {
  event.preventDefault();
  const targetRow = event.target.closest("tr");

  // Ignore if the target row is a memo row or the same as the dragged row
  if (
    !targetRow ||
    targetRow.classList.contains("memo-row") ||
    targetRow === draggedRow
  )
    return;

  const rows = Array.from(document.querySelectorAll("#sortable tr")).filter(
    (row) => !row.classList.contains("memo-row")
  ); // Exclude memo rows for proper reordering

  const draggedIndex = rows.indexOf(draggedRow);
  const targetIndex = rows.indexOf(targetRow);

  if (draggedIndex < targetIndex) {
    // Move the dragged row after the target row
    targetRow.parentNode.insertBefore(draggedRow, targetRow.nextSibling);
    if (draggedMemoRow) {
      // Insert the memo row after the dragged row
      targetRow.parentNode.insertBefore(draggedMemoRow, draggedRow.nextSibling);
    }
  } else {
    // Move the dragged row before the target row
    targetRow.parentNode.insertBefore(draggedRow, targetRow);
    if (draggedMemoRow) {
      // Insert the memo row after the dragged row
      targetRow.parentNode.insertBefore(draggedMemoRow, draggedRow.nextSibling);
    }
  }

  // Update the row order after moving
  updateRowOrder();

  // Remove the "drag-over" class
  targetRow.classList.remove("drag-over");
}

function updateRowOrder() {
  const rows = Array.from(document.querySelectorAll("#sortable tr"));
  const updates = rows.map((row, index) => ({
    id: row.getAttribute("data-id"),
    orderIndex: index,
  }));

  const xhr = createXHR();
  xhr.open("POST", "/reorder", true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify(updates));
}

function setRowDraggable(row) {
  if (row.classList.contains("memo-row")) return;

  row.setAttribute("draggable", true);
  row.addEventListener("dragstart", onDragStart);
  row.addEventListener("dragend", onDragEnd);
  row.addEventListener("dragover", onDragOver);
  row.addEventListener("drop", onDrop);
}

function initializeDraggableRows() {
  document.querySelectorAll("#sortable tr").forEach(setRowDraggable);
}

function createXHR() {
  return window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");
}

function makePastelHTML(initials) {
  if (!initials || initials.length === 0) return "";
  return initials
    .map((item) => {
      const [idx, symbol] = item.split("_");
      return `<div class="pastel pastel${idx}">${symbol}</div>`;
    })
    .join("");
}
function updatePatientTable(patients) {
  const tableBody = document.getElementById("sortable");
  const activePatients = document.getElementById("activePatients");
  tableBody.innerHTML = "";
  activePatients.innerHTML = "";

  if (patients.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='5'>진료 예정인 환자가 없습니다.</td></tr>";
    return;
  }

  patients.forEach((patient) => {
    const initials = patient.initial ? patient.initial.split(", ") : [];
    const row = document.createElement("tr");
    row.setAttribute("data-id", patient.id);
    if (patient.inTreatment && patient.roomNumber == 1) {
      row.style.backgroundColor = "seashell";
    }
    let html = `
            <td>${patient.chartNumber}</td>
            <td>${patient.name}</td>
            <td><div class="pastel-wrapper">${makePastelHTML(
              initials
            )}</div></td>
          `;

    if (patient.inTreatment) {
      row.setAttribute("draggable", "true");
      html += `
              <td><div id="roomNumber">${patient.roomNumber}</div></td>
              <td>
                <div class="button_box">
                  <form action="/cancle" method="POST">
                    <input type="hidden" name="id" value="${patient.id}" />
                    <button type="submit" id="cancle">해제</button>
                  </form>
                  <form action="/complete" method="POST">
                    <input type="hidden" name="id" value="${patient.id}" />
                    <button type="submit" id="complete">완료</button>
                  </form>
                </div>
              </td>
            `;
      row.innerHTML = html;
      activePatients.appendChild(row);
    } else {
      html += `
              <td>
                <div class="button_box">
                  <form action="/treatment" method="post">
                    <input type="hidden" name="id" value="${patient.id}" />
                    <input type="hidden" name="roomNumber" value="1" />
                    <button type="submit" id="roomNumberSelect" >1</button>
                  </form>
                  <form action="/treatment" method="post">
                    <input type="hidden" name="id" value="${patient.id}" />
                    <input type="hidden" name="roomNumber" value="2" />
                    <button type="submit" id="roomNumberSelect">2</button>
                  </form>
                </div>
              </td>
              <td>
                <form action="/waitlist" method="post">
                  <input type="hidden" name="id" value="${patient.id}" />
                  <button type="submit">보류</button>
                </form>
              </td>
            `;
      row.innerHTML = html;
      tableBody.appendChild(row);
    }

    if (patient.memo && patient.memo.length > 0) {
      const memoRow = document.createElement("tr");
      memoRow.classList.add("memo-row");
      memoRow.innerHTML = `<td></td><td>↳</td><td colspan="3">${patient.memo}</td>`;
      (patient.inTreatment ? activePatients : tableBody).appendChild(memoRow);
    }
  });

  initializeDraggableRows();
}

function fetchPatients() {
  if (isDragging) return; // 드래그 중이면 UI 갱신하지 않음

  const xhr = createXHR();
  xhr.open("GET", "/api/patients?" + new Date().getTime(), true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        const patients = JSON.parse(xhr.responseText);
        updatePatientTable(patients);
      } catch (e) {
        console.error("Invalid JSON:", xhr.responseText);
      }
    }
  };
  xhr.send();
}

function toggleRoomButton() {
  const input = document.querySelector(".patient_input");
  const radios = document.getElementsByName("room");
  const stored = localStorage.getItem("room");
  if (stored) {
    document.querySelector(
      `input[name="room"][value="${stored}"]`
    ).checked = true;
    input.style.display = stored === "dr" ? "none" : "block";
  }

  Array.from(radios).forEach((rb) => {
    rb.addEventListener("change", () => {
      localStorage.setItem("room", rb.value);
      input.style.display = rb.value === "dr" ? "none" : "block";
    });
  });
}

function initialsHTML() {
  const options = ["★", "🅚", "🅒", "E", "D", "P", "R", "↗", "✚", "외출"];
  const wrapper = document.querySelector(".pastel-wrapper");
  if (!wrapper) return;
  options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = `pastel pastel${i}`;
    div.innerHTML = `<label><input type="checkbox" name="initial" value="${i}_${opt}" /> ${opt}</label>`;
    wrapper.appendChild(div);
  });
}

function fetchWaitlist() {
  const xhr = createXHR();
  xhr.open("GET", "/api/waitlist?" + new Date().getTime(), true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        const waitlist = JSON.parse(xhr.responseText);
        updateWaitlistTable(waitlist);
      } catch (e) {
        console.error("Invalid JSON in waitlist:", xhr.responseText);
      }
    }
  };
  xhr.send();
}

function updateWaitlistTable(waitlist) {
  const tableBody = document.getElementById("waitlistTableBody");
  tableBody.innerHTML = "";

  if (waitlist.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='5'>보류자가 없습니다.</td></tr>";
    return;
  }

  waitlist.forEach((patient) => {
    const initials = patient.initial ? patient.initial.split(", ") : [];
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${patient.chartNumber}</td>
      <td>${patient.name}</td>
      <td><div class="pastel-wrapper">${makePastelHTML(initials)}</div></td>
      <td>${patient.memo}</td>
      <td>
        <form action="/upload" method="post">
          <input type="hidden" name="id" value="${patient.id}" />
          <button type="submit">복귀</button>
        </form>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initialsHTML();
  toggleRoomButton();
  fetchPatients();
  fetchWaitlist(); // ← 여기 추가
  setInterval(fetchPatients, 5000);
  setInterval(fetchWaitlist, 5000); // ← 자동 갱신도 원할 경우
  document
    .getElementById("waitlist_button")
    .addEventListener("click", function () {
      const section = document.getElementById("waitlistSection");
      section.style.display =
        section.style.display === "none" || section.style.display === ""
          ? "block"
          : "none";
    });
});
