const slider = document.querySelector('#nSlider');
const input = document.querySelector('#nInput');
const value = document.querySelector('#nValue');
const genomeScale = document.querySelector('#genomeScale');
const nShare = document.querySelector('#nShare');
const atlasShare = document.querySelector('#atlasShare');
const atlasUniverseCount = document.querySelector('#atlasUniverseCount');
const scaleMaxN = document.querySelector('#scaleMaxN');
const scaleMaxShare = document.querySelector('#scaleMaxShare');
const scaleSectionMaxN = document.querySelector('#scaleSectionMaxN');
const scaleSectionMaxShare = document.querySelector('#scaleSectionMaxShare');
const scaleBoundaryUniverse = document.querySelector('#scaleBoundaryUniverse');
const presetsContainer = document.querySelector('.presets');
const buildButton = document.querySelector('#buildButton');
const buildNote = document.querySelector('#buildNote');
const statusLabel = document.querySelector('#statusLabel');

const panelResult = document.querySelector('#panelResult');
const resultN = document.querySelector('#resultN');
const resultRelease = document.querySelector('#resultRelease');
const resultSelector = document.querySelector('#resultSelector');
const resultAvailability = document.querySelector('#resultAvailability');
const resultNote = document.querySelector('#resultNote');
const referenceDownload = document.querySelector('#referenceDownload');
const referenceProvenance = document.querySelector('#referenceProvenance');

const methodsN = document.querySelector('#methodsN');
const copyMethodsButton = document.querySelector('#copyMethodsButton');

const foundationGenomes = document.querySelector('#foundationGenomes');
const foundationSpecies = document.querySelector('#foundationSpecies');
const foundationFeatures = document.querySelector('#foundationFeatures');

const scientificRepoLink = document.querySelector('#scientificRepoLink');
const resultRepoLink = document.querySelector('#resultRepoLink');
const websiteRepoLink = document.querySelector('#websiteRepoLink');

const numberFormat = new Intl.NumberFormat('en');
const gcaPattern = /^GCA_[0-9]+\.[0-9]+$/;

const site = {
  statusLabel: 'Selector v1 reference panel',
  minN: 10,
  maxN: 500,
  defaultN: 100,
  presets: [10, 20, 50, 100, 200, 500],
  monthlyRelease: null,
  reference: {
    validated: true,
    identity: 'selector-v1-reference',
    displayLabel: 'Selector v1 reference',
    selector: 'OPS',
    selectorVersion: '1.0.0',
    architectureSchemaVersion: 1,
    artifactBase: 'data/reference-v1',
    ladderFile: 'selector-v1-winning-ladder-n500.tsv',
    provenanceFile: 'panel-generation-provenance.json',
  },
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

let ladderPromise = null;
let activeObjectUrl = null;
let panelStateN = null;
let panelRequestSerial = 0;

function setN(n) {
  const parsed = Number.parseInt(n, 10);
  if (!Number.isFinite(parsed)) return;

  const next = Math.max(site.minN, Math.min(site.maxN, parsed));

  slider.value = next;
  input.value = next;
  value.textContent = numberFormat.format(next);
  if (methodsN) methodsN.textContent = numberFormat.format(next);

  const range = Math.max(1, site.maxN - site.minN);
  const rawPosition = ((next - site.minN) / range) * 100;
  const position = 2.4 + rawPosition * 0.96;
  if (genomeScale) genomeScale.style.setProperty('--scale-position', `${position}%`);

  const universe = site.foundation.eligibleGenomes;
  if (Number.isFinite(universe) && universe > 0) {
    const share = `${((next / universe) * 100).toFixed(2)}%`;
    if (nShare) nShare.textContent = share;
    if (atlasShare) atlasShare.textContent = `${share} of frozen universe`;
    if (atlasUniverseCount) atlasUniverseCount.textContent = numberFormat.format(universe);

    const maxShare = `${((site.maxN / universe) * 100).toFixed(2)}%`;
    if (scaleMaxN) scaleMaxN.textContent = numberFormat.format(site.maxN);
    if (scaleMaxShare) scaleMaxShare.textContent = maxShare;
    if (scaleSectionMaxN) scaleSectionMaxN.textContent = numberFormat.format(site.maxN);
    if (scaleSectionMaxShare) scaleSectionMaxShare.textContent = maxShare;
    if (scaleBoundaryUniverse) scaleBoundaryUniverse.textContent = numberFormat.format(universe);
  }

  document.querySelectorAll('[data-n]').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.n) === next);
  });

  const displayedResultN = Number.parseInt(resultN.textContent.replace(/,/g, ''), 10);
  const preparedPanelChanged = panelStateN !== null && next !== panelStateN;
  const stalePanelChanged = panelStateN === null
    && !panelResult.hidden
    && Number.isFinite(displayedResultN)
    && next !== displayedResultN;

  if (preparedPanelChanged || stalePanelChanged) {
    panelRequestSerial += 1;
    panelStateN = null;
    disableReferenceActions(`Selection changed to N=${numberFormat.format(next)}. Select Get reference panel to prepare this panel.`);
    buildNote.textContent = `Selection changed. Get the N=${numberFormat.format(next)} reference panel.`;
    resultN.textContent = numberFormat.format(next);
  }
}

function renderPresets() {
  presetsContainer.replaceChildren();

  site.presets.forEach((n) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.n = String(n);
    button.textContent = numberFormat.format(n);

    if (n === Number(slider.value)) button.classList.add('active');
    presetsContainer.append(button);
  });
}

function applySiteData(data) {
  site.statusLabel = data.status_label ?? site.statusLabel;

  if (data.monthly_release) {
    site.monthlyRelease = data.monthly_release.release ?? null;
  }

  if (data.reference_panel) {
    site.reference.validated = data.reference_panel.validated === true;
    site.reference.identity = data.reference_panel.identity ?? site.reference.identity;
    site.reference.displayLabel = data.reference_panel.display_label ?? site.reference.displayLabel;
    site.reference.selector = data.reference_panel.selector ?? site.reference.selector;
    site.reference.selectorVersion = data.reference_panel.selector_version ?? site.reference.selectorVersion;
    site.reference.architectureSchemaVersion = data.reference_panel.architecture_schema_version ?? site.reference.architectureSchemaVersion;
    site.reference.artifactBase = data.reference_panel.artifact_base ?? site.reference.artifactBase;
    site.reference.ladderFile = data.reference_panel.ladder_file ?? site.reference.ladderFile;
    site.reference.provenanceFile = data.reference_panel.provenance_file ?? site.reference.provenanceFile;
  }

  if (data.panel) {
    site.minN = data.panel.min_n ?? site.minN;
    site.maxN = data.panel.max_n ?? site.maxN;
    site.defaultN = data.panel.default_n ?? site.defaultN;
    if (Array.isArray(data.panel.presets) && data.panel.presets.length > 0) {
      site.presets = data.panel.presets;
    }
  }

  if (data.foundation) {
    site.foundation.eligibleGenomes = data.foundation.eligible_genomes ?? site.foundation.eligibleGenomes;
    site.foundation.speciesGroups = data.foundation.species_groups ?? site.foundation.speciesGroups;
    site.foundation.structuralFeatures = data.foundation.structural_features ?? site.foundation.structuralFeatures;
  }

  if (data.repositories) {
    site.repositories.scientific = data.repositories.scientific ?? site.repositories.scientific;
    site.repositories.website = data.repositories.website ?? site.repositories.website;
  }

  slider.min = site.minN;
  slider.max = site.maxN;
  input.min = site.minN;
  input.max = site.maxN;

  statusLabel.textContent = site.statusLabel;
  foundationGenomes.textContent = numberFormat.format(site.foundation.eligibleGenomes);
  foundationSpecies.textContent = numberFormat.format(site.foundation.speciesGroups);
  foundationFeatures.textContent = numberFormat.format(site.foundation.structuralFeatures);

  scientificRepoLink.href = site.repositories.scientific;
  resultRepoLink.href = site.repositories.scientific;
  websiteRepoLink.href = site.repositories.website;

  setN(site.defaultN);
  renderPresets();
}

function disableReferenceActions(note) {
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  referenceDownload.removeAttribute('href');
  referenceDownload.removeAttribute('download');
  referenceDownload.classList.add('disabled');
  referenceDownload.setAttribute('aria-disabled', 'true');

  referenceProvenance.removeAttribute('href');
  referenceProvenance.classList.add('disabled');
  referenceProvenance.setAttribute('aria-disabled', 'true');

  if (note) resultNote.textContent = note;
}

function parseWinningLadder(text) {
  const lines = text.trimEnd().split('\n');
  if (lines.length !== 501) throw new Error('Reference ladder must contain 500 data rows.');
  if (lines[0] !== 'rank\taccession\tfirst_public_panel_n') {
    throw new Error('Reference ladder header mismatch.');
  }

  const accessions = lines.slice(1).map((line, index) => {
    const fields = line.split('\t');
    if (fields.length !== 3) throw new Error('Reference ladder field count mismatch.');
    if (fields[0] !== String(index + 1)) throw new Error('Reference ladder rank mismatch.');
    if (!gcaPattern.test(fields[1])) throw new Error('Reference ladder contains a non-canonical GCA accession.');
    return fields[1];
  });

  if (new Set(accessions).size !== 500) throw new Error('Reference ladder contains duplicate accessions.');
  return accessions;
}

async function loadReferenceLadder() {
  if (ladderPromise) return ladderPromise;

  const url = `${site.reference.artifactBase}/${site.reference.ladderFile}`;
  ladderPromise = fetch(url, { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Reference ladder returned HTTP ${response.status}`);
      return response.text();
    })
    .then(parseWinningLadder)
    .catch((error) => {
      ladderPromise = null;
      throw error;
    });

  return ladderPromise;
}

function enableDownload(n, accessions) {
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);

  const payload = `${accessions.slice(0, n).join('\n')}\n`;
  activeObjectUrl = URL.createObjectURL(new Blob([payload], { type: 'text/plain;charset=utf-8' }));

  referenceDownload.href = activeObjectUrl;
  referenceDownload.download = `bacselect-selector-v1-reference-n${n}.txt`;
  referenceDownload.classList.remove('disabled');
  referenceDownload.setAttribute('aria-disabled', 'false');

  referenceProvenance.href = `${site.reference.artifactBase}/${site.reference.provenanceFile}`;
  referenceProvenance.classList.remove('disabled');
  referenceProvenance.setAttribute('aria-disabled', 'false');

  resultNote.textContent = `This N=${numberFormat.format(n)} reference panel is the exact prefix of the frozen OPS selector-v1 ladder. It is not a dated monthly release.`;
}

async function showPanelStatus() {
  const n = Number(slider.value);
  const requestSerial = ++panelRequestSerial;
  panelStateN = n;

  resultN.textContent = numberFormat.format(n);
  resultRelease.textContent = site.reference.displayLabel;
  resultSelector.textContent = `v${site.reference.selectorVersion}`;
  resultAvailability.textContent = site.monthlyRelease ?? 'Pending';
  panelResult.hidden = false;

  disableReferenceActions('Checking for the validated reference-panel artifacts published with this website checkout.');
  buildNote.textContent = `Loading selector v1.0.0 reference panel for N=${numberFormat.format(n)}.`;

  try {
    const accessions = await loadReferenceLadder();

    if (requestSerial !== panelRequestSerial || Number(slider.value) !== n) return;

    enableDownload(n, accessions);
    buildNote.textContent = `Reference panel ready: N=${numberFormat.format(n)}.`;
  } catch (error) {
    if (requestSerial !== panelRequestSerial || Number(slider.value) !== n) return;

    console.error('Validated BacSelect reference artifacts are not available in this website checkout.', error);
    buildNote.textContent = 'Selector v1 is validated, but the published accession artifact could not be loaded.';
    disableReferenceActions('Downloads are disabled because the frozen selector-v1 ladder could not be loaded from data/reference-v1/.');
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  panelResult.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
}

function referenceMethodsText() {
  const n = Number(slider.value);
  return `Complete bacterial genomes were selected using the BacSelect selector v1 reference panel (selector v${site.reference.selectorVersion}, architecture schema v${site.reference.architectureSchemaVersion}, N=${n}).`;
}

async function copyMethods() {
  const text = referenceMethodsText();
  try {
    await navigator.clipboard.writeText(text);
    copyMethodsButton.textContent = 'Copied';
    window.setTimeout(() => { copyMethodsButton.textContent = 'Copy Methods'; }, 1500);
  } catch (error) {
    console.error('Unable to copy Methods text.', error);
    copyMethodsButton.textContent = 'Copy failed';
  }
}

async function loadSiteData() {
  try {
    const response = await fetch('data/site.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`site.json returned HTTP ${response.status}`);
    applySiteData(await response.json());
  } catch (error) {
    console.error('Unable to load BacSelect site metadata.', error);
    setN(site.defaultN);
    renderPresets();
    buildNote.textContent = 'Site metadata could not be loaded. Reference downloads are unavailable.';
  }
}

slider.addEventListener('input', (event) => setN(event.target.value));
input.addEventListener('change', (event) => setN(event.target.value));
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
if (copyMethodsButton) copyMethodsButton.addEventListener('click', copyMethods);

loadSiteData();
