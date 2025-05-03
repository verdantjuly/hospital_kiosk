(function () {
  function ready(fn) {
    if (document.readyState != "loading") {
      fn();
    } else if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      document.attachEvent("onreadystatechange", function () {
        if (document.readyState != "loading") fn();
      });
    }
  }

  ready(function () {
    var initialOptions = ["★", "K", "C", "E", "D", "P", "R", "↗", "✚"];
    var pastelWrapper = document.querySelector(".pastel-wrapper");

    for (var i = 0; i < initialOptions.length; i++) {
      var div = document.createElement("div");
      div.className = "pastel pastel" + i;
      div.innerHTML =
        '<label><input type="checkbox" name="initial" value="' +
        i +
        "_" +
        initialOptions[i] +
        '" /> ' +
        initialOptions[i] +
        "</label>";
      pastelWrapper.appendChild(div);
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/patients", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var patients = JSON.parse(xhr.responseText);
        var tableBody = document.getElementById("sortable");
        var activePatients = document.getElementById("activePatients");

        if (patients.length === 0) {
          tableBody.innerHTML =
            "<tr><td colspan='5'>진료 예정인 환자가 없습니다.</td></tr>";
        } else {
          for (var i = 0; i < patients.length; i++) {
            var patient = patients[i];
            var row = document.createElement("tr");
            row.setAttribute("data-id", patient.id);
            var initials = patient.initial.split(", ");
            var innerHTML = "";

            function makePastelHTML(initials) {
              var html = "";
              for (var j = 0; j < initials.length; j++) {
                if (initials[j].length > 0) {
                  var parts = initials[j].split("_");
                  html +=
                    '<div class="pastel pastel' +
                    parts[0] +
                    '">' +
                    parts[1] +
                    "</div>";
                }
              }
              return html;
            }

            if (patient.inTreatment) {
              innerHTML += "<td>" + patient.chartNumber + "</td>";
              innerHTML += "<td>" + patient.name + "</td>";
              innerHTML +=
                '<td><div class="pastel-wrapper">' +
                makePastelHTML(initials) +
                "</div></td>";
              innerHTML +=
                '<td><div id="roomNumber">' +
                patient.roomNumber +
                "</div></td>";
              innerHTML +=
                '<td><div class="button_box">' +
                '<form action="/cancle" method="POST"><input type="hidden" name="id" value="' +
                patient.id +
                '" /><button type="submit" id="cancle">해제</button></form>' +
                '<form action="/complete" method="POST"><input type="hidden" name="id" value="' +
                patient.id +
                '" /><button type="submit" id="complete">완료</button></form>' +
                "</div></td>";
              row.innerHTML = innerHTML;
              activePatients.appendChild(row);

              if (patient.memo.length > 0) {
                var memoRow = document.createElement("tr");
                memoRow.innerHTML =
                  "<td></td><td>↳</td><td>" +
                  patient.memo +
                  "</td><td></td><td></td>";
                activePatients.appendChild(memoRow);
              }
            } else {
              innerHTML += "<td>" + patient.chartNumber + "</td>";
              innerHTML += "<td>" + patient.name + "</td>";
              innerHTML +=
                '<td><div class="pastel-wrapper">' +
                makePastelHTML(initials) +
                "</div></td>";
              innerHTML +=
                '<td><div class="button_box">' +
                '<form action="/treatment" method="post"><input type="hidden" name="id" value="' +
                patient.id +
                '" /><input type="hidden" name="roomNumber" value="1" /><button type="submit" id="roomNumberSelect">1</button></form>' +
                '<form action="/treatment" method="post"><input type="hidden" name="id" value="' +
                patient.id +
                '" /><input type="hidden" name="roomNumber" value="2" /><button type="submit" id="roomNumberSelect">2</button></form>' +
                "</div></td>";
              innerHTML +=
                '<td><div class="button_box">' +
                '<form action="/waitlist" method="post"><input type="hidden" name="id" value="' +
                patient.id +
                '" /><button type="submit">보류</button></form>' +
                "</div></td>";
              row.innerHTML = innerHTML;
              tableBody.appendChild(row);

              if (patient.memo.length > 0) {
                var memoRow = document.createElement("tr");
                memoRow.innerHTML =
                  "<td></td><td>↳</td><td>" +
                  patient.memo +
                  "</td><td></td><td></td>";
                tableBody.appendChild(memoRow);
              }
            }
          }
        }

        // localStorage fallback
        var hasLocalStorage = typeof window.localStorage !== "undefined";
        if (hasLocalStorage) {
          var input = document.querySelector(".patient_input");
          var room = localStorage.getItem("room");
          if (room === "dr") {
            input.style.display = "none";
          } else if (room === "desk") {
            input.style.display = "block";
          }
        }

        var radioButtons = document.getElementsByName("room");
        for (var r = 0; r < radioButtons.length; r++) {
          radioButtons[r].attachEvent
            ? radioButtons[r].attachEvent("onchange", toggleInputVisibility)
            : radioButtons[r].addEventListener("change", toggleInputVisibility);
        }

        function toggleInputVisibility() {
          for (var i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].checked) {
              if (hasLocalStorage) {
                localStorage.setItem("room", radioButtons[i].value);
              }
              input.style.display =
                radioButtons[i].value === "dr" ? "none" : "block";
            }
          }
        }
      }
    };
    xhr.send();
  });
})();

window.onload = function () {
  var containers = document.getElementsByClassName("container");

  for (var i = 0; i < containers.length; i++) {
    var container = containers[i];
    var childDivs = container.getElementsByTagName("div");

    // 실제로 .container의 직계 자식만 카운트
    var directChildren = 0;
    for (var j = 0; j < childDivs.length; j++) {
      if (childDivs[j].parentNode === container) {
        directChildren++;
      }
    }

    if (directChildren === 1) {
      if (container.className.indexOf("single-column") === -1) {
        container.className += " single-column";
      }
    }
  }
};
