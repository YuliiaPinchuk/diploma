// =======================================================
//  PAGE LOADING SYSTEM  (for separate HTML files)
// =======================================================

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("content");

  // Load default page
  loadPage("home.html");
  

  // Intercept menu link clicks
  document.querySelectorAll("a.nav-link, .dropdown-item").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const url = link.getAttribute("href");
      loadPage(url);
    });
  });

  function loadPage(url) {
    fetch(url)
        .then(res => res.text())
        .then(html => {
          container.innerHTML = html;
          window.scrollTo(0, 0);

          // Reinitialize functions for loaded content
          initGlossary();
          initLoginPage();
          initTestsPage();

          const tabs = document.querySelectorAll('.tab-swen');
          const contents = document.querySelectorAll('.tab-content');

          tabs.forEach(tab => {
            tab.addEventListener('click', () => {
              const targetId = tab.dataset.tab;

              // remove active from all tabs and contents
              tabs.forEach(t => t.classList.remove('active'));
              contents.forEach(c => c.classList.remove('active'));

              // activate the clicked tab and its content
              tab.classList.add('active');
              document.getElementById(targetId).classList.add('active');
            });
          });
          
          
        })
        .catch(err => {
          container.innerHTML = `<div class="alert alert-danger">Error loading ${url}</div>`;
        });
  }
});


// =======================================================
//  GLOSSARY (only runs when glossary page is loaded)
// =======================================================

const glossary = [
  { term: 'Ethos', def: 'Appeal to credibility' },
  { term: 'Pathos', def: 'Appeal to emotion' },
  { term: 'Logos', def: 'Appeal to logic' }
];

function initGlossary() {
  const tbody = document.getElementById('glossary-body');
  if (!tbody) return; // glossary page not loaded

  tbody.innerHTML = "";
  glossary.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${row.term}</strong></td><td>${row.def}</td>`;
    tbody.appendChild(tr);
  });
}


// =======================================================
//  LOGIN SYSTEM (register + login)
// =======================================================

let currentUser = null;

function initLoginPage() {
  const regForm = document.getElementById('regForm');
  const loginForm = document.getElementById('loginForm');

  if (!regForm || !loginForm) return; // not on register page

  // Registration
  regForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPass").value;

    if (!name || !email || !pass) return;

    localStorage.setItem(email, JSON.stringify({ name, pass }));
    document.getElementById("regMsg").textContent = "Registered successfully!";
  });

  // Login
  loginForm.addEventListener('submit', e => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPass").value;

    const user = localStorage.getItem(email);
    if (!user) {
      document.getElementById("loginMsg").textContent = "User not found";
      return;
    }

    const data = JSON.parse(user);

    if (data.pass === pass) {
      currentUser = data;
      localStorage.setItem("loggedUser", JSON.stringify(data));

      document.getElementById("loginMsg").textContent =
          "Login successful! Welcome, " + data.name;

      const testsMenu = document.getElementById("testsMenu");
      if (testsMenu) testsMenu.textContent = "Tests ✅";

      alert("You can now access Tests!");
    } else {
      document.getElementById("loginMsg").textContent = "Incorrect password";
    }
  });
}


// =======================================================
//  TEST SYSTEM
// =======================================================

let loadedTests = null;

function initTestsPage() {
  const lock = document.getElementById('lockedMessage');
  const controls = document.getElementById('test-controls');
  const loadBtn = document.getElementById('loadTestFile');
  const startBtn = document.getElementById('startTest');
  const testArea = document.getElementById('test-area');

  if (!lock || !controls || !testArea) return; // not tests page

  // --- LOGIN CHECK ---
  const user = localStorage.getItem("loggedUser");
  if (user) {
    currentUser = JSON.parse(user);
    lock.style.display = "none";
    controls.classList.remove("d-none");
  } else {
    lock.style.display = "block";
    controls.classList.add("d-none");
  }

  // --- LOAD TEST FILE ---
  loadBtn.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        loadedTests = data.tests || [];

        startBtn.disabled = false;
        testArea.innerHTML =
            `<div class="alert alert-success">Loaded ${loadedTests.length} test(s). Click "Start Test".</div>`;
      } catch {
        alert("Invalid JSON file.");
      }
    };

    reader.readAsText(file);
  });

  // --- START TEST ---
  startBtn.addEventListener("click", () => {
    if (!loadedTests || loadedTests.length === 0) {
      alert("Load a test file first!");
      return;
    }
    startTest(loadedTests[0], testArea);
  });
}


function startTest(test, testArea) {
  testArea.innerHTML = `<h5>${test.title}</h5>`;

  const form = document.createElement("form");

  test.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "mb-3 p-3 border rounded";

    div.innerHTML = `<strong>${i + 1}. ${q.q}</strong><br>`;

    q.options.forEach((opt, j) => {
      div.innerHTML += `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="q${i}" id="q${i}_${j}" value="${j}">
          <label class="form-check-label" for="q${i}_${j}">${opt}</label>
        </div>`;
    });

    form.appendChild(div);
  });

  const btn = document.createElement("button");
  btn.type = "submit";
  btn.className = "btn btn-success";
  btn.textContent = "Submit Answers";
  form.appendChild(btn);

  form.addEventListener("submit", e => {
    e.preventDefault();
    let score = 0;

    test.questions.forEach((q, i) => {
      const chosen = form.querySelector(`input[name=q${i}]:checked`);
      if (chosen && parseInt(chosen.value) === q.answer) score++;
    });

    const percent = Math.round((score / test.questions.length) * 100);

    form.innerHTML = `
      <div class="alert alert-info">
        <h5>Your score: ${score}/${test.questions.length} (${percent}%)</h5>
        <p>${getFeedback(percent)}</p>
      </div>`;
  });

  testArea.appendChild(form);
}

function getFeedback(percent) {
  let gradeUA = "";
  let gradeECTS = "";
  let description = "";

  if (percent >= 90) {
    gradeUA = "Відмінно";
    gradeECTS = "A";
    description = "Відмінне виконання лише з незначною кількістю помилок.";
  } 
  else if (percent >= 82) {
    gradeUA = "Відмінно";
    gradeECTS = "B";
    description = "Вище середнього рівня з кількома помилками.";
  } 
  else if (percent >= 74) {
    gradeUA = "Добре";
    gradeECTS = "C";
    description = "В цілому правильне виконання з певною кількістю суттєвих помилок.";
  } 
  else if (percent >= 64) {
    gradeUA = "Задовільно";
    gradeECTS = "D";
    description = "Непогано, але зі значною кількістю недоліків.";
  } 
  else if (percent >= 60) {
    gradeUA = "Задовільно";
    gradeECTS = "E";
    description = "Виконання задовольняє мінімальним критеріям.";
  } 
  else if (percent >= 35) {
    gradeUA = "Незадовільно";
    gradeECTS = "FX";
    description = "Незадовільно, потрібно повторне складання.";
  } 
  else {
    gradeUA = "Незадовільно";
    gradeECTS = "F";
    description = "Незадовільно.";
  }

  return `
    <strong>Оцінка за університетською шкалою:</strong> ${gradeUA}<br>
    <strong>Оцінка за шкалою ECTS:</strong> ${gradeECTS}<br>
    <strong>Пояснення:</strong> ${description}
  `;
}

