const slider = document.querySelector('#nSlider');
const input = document.querySelector('#nInput');
const value = document.querySelector('#nValue');
const presetsContainer = document.querySelector('.presets');
const buildButton = document.querySelector('#buildButton');
const buildNote = document.querySelector('#buildNote');

const statusLabel = document.querySelector('#statusLabel');

const panelResult = document.querySelector('#panelResult');
const resultN = document.querySelector('#resultN');
const resultRelease = document.querySelector('#resultRelease');
const resultSelector = document.querySelector('#resultSelector');
const resultAvailability = document.querySelector('#resultAvailability');

const foundationGenomes = document.querySelector('#foundationGenomes');
const foundationSpecies = document.querySelector('#foundationSpecies');
const foundationFeatures = document.querySelector('#foundationFeatures');

const scientificRepoLink = document.querySelector('#scientificRepoLink');
const resultRepoLink = document.querySelector('#resultRepoLink');
const websiteRepoLink = document.querySelector('#websiteRepoLink');

const numberFormat = new Intl.NumberFormat('en');

const site = {
  statusLabel: 'Development preview',
  productionReady: false,
  release: null,
  selectorVersion: null,
  minN: 10,
  maxN: 500,
  defaultN: 100,
  presets: [10, 20, 50, 100, 200, 500],
  foundation: {
    eligibleGenomes: 55306,
    speciesGroups: 13765,
    structuralFeatures: 12,
  },
  repositories: {
    scientific: 'https://github.com/BacSelect/bacselect',
    website: 'https://github.com/BacSelect/bacselect.github.io',
  },
};

function setN(n) {
  const parsed = Number.parseInt(n, 10);
  if (!Number.isFinite(parsed)) return;

  const next = Math.max(site.minN, Math.min(site.maxN, parsed));

  slider.value = next;
  input.value = next;
  value.textContent = next;

  document.querySelectorAll('[data-n]').forEach((button) => {
    button.classList.toggle(
      'active',
      Number(button.dataset.n) === next,
    );
  });
}

function renderPresets() {
  presetsContainer.replaceChildren();

  site.presets.forEach((n) => {
    const button = document.createElement('button');

    button.type = 'button';
    button.dataset.n = String(n);
    button.textContent = numberFormat.format(n);

    if (n === Number(slider.value)) {
      button.classList.add('active');
    }

    presetsContainer.append(button);
  });
}

function applySiteData(data) {
  site.statusLabel = data.status_label ?? site.statusLabel;
  site.productionReady = data.production_ready === true;
  site.release = data.release ?? null;
  site.selectorVersion = data.selector_version ?? null;

  if (data.panel) {
    site.minN = data.panel.min_n ?? site.minN;
    site.maxN = data.panel.max_n ?? site.maxN;
    site.defaultN = data.panel.default_n ?? site.defaultN;

    if (
      Array.isArray(data.panel.presets)
      && data.panel.presets.length > 0
    ) {
      site.presets = data.panel.presets;
    }
  }

  if (data.foundation) {
    site.foundation.eligibleGenomes =
      data.foundation.eligible_genomes
      ?? site.foundation.eligibleGenomes;

    site.foundation.speciesGroups =
      data.foundation.species_groups
      ?? site.foundation.speciesGroups;

    site.foundation.structuralFeatures =
      data.foundation.structural_features
      ?? site.foundation.structuralFeatures;
  }

  if (data.repositories) {
    site.repositories.scientific =
      data.repositories.scientific
      ?? site.repositories.scientific;

    site.repositories.website =
      data.repositories.website
      ?? site.repositories.website;
  }

  slider.min = site.minN;
  slider.max = site.maxN;

  input.min = site.minN;
  input.max = site.maxN;

  statusLabel.textContent = site.statusLabel;

  foundationGenomes.textContent =
    numberFormat.format(site.foundation.eligibleGenomes);

  foundationSpecies.textContent =
    numberFormat.format(site.foundation.speciesGroups);

  foundationFeatures.textContent =
    numberFormat.format(site.foundation.structuralFeatures);

  scientificRepoLink.href = site.repositories.scientific;
  resultRepoLink.href = site.repositories.scientific;
  websiteRepoLink.href = site.repositories.website;

  setN(site.defaultN);
  renderPresets();
}

function showPanelStatus() {
  const n = Number(slider.value);

  resultN.textContent = numberFormat.format(n);

  resultRelease.textContent =
    site.release ?? 'Pending';

  resultSelector.textContent =
    site.selectorVersion ?? 'Pending';

  resultAvailability.textContent =
    site.productionReady ? 'Available' : 'Not released';

  panelResult.hidden = false;

  if (site.productionReady) {
    buildNote.textContent =
      `Validated panel availability for N=${n} is being loaded.`;
  } else {
    buildNote.textContent =
      'Development preview. Panel generation is not active yet.';
  }

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  panelResult.scrollIntoView({
    block: 'nearest',
    behavior: reducedMotion ? 'auto' : 'smooth',
  });
}

async function loadSiteData() {
  try {
    const response = await fetch('data/site.json', {
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(
        `site.json returned HTTP ${response.status}`,
      );
    }

    const data = await response.json();

    applySiteData(data);
  } catch (error) {
    console.error('Unable to load BacSelect site metadata.', error);

    setN(site.defaultN);
    renderPresets();

    buildNote.textContent =
      'Development metadata could not be loaded. Panel generation remains unavailable.';
  }
}

slider.addEventListener('input', (event) => {
  setN(event.target.value);
});

input.addEventListener('change', (event) => {
  setN(event.target.value);
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    setN(event.target.value);
    input.blur();
  }
});

presetsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('[data-n]');

  if (!button) return;

  setN(button.dataset.n);
});

buildButton.addEventListener('click', showPanelStatus);

loadSiteData();
