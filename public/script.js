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

// Creating a compatible XHR object for IE8
function createXHR() {
  return window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");
}

var initialMap = {}; // 이니셜 ID → { symbol, color }

function loadInitialsMap(callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/initials", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        initialMap = {}; // 초기화
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          initialMap[item.id] = item;
        }
        if (callback) callback();
      } catch (e) {
        console.error("이니셜 로딩 오류:", e);
      }
    }
  };
  xhr.send();
}
function initialSymbolHTML(initials) {
  if (!initials || initials.length === 0) return "";

  var html = "";
  for (var i = 0; i < initials.length; i++) {
    var item = initials[i];
    var id = typeof item === "string" ? item : item.id;

    var data = initialMap[id];
    var symbol = data ? data.symbol : item.symbol || "？";
    var color = data ? data.color : item.color || "#ccc";

    html +=
      '<div class="pastel" style="background-color:' +
      color +
      ';">' +
      symbol +
      "</div>";
  }

  return html;
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

function updatePatientTable(patients) {
  const tableBody = document.getElementById("sortable");
  const activePatients = document.getElementById("activePatients");
  tableBody.innerHTML = "";
  activePatients.innerHTML = "";

  if (patients.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='6'>진료 예정인 환자가 없습니다.</td></tr>";
    return;
  }

  for (var i = 0; i < patients.length; i++) {
    var patient = patients[i];
    var initials = patient.initial;
    var row = document.createElement("tr");
    row.setAttribute("data-id", patient.id);

    if (patient.inTreatment && patient.roomNumber == 1) {
      row.style.backgroundColor = "seashell";
    }

    var html =
      "<td>" +
      "<div class = 'order_box'>" +
      '<button id="order_button" type="button" onclick="moveRowUp(this)">▲</button>' +
      '<button id="order_button" type="button" onclick="moveRowDown(this)">▼</button>' +
      "</div>" +
      "</td>" +
      "<td>" +
      patient.chartNumber.slice(0, 6) +
      '<span id="chart_number">' +
      patient.chartNumber.slice(6) +
      "</span>" +
      "</td>" +
      "<td>" +
      patient.name +
      "</td>" +
      "<td><div>" +
      initialSymbolHTML(initials) +
      (patient.memo
        ? "<div class='pastel' id= 'memo'>" + patient.memo + "</div>"
        : "") +
      "</div></td>";

    if (patient.inTreatment) {
      html =
        "<td>" +
        patient.chartNumber.slice(0, 6) +
        '<span id="chart_number">' +
        patient.chartNumber.slice(6) +
        "</td>" +
        "<td>" +
        patient.name +
        "</td>" +
        "<td><div>" +
        initialSymbolHTML(initials) +
        (patient.memo
          ? "<div class='pastel' id= 'memo'>" + patient.memo + "</div>"
          : "") +
        "</div></td>" +
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
  }
}

function fetchPatients() {
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
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/initials", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var wrapper = document.querySelector(".pastel-wrapper");
      if (!wrapper) return;
      wrapper.innerHTML = "";

      var data;
      try {
        data = eval("(" + xhr.responseText + ")");
      } catch (e) {
        alert("이니셜 JSON 파싱 실패");
        return;
      }

      // 카테고리별 그룹
      var categories = {
        원장님: [],
        상태: [],
        기타: [],
      };

      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        if (categories[item.category]) {
          categories[item.category].push(item);
        } else {
          categories["기타"].push(item); // fallback
        }
      }

      for (var key in categories) {
        // 카테고리 제목
        var title = document.createElement("div");
        title.className = "initial_title";
        title.innerText = key;
        wrapper.appendChild(title);

        var list = categories[key];
        for (var j = 0; j < list.length; j++) {
          var item = list[j];
          var div = document.createElement("div");
          div.className = "pastel";
          div.style.backgroundColor = item.color || "#ccc";

          div.innerHTML =
            "<label><input type='checkbox' name='initial' value='" +
            item.id +
            "' /> " +
            item.symbol +
            "</label>";

          wrapper.appendChild(div);
        }
      }
    }
  };
  xhr.send();
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
    var initial = patient.initial;
    var row = document.createElement("tr");

    var html =
      "<td>" +
      patient.chartNumber.slice(0, 6) +
      '<span id="chart_number">' +
      patient.chartNumber.slice(6) +
      "</span>" +
      "</td>" +
      "<td>" +
      patient.name +
      "</td>" +
      "<td><div class='pastel-wrapper2'>" +
      initialSymbolHTML(initial) +
      (patient.memo
        ? "<div class='pastel' id= 'memo'>" + patient.memo + "</div>"
        : "") +
      "</div></td>" +
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
  loadInitialsMap();
  initialsHTML();
  fetchPatients();
  fetchWaitlist();
  setInterval(fetchPatients, 500);
  setInterval(fetchWaitlist, 500);
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

function moveRowUp(button) {
  var row = getParentRow(button);
  if (!row) return;

  // 이전 형제 요소를 찾아서
  var prev = row.previousElementSibling;
  while (prev && prev.nodeType !== 1) prev = prev.previousElementSibling;

  // 이전 형제가 존재하면, row를 그 위로 이동
  if (prev) {
    row.parentNode.insertBefore(row, prev);
    updateRowOrder();
  }
}

function moveRowDown(button) {
  var row = getParentRow(button);
  if (!row) return;

  // 다음 형제 요소를 찾아서
  var next = row.nextElementSibling;
  while (next && next.nodeType !== 1) next = next.nextElementSibling;

  // 다음 형제가 존재하면, row를 그 아래로 이동
  if (next) {
    row.parentNode.insertBefore(row, next.nextElementSibling || null);
    updateRowOrder();
  }
}

function getParentRow(elem) {
  while (elem && elem.tagName !== "TR") {
    elem = elem.parentNode;
  }
  return elem;
}

function hasClass(el, cls) {
  return el.className && el.className.indexOf(cls) > -1;
}

function openModal() {
  document.getElementById("initialsModal").style.display = "block";
  document.getElementById("modalOverlay").style.display = "block"; // 배경 표시
  loadInitials();
}

function closeModal() {
  document.getElementById("initialsModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none"; // 배경 숨김
}

function submitInitial() {
  var symbol = document.getElementById("symbol").value;
  var color = document.getElementById("color").value;

  // 선택된 라디오 값 읽기
  var categoryRadios = document.getElementsByName("category");
  var category = "";
  for (var i = 0; i < categoryRadios.length; i++) {
    if (categoryRadios[i].checked) {
      category = categoryRadios[i].value;
      break;
    }
  }

  if (!category) {
    alert("카테고리를 선택해주세요.");
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/initials", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 201) {
      loadInitials();
      document.getElementById("symbol").value = "";
      document.getElementById("color").value = "";
      for (var i = 0; i < categoryRadios.length; i++) {
        categoryRadios[i].checked = false;
      }
    }
  };
  xhr.send(
    "symbol=" +
      encodeURIComponent(symbol) +
      "&color=" +
      encodeURIComponent(color) +
      "&category=" +
      encodeURIComponent(category)
  );
  initialsHTML();
}

function loadInitials() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/initials", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var list = document.getElementById("initialList");
      list.innerHTML = "";

      var data;
      try {
        data = eval("(" + xhr.responseText + ")");
      } catch (e) {
        alert("JSON 파싱 오류");
        return;
      }

      for (var i = 0; i < data.length; i++) {
        (function (item) {
          var div = document.createElement("div");
          div.className = "pastel";
          div.style.backgroundColor = item.color;
          div.style.color = "black";
          div.style.fontWeight = "700";
          div.style.display = "inline-block";
          div.style.margin = "5px";
          div.style.padding = "5px 10px";
          div.style.cursor = "pointer";
          div.title = "삭제하려면 클릭하세요";

          div.innerText = item.symbol;

          // 삭제 기능 연결
          div.onclick = function () {
            if (confirm("진짜 삭제하시겠습니까?")) {
              deleteInitial(item.id);
            }
          };

          list.appendChild(div);
        })(data[i]);
      }
    }
  };
  xhr.send();
}

function deleteInitial(id) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/initials/" + id, true);
  xhr.setRequestHeader("X-HTTP-Method-Override", "DELETE");
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 204) {
      loadInitials();
    }
  };
  xhr.send();
  initialsHTML();
}
