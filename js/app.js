// --- Page navigation ---
document.querySelectorAll('.nav-link').forEach(a =>
  a.addEventListener('click', e => {
    e.preventDefault();
    showPage(a.getAttribute('data-target'));
  })
);

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(name).style.display = 'block';
  window.scrollTo(0, 0);

  // Hide test page if user not logged in
  if (name === 'tests') checkLoginForTests();
}
showPage('home');

// --- Glossary demo ---
const glossary = [
  { term: 'Ethos', def: 'Appeal to credibility' },
  { term: 'Pathos', def: 'Appeal to emotion' },
  { term: 'Logos', def: 'Appeal to logic' }
];
function renderGlossary() {
  const tbody = document.getElementById('glossary-body');
  tbody.innerHTML = '';
  glossary.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${r.term}</strong></td><td>${r.def}</td>`;
    tbody.appendChild(tr);
  });
}
renderGlossary();

// --- LOGIN CHECK ---
let currentUser = null;

function checkLoginForTests() {
  const lock = document.getElementById('lockedMessage');
  const controls = document.getElementById('test-controls');
  const user = localStorage.getItem('loggedUser');
  if (user) {
    currentUser = JSON.parse(user);
    lock.style.display = 'none';
    controls.classList.remove('d-none');
  } else {
    lock.style.display = 'block';
    controls.classList.add('d-none');
  }
}

// --- TEST SYSTEM ---
let loadedTests = null;
const loadBtn = document.getElementById('loadTestFile');
const startBtn = document.getElementById('startTest');
const testArea = document.getElementById('test-area');

loadBtn.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function() {
    try {
      const data = JSON.parse(reader.result);
      loadedTests = data.tests || [];
      startBtn.disabled = false;
      testArea.innerHTML = `<div class="alert alert-success">Loaded ${loadedTests.length} test(s). Click "Start Test" to begin.</div>`;
    } catch (err) {
      alert("Invalid JSON file format.");
    }
  };
  reader.readAsText(file);
});

startBtn.addEventListener('click', () => {
  if (!loadedTests || loadedTests.length === 0) {
    alert("Please load a test file first!");
    return;
  }
  startTest(loadedTests[0]);
});

function startTest(test) {
  testArea.innerHTML = `<h5>${test.title}</h5>`;
  const form = document.createElement('form');
  test.questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'mb-3 p-3 border rounded';
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

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn btn-success';
  btn.textContent = 'Submit Answers';
  form.appendChild(btn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    let score = 0;
    test.questions.forEach((q, i) => {
      const checked = form.querySelector(`input[name=q${i}]:checked`);
      if (checked && parseInt(checked.value) === q.answer) score++;
    });
    const percent = Math.round((score / test.questions.length) * 100);
    form.innerHTML = `
      <div class="alert alert-info">
        <h5>Your score: ${score}/${test.questions.length} (${percent}%)</h5>
        <p>${getFeedback(percent)}</p>
      </div>
    `;
  });

  testArea.appendChild(form);
}

function getFeedback(percent) {
  if (percent >= 90) return "Excellent! You truly understand the material.";
  if (percent >= 70) return "Good job! Some details could be reviewed.";
  if (percent >= 50) return "Fair, but you should review the key strategies.";
  return "Keep studying — review the theory and try again!";
}

// --- REGISTRATION & LOGIN ---
document.getElementById('regForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const pass = regPass.value;
  if (!name || !email || !pass) return;
  localStorage.setItem(email, JSON.stringify({ name, pass }));
  regMsg.textContent = 'Registered successfully!';
});

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const pass = loginPass.value;
  const user = localStorage.getItem(email);
  if (!user) {
    loginMsg.textContent = 'User not found';
    return;
  }
  const data = JSON.parse(user);
  if (data.pass === pass) {
    loginMsg.textContent = 'Login successful! Welcome, ' + data.name;
    localStorage.setItem('loggedUser', JSON.stringify(data));
    document.getElementById('testsMenu').innerText = 'Tests ✅';
    alert("Now you can access Tests!");
  } else {
    loginMsg.textContent = 'Incorrect password';
  }
});
