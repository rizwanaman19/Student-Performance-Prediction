// ── Benchmarks derived from dataset averages for "Safe" students ──────────
const BENCHMARKS = [
    { id: 'Mid_Term',             label: 'Mid-Term Score',        icon: '📝', safe: 77.1, max: 100,  unit: '/100',     tip: 'Focus on past exam papers and ask your teacher for topic-wise guidance.' },
    { id: 'Attendance',           label: 'Attendance',            icon: '🎓', safe: 82.6, max: 100,  unit: '%',        tip: 'Try not to miss classes. Even a 5% improvement in attendance significantly lowers risk.' },
    { id: 'Study_Hours_Per_Day',  label: 'Study Hours per Day',   icon: '📚', safe: 4.22, max: 10,   unit: ' hrs/day', tip: 'Build a consistent study schedule. Safe students average 4+ hours per day.' },
    { id: 'Previous_GPA',         label: 'Previous GPA',          icon: '📊', safe: 3.07, max: 4.0,  unit: '/4.0',     tip: 'Seek academic support or tutoring to improve your GPA in upcoming semesters.' },
    { id: 'Quiz',                 label: 'Quiz Score',            icon: '✏️', safe: 6.5,  max: 10,   unit: '/10',      tip: 'Practice short quizzes regularly — they are a strong indicator of topic understanding.' },
    { id: 'Assignment',           label: 'Assignment Score',      icon: '📋', safe: 6.5,  max: 10,   unit: '/10',      tip: 'Submit all assignments on time and review feedback carefully to improve.' },
    { id: 'Sleep_Hours',          label: 'Sleep Hours per Day',   icon: '😴', safe: 4,  max: 7.0,   unit: ' hrs/day', tip: 'Adequate sleep (7–8 hrs) improves memory retention and academic performance.' }
];

const GAP_THRESHOLD = {
    Mid_Term: 8, Attendance: 6, Study_Hours_Per_Day: 0.5,
    Previous_GPA: 0.25, Quiz: 1.0, Assignment: 1.0, Sleep_Hours: 1.0
};

const CRITICAL_GAP = {
    Mid_Term: 20, Attendance: 15, Study_Hours_Per_Day: 1.5,
    Previous_GPA: 0.6, Quiz: 2.5, Assignment: 2.5, Sleep_Hours: 2.0
};

function generateSuggestions(studentData) {
    const weak = [];
    for (const bench of BENCHMARKS) {
        const value = studentData[bench.id];
        if (value === undefined) continue;
        const gap = bench.safe - value;
        if (gap > (GAP_THRESHOLD[bench.id] || 0)) {
            weak.push({ ...bench, value, gap });
        }
    }
    weak.sort((a, b) => (b.gap / b.safe) - (a.gap / a.safe));
    return weak;
}

function renderSuggestions(suggestions) {
    const panel = document.getElementById('suggestions-panel');
    const list  = document.getElementById('suggestions-list');
    list.innerHTML = '';

    if (suggestions.length === 0) { panel.style.display = 'none'; return; }

    suggestions.forEach(s => {
        const pct      = Math.min(100, Math.round((s.value / s.max) * 100));
        const tgtPct   = Math.min(100, Math.round((s.safe  / s.max) * 100));
        const critical = s.gap >= (CRITICAL_GAP[s.id] || Infinity);
        const dispVal  = Number.isInteger(s.value) ? s.value : s.value.toFixed(2);
        const dispSafe = Number.isInteger(s.safe)  ? s.safe  : s.safe.toFixed(1);

        const card = document.createElement('div');
        card.className = 'suggestion-card';
        if (critical) card.style.borderLeftColor = '#c0392b';

        card.innerHTML = `
          <div class="s-icon">${s.icon}</div>
          <div class="s-body" style="flex:1;">
            <div class="s-title">
              ${critical ? '🔴 ' : '🟡 '}${s.label}
              <span style="font-weight:400;color:var(--muted);font-size:0.78rem;">
                — Your score: <strong style="color:var(--risk)">${dispVal}${s.unit}</strong>
                &nbsp;→&nbsp; Target: <strong style="color:var(--high)">${dispSafe}${s.unit}</strong>
              </span>
            </div>
            <div class="s-detail">${s.tip}</div>
            <div class="s-progress">
              <div class="s-bar-track">
                <div class="s-bar-fill" style="width:${pct}%;"></div>
              </div>
              <span class="s-bar-target">Target ${tgtPct}%</span>
            </div>
          </div>`;
        list.appendChild(card);
    });

    panel.style.display = 'block';
}

function sendJSON() {
    const resultDisplay = document.getElementById('result-display');
    const panel         = document.getElementById('suggestions-panel');
    resultDisplay.innerText = '';
    panel.style.display = 'none';

    const validationRules = [
        { id: 'Age',                   name: 'Age',             min: 15,  max: 100  },
        { id: 'Mid_Term',              name: 'Mid Term Score',  min: 0,   max: 100  },
        { id: 'Attendance',            name: 'Attendance (%)',  min: 0,   max: 100  },
        { id: 'Study_Hours_Per_Day',   name: 'Study Hours',     min: 0,   max: 24   },
        { id: 'Previous_GPA',          name: 'Previous GPA',    min: 0,   max: 4.0  },
        { id: 'Sleep_Hours',           name: 'Sleep Hours',     min: 0,   max: 24   },
        { id: 'Social_Hours_Per_Week', name: 'Social Hours',    min: 0,   max: 168  },
        { id: 'Quiz',                  name: 'Quiz Score',      min: 0,   max: 10   },
        { id: 'Assignment',            name: 'Assignment Score',min: 0,   max: 10   }
    ];

    let isValid = true;
    let studentData = {};

    for (let i = 0; i < validationRules.length; i++) {
        const rule  = validationRules[i];
        const value = parseFloat(document.getElementById(rule.id).value);
        if (isNaN(value) || value < rule.min || value > rule.max) {
            resultDisplay.innerText = `Error: ${rule.name} must be between ${rule.min} and ${rule.max}.`;
            resultDisplay.style.color = 'red';
            isValid = false;
            break;
        }
        studentData[rule.id] = value;
    }

    if (!isValid) return;

    studentData['Gender'] = document.getElementById('Gender').value;
    studentData['Major']  = document.getElementById('Major').value;

    resultDisplay.innerText = 'Analyzing performance…';
    resultDisplay.style.color = 'gray';

    fetch('/predict', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(studentData)
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'error') {
            resultDisplay.innerText = 'Server error: ' + data.message;
            resultDisplay.style.color = 'red';
            return;
        }

        const prediction = data.prediction;
        resultDisplay.innerText = 'Prediction: ' + prediction;

        if (prediction === 'At Risk') {
            resultDisplay.style.color = 'var(--risk)';
            renderSuggestions(generateSuggestions(studentData));
        } else if (prediction === 'Safe') {
            resultDisplay.style.color = 'var(--safe)';
        } else {
            resultDisplay.style.color = 'var(--high)';
        }
    })
    .catch(err => {
        console.error('Error connecting to Flask:', err);
        resultDisplay.innerText = 'Error: Could not reach the prediction server.';
        resultDisplay.style.color = 'red';
    });
}
