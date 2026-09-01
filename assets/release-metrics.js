(() => {
  'use strict';

  const countdownLabel = document.querySelector('#releaseCountdownLabel');
  const countdownValue = document.querySelector('#releaseCountdown');
  const countdownDate = document.querySelector('#releaseCountdownDate');

  const resultDownloadN = document.querySelector('#resultDownloadN');
  const resultDownloadCount = document.querySelector('#resultDownloadCount');
  const resultDownloadBreakdown = document.querySelector('#resultDownloadBreakdown');

  const slider = document.querySelector('#nSlider');
  const input = document.querySelector('#nInput');

  const numberFormat = new Intl.NumberFormat('en');

  let config = null;
  let countdownTimer = null;
  let panelSerial = 0;

  function currentN() {
    const raw = slider?.value ?? input?.value ?? '100';
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 100;
  }

  function currentIdentity() {
    if (
      config?.monthly_release?.published === true
      && typeof config.monthly_release.release === 'string'
    ) {
      return config.monthly_release.release;
    }

    return config?.reference_panel?.identity ?? 'selector-v1-reference';
  }

  function endpointBase() {
    const endpoint = config?.download_metrics?.endpoint;

    if (
      config?.download_metrics?.enabled !== true
      || typeof endpoint !== 'string'
      || endpoint.length === 0
    ) {
      return null;
    }

    return endpoint.replace(/\/+$/, '');
  }

  function formatScheduledDate(date) {
    return new Intl.DateTimeFormat(
      'en-NZ',
      {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'UTC',
        timeZoneName: 'short',
      },
    ).format(date);
  }

  function renderCountdown() {
    if (!countdownValue || !countdownDate || !config) return;

    const targetText = config?.monthly_release?.next_scheduled_update_utc;

    if (typeof targetText !== 'string') {
      countdownValue.textContent = 'Schedule pending';
      countdownDate.textContent = 'No next-update timestamp published';
      return;
    }

    const target = new Date(targetText);

    if (Number.isNaN(target.getTime())) {
      countdownValue.textContent = 'Schedule unavailable';
      countdownDate.textContent = 'Invalid release timestamp';
      return;
    }

    if (countdownLabel) {
      countdownLabel.textContent = (
        config?.monthly_release?.published === true
          ? 'Next monthly update'
          : 'First monthly snapshot'
      );
    }

    countdownDate.textContent = formatScheduledDate(target);

    const remaining = target.getTime() - Date.now();

    if (remaining <= 0) {
      countdownValue.textContent = 'Update in progress';
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownValue.textContent = (
      `${days}d `
      + `${String(hours).padStart(2, '0')}h `
      + `${String(minutes).padStart(2, '0')}m `
      + `${String(seconds).padStart(2, '0')}s`
    );
  }

  function renderCountPayload(n, payload) {
    if (!resultDownloadN || !resultDownloadCount || !resultDownloadBreakdown) {
      return;
    }

    const formats = payload?.formats ?? {};
    const xlsx = Number(formats.xlsx ?? 0);
    const tsv = Number(formats.tsv ?? 0);
    const txt = Number(formats.txt ?? 0);
    const total = Number(payload?.total ?? (xlsx + tsv + txt));

    resultDownloadN.textContent = numberFormat.format(n);
    resultDownloadCount.textContent = numberFormat.format(total);

    resultDownloadBreakdown.textContent = (
      `${numberFormat.format(xlsx)} Excel`
      + ` · ${numberFormat.format(tsv)} TSV`
      + ` · ${numberFormat.format(txt)} accessions`
    );
  }

  function renderCounterUnavailable(n) {
    if (!resultDownloadN || !resultDownloadCount || !resultDownloadBreakdown) {
      return;
    }

    resultDownloadN.textContent = numberFormat.format(n);
    resultDownloadCount.textContent = '—';
    resultDownloadBreakdown.textContent = (
      'Download tracking is not yet connected.'
    );
  }

  async function loadPanelDownloads(requestedN = currentN()) {
    const serial = ++panelSerial;
    const n = Number(requestedN);

    if (!Number.isInteger(n)) {
      return;
    }

    const base = endpointBase();

    if (!base) {
      renderCounterUnavailable(n);
      return;
    }

    const identity = currentIdentity();

    try {
      const url = new URL(`${base}/v1/counts`);
      url.searchParams.set('identity', identity);
      url.searchParams.set('n', String(n));

      const response = await fetch(
        url,
        {
          cache: 'no-store',
          mode: 'cors',
        },
      );

      if (!response.ok) {
        throw new Error(`download counter returned HTTP ${response.status}`);
      }

      const payload = await response.json();

      if (serial !== panelSerial || n !== currentN()) return;

      renderCountPayload(n, payload);
    } catch (error) {
      console.error('Unable to load BacSelect download metrics.', error);

      if (serial === panelSerial) {
        renderCounterUnavailable(n);
      }
    }
  }

  async function recordDownload(format) {
    const base = endpointBase();

    if (!base) return;

    const n = currentN();

    try {
      const response = await fetch(
        `${base}/v1/download`,
        {
          method: 'POST',
          mode: 'cors',
          cache: 'no-store',
          keepalive: true,
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(
            {
              identity: currentIdentity(),
              n,
              format,
            },
          ),
        },
      );

      if (!response.ok) {
        throw new Error(`download counter returned HTTP ${response.status}`);
      }

      const payload = await response.json();

      if (n === currentN()) {
        renderCountPayload(n, payload);
      }
    } catch (error) {
      console.error('Unable to record BacSelect download event.', error);
    }
  }

  function handleDownloadClick(event) {
    const target = event.target.closest('[data-download-format]');

    if (!target) return;

    if (
      target.classList.contains('disabled')
      || target.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }

    const format = target.dataset.downloadFormat;

    if (!['xlsx', 'tsv', 'txt'].includes(format)) return;

    void recordDownload(format);
  }

  function handleSelectionChange(event) {
    const n = Number(
      event.detail?.n,
    );

    if (!Number.isInteger(n)) {
      return;
    }

    void loadPanelDownloads(
      n,
    );
  }

  async function initialise() {
    try {
      const response = await fetch(
        'data/site.json',
        {
          cache: 'no-cache',
        },
      );

      if (!response.ok) {
        throw new Error(`site metadata returned HTTP ${response.status}`);
      }

      config = await response.json();

      renderCountdown();

      if (countdownTimer !== null) {
        window.clearInterval(countdownTimer);
      }

      countdownTimer = window.setInterval(
        renderCountdown,
        1000,
      );

      await loadPanelDownloads();
    } catch (error) {
      console.error('Unable to load BacSelect release metrics configuration.', error);

      if (countdownValue) {
        countdownValue.textContent = 'Schedule unavailable';
      }

      renderCounterUnavailable(currentN());
    }
  }

  document.addEventListener(
    'click',
    handleDownloadClick,
  );

  window.addEventListener(
    'bacselect:selection-changed',
    handleSelectionChange,
  );

  window.addEventListener(
    'bacselect:panel-ready',
    handleSelectionChange,
  );

  void initialise();
})();
