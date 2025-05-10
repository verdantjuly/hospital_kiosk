// Polyfill for JSON in IE8
if (!window.JSON) {
  window.JSON = {
    parse: function (s) {
      return eval("(" + s + ")");
    },
    stringify: function (v) {
      var json = [];
      for (var i in v) {
        if (v.hasOwnProperty(i)) {
          json.push('"' + i + '":"' + v[i] + '"');
        }
      }
      return "{" + json.join(",") + "}";
    },
  };
}

// Polyfill for classList
if (!("classList" in document.documentElement)) {
  (function (view) {
    if (!("classList" in document.documentElement)) {
      Object.defineProperty(Element.prototype, "classList", {
        get: function () {
          var className = this.className;
          var classes = className.split(/\s+/);
          var self = this;

          return {
            add: function (className) {
              if (!self.hasClass(className)) {
                self.className += " " + className;
              }
            },
            remove: function (className) {
              if (self.hasClass(className)) {
                self.className = self.className
                  .replace(className, "")
                  .replace(/\s+/g, " ")
                  .trim();
              }
            },
            contains: function (className) {
              return new RegExp("(^|\\s)" + className + "(\\s|$)").test(
                self.className
              );
            },
          };
        },
      });
    }
  })(window);
}

// Polyfill for addEventListener and removeEventListener
if (!window.addEventListener) {
  window.addEventListener = function (type, listener) {
    return this.attachEvent("on" + type, listener);
  };
  window.removeEventListener = function (type, listener) {
    return this.detachEvent("on" + type, listener);
  };
}

// Cross-browser event listener setup
function addEventListenerCompat(element, event, handler) {
  if (element.addEventListener) {
    element.addEventListener(event, handler, false);
  } else if (element.attachEvent) {
    element.attachEvent("on" + event, handler);
  }
}

function removeEventListenerCompat(element, event, handler) {
  if (element.removeEventListener) {
    element.removeEventListener(event, handler, false);
  } else if (element.detachEvent) {
    element.detachEvent("on" + event, handler);
  }
}

function closestPolyfill(element, selector) {
  // Polyfill for IE8 to replace closest()
  while (element) {
    if (element.matches(selector)) {
      return element;
    }
    element = element.parentNode;
  }
  return null;
}
let isDragging = false;
let draggedRow = null;
let draggedMemoRow = null;

function onDragStart(event) {
  draggedRow = event.target;
  draggedRow.className += " dragging"; // Using className for IE8 compatibility

  // Find memo row
  draggedMemoRow = draggedRow.nextElementSibling;
  if (draggedMemoRow && !draggedMemoRow.className.match("memo-row")) {
    draggedMemoRow = null;
  }

  event.dataTransfer.effectAllowed = "move";

  // Re-arrange memo row immediately below dragged row
  if (draggedMemoRow) {
    draggedRow.parentNode.insertBefore(draggedMemoRow, draggedRow.nextSibling);
  }
}

function onDragEnd() {
  if (draggedRow)
    draggedRow.className = draggedRow.className.replace(" dragging", ""); // Remove dragging class

  draggedRow = null;
  draggedMemoRow = null;
}

function onDragOver(event) {
  event.preventDefault();
  const targetRow = event.target.closest("tr");

  if (
    (targetRow && targetRow.className.match("memo-row")) ||
    targetRow === draggedRow
  )
    return;

  targetRow.className += " drag-over"; // Using className for IE8 compatibility
}

function onDrop(event) {
  event.preventDefault();
  const targetRow = event.target.closest("tr");

  if (
    !targetRow ||
    targetRow.className.match("memo-row") ||
    targetRow === draggedRow
  )
    return;

  const rows = Array.prototype.slice
    .call(document.querySelectorAll("#sortable tr"))
    .filter(function (row) {
      return !row.className.match("memo-row");
    });

  const draggedIndex = rows.indexOf(draggedRow);
  const targetIndex = rows.indexOf(targetRow);

  if (draggedIndex < targetIndex) {
    targetRow.parentNode.insertBefore(draggedRow, targetRow.nextSibling);
    if (draggedMemoRow) {
      targetRow.parentNode.insertBefore(draggedMemoRow, draggedRow.nextSibling);
    }
  } else {
    targetRow.parentNode.insertBefore(draggedRow, targetRow);
    if (draggedMemoRow) {
      targetRow.parentNode.insertBefore(draggedMemoRow, draggedRow.nextSibling);
    }
  }

  updateRowOrder();
  targetRow.className = targetRow.className.replace(" drag-over", ""); // Remove drag-over class
}
function updateRowOrder() {
  const rows = Array.prototype.slice.call(
    document.querySelectorAll("#sortable tr")
  );
  const updates = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    updates.push({ id: row.getAttribute("data-id"), orderIndex: i });
  }

  const xhr = createXHR();
  xhr.open("POST", "/reorder", true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify(updates));
}

// Creating a compatible XHR object for IE8
function createXHR() {
  return window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");
}

function initializeDraggableRows() {
  var rows = document.querySelectorAll("#sortable tr");
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];

    if (row.className.match("memo-row")) continue;

    row.setAttribute("draggable", true);
    row.attachEvent("ondragstart", onDragStart);
    row.attachEvent("ondragend", onDragEnd);
    row.attachEvent("ondragover", onDragOver);
    row.attachEvent("ondrop", onDrop);
  }
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
  var rows = document.querySelectorAll("#sortable tr");

  for (var i = 0; i < rows.length; i++) {
    setRowDraggable(rows[i]);
  }
}

function createXHR() {
  return window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");
}

function makePastelHTML(initials) {
  if (!initials || initials.length === 0) return "";

  var html = "";
  for (var i = 0; i < initials.length; i++) {
    var item = initials[i];
    var parts = item.split("_");
    var idx = parts[0];
    var symbol = parts[1];
    html += '<div class="pastel pastel' + idx + '">' + symbol + "</div>";
  }

  return html;
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
  for (var i = 0; i < patients.length; i++) {
    var patient = patients[i];
    var initials = patient.initial ? patient.initial.split(", ") : [];
    var row = document.createElement("tr");
    row.setAttribute("data-id", patient.id);

    if (patient.inTreatment && patient.roomNumber == 1) {
      row.style.backgroundColor = "seashell";
    }

    var html =
      "<td>" +
      patient.chartNumber +
      "</td>" +
      "<td>" +
      patient.name +
      "</td>" +
      "<td><div>" +
      makePastelHTML(initials) +
      "</div></td>";

    if (patient.inTreatment) {
      row.setAttribute("draggable", "true");
      html +=
        '<td><div id="roomNumber">' +
        patient.roomNumber +
        "</div></td>" +
        "<td>" +
        '<div class="button_box">' +
        '<form action="/cancle" method="POST">' +
        '<input type="hidden" name="id" value="' +
        patient.id +
        '" />' +
        '<button type="submit" id="cancle">⬇</button>' +
        "</form>" +
        '<form action="/complete" method="POST">' +
        '<input type="hidden" name="id" value="' +
        patient.id +
        '" />' +
        '<button type="submit" id="complete">✔</button>' +
        "</form>" +
        "</div>" +
        "</td>";
      row.innerHTML = html;
      activePatients.appendChild(row);
    } else {
      html +=
        "<td>" +
        '<div class="button_box">' +
        '<form action="/treatment" method="post">' +
        '<input type="hidden" name="id" value="' +
        patient.id +
        '" />' +
        '<input type="hidden" name="roomNumber" value="1" />' +
        '<button type="submit" id="roomNumberSelect">1</button>' +
        "</form>" +
        '<form action="/treatment" method="post">' +
        '<input type="hidden" name="id" value="' +
        patient.id +
        '" />' +
        '<input type="hidden" name="roomNumber" value="2" />' +
        '<button type="submit" id="roomNumberSelect">2</button>' +
        "</form>" +
        "</div>" +
        "</td>" +
        "<td>" +
        '<form action="/waitlist" method="post">' +
        '<input type="hidden" name="id" value="' +
        patient.id +
        '" />' +
        '<button type="submit">♺</button>' +
        "</form>" +
        "</td>";
      row.innerHTML = html;
      tableBody.appendChild(row);
    }

    if (patient.memo && patient.memo.length > 0) {
      var memoRow = document.createElement("tr");
      if (patient.inTreatment && patient.roomNumber == 1) {
        memoRow.style.backgroundColor = "seashell";
      }
      memoRow.classList.add("memo-row");
      memoRow.innerHTML = '<td colspan="5"> ➥ ' + patient.memo + "</td>";
      (patient.inTreatment ? activePatients : tableBody).appendChild(memoRow);
    }
  }

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

var radios = document.getElementsByName("room");
var input = document.querySelector(".patient_input");
var stored = localStorage.getItem("room");

if (stored) {
  document.querySelector(
    'input[name="room"][value="' + stored + '"]'
  ).checked = true;

  input.style.display = stored === "dr" ? "none" : "block";
}

for (var i = 0; i < radios.length; i++) {
  (function (rb) {
    rb.addEventListener("change", function () {
      localStorage.setItem("room", rb.value);
      input.style.display = rb.value === "dr" ? "none" : "block";
    });
  })(radios[i]);
}

function initialsHTML() {
  const options = ["★", "🅚", "🅒", "E", "D", "P", "R", "↗", "✚", "외출"];
  const wrapper = document.querySelector(".pastel-wrapper");
  if (!wrapper) return;
  for (var i = 0; i < options.length; i++) {
    var title = document.createElement("div");
    title.className = "initial_title";
    if (i == 0) {
      title.innerText = "원장님";
      wrapper.appendChild(title);
    } else if (i == 3) {
      title.innerText = "상태";
      wrapper.appendChild(title);
    } else if (i == 7) {
      title.innerText = "기타";
      wrapper.appendChild(title);
    }

    var opt = options[i];
    var div = document.createElement("div");
    div.className = "pastel pastel" + i;
    div.innerHTML =
      "<label><input type='checkbox' name='initial' value='" +
      i +
      "_" +
      opt +
      "' /> " +
      opt +
      "</label>";

    wrapper.appendChild(div);
  }
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

  for (var i = 0; i < waitlist.length; i++) {
    var patient = waitlist[i];
    var initials = patient.initial ? patient.initial.split(", ") : [];
    var row = document.createElement("tr");

    var html =
      "<td>" +
      patient.chartNumber +
      "</td>" +
      "<td>" +
      patient.name +
      "</td>" +
      "<td><div class='pastel-wrapper'>" +
      makePastelHTML(initials) +
      "</div></td>" +
      "<td>" +
      patient.memo +
      "</td>" +
      "<td>" +
      "<form action='/upload' method='post'>" +
      "<input type='hidden' name='id' value='" +
      patient.id +
      "' />" +
      "<button type='submit'>⬆</button>" +
      "</form>" +
      "</td>";

    row.innerHTML = html;
    tableBody.appendChild(row);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initializeDraggableRows();
  initialsHTML();
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
