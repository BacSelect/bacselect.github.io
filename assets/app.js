const slider = document.querySelector('#nSlider');
const value = document.querySelector('#nValue');
const presets = [...document.querySelectorAll('[data-n]')];
const buildButton = document.querySelector('#buildButton');
const buildNote = document.querySelector('#buildNote');

function setN(n) {
  const next = Math.max(10, Math.min(500, Number(n)));
  slider.value = next;
  value.textContent = next;
  presets.forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.n) === next);
  });
}

slider.addEventListener('input', (event) => setN(event.target.value));
presets.forEach((button) => button.addEventListener('click', () => setN(button.dataset.n)));

buildButton.addEventListener('click', () => {
  buildNote.textContent = `BacSelect v1 is still under validation. The ${slider.value}-genome interface is ready, but no scientific panel will be released until the general selector is frozen.`;
  buildNote.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
