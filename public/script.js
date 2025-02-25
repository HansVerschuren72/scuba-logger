document.addEventListener('DOMContentLoaded', () => {
  loadDives();
  loadStats();
  
  const form = document.getElementById('diveForm');
  
  // Originele submit-handler voor nieuwe duiken
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const dive = {
      date: formData.get('date'),
      location: formData.get('location'),
      depth: parseInt(formData.get('depth')),
      duration: parseInt(formData.get('duration')),
      notes: formData.get('notes')
    };

    await fetch('/api/dives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dive)
    });

    form.reset();
    loadDives();
  });
});

async function loadDives() {
  const response = await fetch('/api/dives');
  const dives = await response.json();
  const diveList = document.getElementById('diveList');
  
  diveList.innerHTML = dives.map(dive => `
    <div class="dive-entry" data-id="${dive.id}">
      <h3>${dive.location} - ${new Date(dive.date).toLocaleDateString('nl-NL')}</h3>
      <p>Diepte: ${dive.depth}m | Duur: ${dive.duration} minuten</p>
      ${dive.notes ? `<p>Notities: ${dive.notes}</p>` : ''}
      ${dive.photo ? `<img src="${dive.photo}" alt="Duik foto" style="max-width: 200px;">` : ''}
      <input type="file" onchange="uploadPhoto(${dive.id}, this)" accept="image/*">
      <button onclick="editDive(${dive.id})">Bewerken</button>
      <button onclick="deleteDive(${dive.id})">Verwijderen</button>
    </div>
  `).join('');
  loadStats(); // Update stats na laden van duiken
}

async function loadStats() {
  const response = await fetch('/api/stats');
  const stats = await response.json();
  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML = `
    <p>Totaal aantal duiken: ${stats.count}</p>
    <p>Totale duiktijd: ${stats.totalTime || 0} minuten</p>
    <p>Maximale diepte: ${stats.maxDepth || 0} meter</p>
  `;
}

async function editDive(id) {
  const dive = await (await fetch('/api/dives')).json().then(dives => dives.find(d => d.id === id));
  const form = document.getElementById('diveForm');
  
  // Vul het formulier
  form.date.value = dive.date;
  form.location.value = dive.location;
  form.depth.value = dive.depth;
  form.duration.value = dive.duration;
  form.notes.value = dive.notes || '';

  // Verwijder de originele submit-listener tijdelijk
  const originalSubmit = form.onsubmit;
  form.onsubmit = null;

  // Voeg een nieuwe submit-handler toe voor bewerken
  form.addEventListener('submit', async function handleEdit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedDive = {
      date: formData.get('date'),
      location: formData.get('location'),
      depth: parseInt(formData.get('depth')),
      duration: parseInt(formData.get('duration')),
      notes: formData.get('notes')
    };
    
    await fetch(`/api/dives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDive)
    });
    
    form.reset();
    loadDives();
    
    // Herstel het originele gedrag en verwijder deze listener
    form.removeEventListener('submit', handleEdit);
    form.onsubmit = originalSubmit;
  }, { once: true }); // Eenmalige listener
}

async function deleteDive(id) {
  if (confirm('Weet je zeker dat je deze duik wilt verwijderen?')) {
    await fetch(`/api/dives/${id}`, { method: 'DELETE' });
    loadDives();
  }
}

async function uploadPhoto(id, input) {
  const formData = new FormData();
  formData.append('photo', input.files[0]);
  await fetch(`/api/dives/${id}/photo`, {
    method: 'POST',
    body: formData
  });
  loadDives();
}