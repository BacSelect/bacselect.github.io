const slider = document.querySelector('#nSlider');
const input = document.querySelector('#nInput');
const value = document.querySelector('#nValue');
const presets = [...document.querySelectorAll('[data-n]')];
const buildButton = document.querySelector('#buildButton');
const buildNote = document.querySelector('#buildNote');

function setN(n) {
  const parsed = Number.parseInt(n, 10);
  if (!Number.isFinite(parsed)) return;

  const next = Math.max(10, Math.min(500, parsed));
  slider.value = next;
  input.value = next;
  value.textContent = next;
  presets.forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.n) === next);
  });
}

slider.addEventListener('input', (event) => setN(event.target.value));
input.addEventListener('change', (event) => setN(event.target.value));
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    setN(event.target.value);
    input.blur();
  }
});
presets.forEach((button) => button.addEventListener('click', () => setN(button.dataset.n)));

buildButton.addEventListener('click', () => {
  buildNote.textContent = `Panel generation for N=${slider.value} will activate with the first validated BacSelect release.`;
  buildNote.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
