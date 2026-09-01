(() => {
  'use strict';

  const REFERENCE_FIELDS = Object.freeze([
    'selection_rank',
    'first_public_panel_n',
    'genbank_assembly_accession',
    'biosample_accession',
    'ncbi_organism_name',
    'ncbi_organism_taxid',
    'bacselect_species_name',
    'bacselect_species_taxid',
    'assembly_name',
    'submitter',
    'assembly_release_date',
    'panel_identity',
    'selector',
    'selector_version',
    'architecture_schema_version',
    'source_snapshot_sha256',
    'taxonomy_snapshot_sha256',
    'execution_git_commit',
    'ncbi_assembly_url',
  ]);

  const PUBLIC_PANEL_FIELDS = Object.freeze([
    'panel_identity',
    'panel_size',
    'selection_rank',
    'genbank_assembly_accession',
    'biosample_accession',
    'ncbi_organism_name',
    'ncbi_organism_taxid',
    'bacselect_species_name',
    'bacselect_species_taxid',
    'assembly_name',
    'submitter',
    'assembly_release_date',
    'selector',
    'selector_version',
    'architecture_schema_version',
    'source_snapshot_sha256',
    'taxonomy_snapshot_sha256',
    'execution_git_commit',
    'ncbi_assembly_url',
  ]);

  const COLUMN_WIDTHS = Object.freeze([
    23,
    12,
    15,
    24,
    20,
    35,
    19,
    35,
    22,
    25,
    40,
    19,
    12,
    17,
    27,
    68,
    68,
    43,
    56,
  ]);

  const MIN_N = 10;
  const MAX_N = 500;

  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder(
    'utf-8',
    {
      fatal: true,
    },
  );

  function assertPanelSize(n) {
    if (
      !Number.isInteger(n)
      || n < MIN_N
      || n > MAX_N
    ) {
      throw new Error(
        'Panel size must be an integer from 10 through 500.',
      );
    }
  }

  function assertSafeField(value, label) {
    if (
      typeof value !== 'string'
      || value.length === 0
    ) {
      throw new Error(`${label} must be non-empty text.`);
    }

    if (
      value.includes('\t')
      || value.includes('\n')
      || value.includes('\r')
    ) {
      throw new Error(
        `${label} contains a TSV control character.`,
      );
    }

    return value;
  }

  function parseReferenceMetadata(text) {
    if (typeof text !== 'string') {
      throw new TypeError(
        'Reference metadata must be text.',
      );
    }

    const lines = text.trimEnd().split('\n');

    if (lines.length !== 501) {
      throw new Error(
        'Reference metadata must contain exactly 500 data rows.',
      );
    }

    const header = lines[0].split('\t');

    if (
      header.length !== REFERENCE_FIELDS.length
      || header.some(
        (field, index) => field !== REFERENCE_FIELDS[index],
      )
    ) {
      throw new Error(
        'Reference metadata header mismatch.',
      );
    }

    const rows = lines.slice(1).map(
      (line, index) => {
        const fields = line.split('\t');

        if (fields.length !== REFERENCE_FIELDS.length) {
          throw new Error(
            `Reference metadata row ${index + 1} field-count mismatch.`,
          );
        }

        const row = Object.create(null);

        REFERENCE_FIELDS.forEach(
          (field, fieldIndex) => {
            row[field] = assertSafeField(
              fields[fieldIndex],
              `row ${index + 1} ${field}`,
            );
          },
        );

        if (
          row.selection_rank
          !== String(index + 1)
        ) {
          throw new Error(
            `Reference metadata rank mismatch at row ${index + 1}.`,
          );
        }

        if (
          row.panel_identity
          !== 'selector-v1-reference'
        ) {
          throw new Error(
            'Reference metadata panel identity changed.',
          );
        }

        return row;
      },
    );

    const accessions = new Set(
      rows.map(
        (row) => row.genbank_assembly_accession,
      ),
    );

    const speciesTaxids = new Set(
      rows.map(
        (row) => row.bacselect_species_taxid,
      ),
    );

    if (accessions.size !== 500) {
      throw new Error(
        'Reference metadata contains duplicate assembly accessions.',
      );
    }

    if (speciesTaxids.size !== 500) {
      throw new Error(
        'Reference metadata must contain 500 distinct BacSelect species TaxIDs.',
      );
    }

    return rows;
  }

  function publicPanelRows(referenceRows, n) {
    assertPanelSize(n);

    if (
      !Array.isArray(referenceRows)
      || referenceRows.length !== 500
    ) {
      throw new Error(
        'Reference metadata rows are not the canonical 500-row ladder.',
      );
    }

    return referenceRows.slice(0, n).map(
      (source, index) => {
        if (
          source.selection_rank
          !== String(index + 1)
        ) {
          throw new Error(
            'Reference rank sequence changed.',
          );
        }

        return [
          source.panel_identity,
          String(n),
          source.selection_rank,
          source.genbank_assembly_accession,
          source.biosample_accession,
          source.ncbi_organism_name,
          source.ncbi_organism_taxid,
          source.bacselect_species_name,
          source.bacselect_species_taxid,
          source.assembly_name,
          source.submitter,
          source.assembly_release_date,
          source.selector,
          source.selector_version,
          source.architecture_schema_version,
          source.source_snapshot_sha256,
          source.taxonomy_snapshot_sha256,
          source.execution_git_commit,
          source.ncbi_assembly_url,
        ];
      },
    );
  }

  function buildPanelTsv(referenceRows, n) {
    const rows = publicPanelRows(
      referenceRows,
      n,
    );

    return [
      PUBLIC_PANEL_FIELDS.join('\t'),
      ...rows.map(
        (row) => row.join('\t'),
      ),
      '',
    ].join('\n');
  }

  function xmlEscape(value) {
    const text = String(value);

    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index);

      if (
        code < 0x20
        && code !== 0x09
        && code !== 0x0a
        && code !== 0x0d
      ) {
        throw new Error(
          'Workbook value contains an illegal XML control character.',
        );
      }
    }

    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function excelColumnName(index) {
    let value = index + 1;
    let name = '';

    while (value > 0) {
      const remainder = (value - 1) % 26;

      name = String.fromCharCode(
        65 + remainder,
      ) + name;

      value = Math.floor(
        (value - 1) / 26,
      );
    }

    return name;
  }

  function inlineCell(
    rowIndex,
    columnIndex,
    value,
    style = 0,
  ) {
    const ref = (
      `${excelColumnName(columnIndex)}${rowIndex}`
    );

    const styleAttribute = style === 0
      ? ''
      : ` s="${style}"`;

    return (
      `<c r="${ref}" t="inlineStr"${styleAttribute}>`
      + '<is><t xml:space="preserve">'
      + xmlEscape(value)
      + '</t></is></c>'
    );
  }

  function buildWorksheetXml(rows) {
    const lastRow = rows.length + 1;
    const lastColumn = excelColumnName(
      PUBLIC_PANEL_FIELDS.length - 1,
    );

    const columns = COLUMN_WIDTHS.map(
      (width, index) => (
        `<col min="${index + 1}" max="${index + 1}" `
        + `width="${width}" customWidth="1"/>`
      ),
    ).join('');

    const headerCells = PUBLIC_PANEL_FIELDS.map(
      (field, index) => inlineCell(
        1,
        index,
        field,
        1,
      ),
    ).join('');

    const dataRows = rows.map(
      (row, rowOffset) => {
        const rowNumber = rowOffset + 2;

        const cells = row.map(
          (value, columnIndex) => inlineCell(
            rowNumber,
            columnIndex,
            value,
            0,
          ),
        ).join('');

        return (
          `<row r="${rowNumber}">${cells}</row>`
        );
      },
    ).join('');

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/'
      + 'spreadsheetml/2006/main">'
      + `<dimension ref="A1:${lastColumn}${lastRow}"/>`
      + '<sheetViews>'
      + '<sheetView workbookViewId="0">'
      + '<pane ySplit="1" topLeftCell="A2" '
      + 'activePane="bottomLeft" state="frozen"/>'
      + '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>'
      + '</sheetView>'
      + '</sheetViews>'
      + '<sheetFormatPr defaultRowHeight="18"/>'
      + `<cols>${columns}</cols>`
      + '<sheetData>'
      + `<row r="1" ht="32" customHeight="1">${headerCells}</row>`
      + dataRows
      + '</sheetData>'
      + `<autoFilter ref="A1:${lastColumn}${lastRow}"/>`
      + '</worksheet>'
    );
  }

  function workbookFiles(rows) {
    return [
      [
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/'
        + 'package/2006/content-types">'
        + '<Default Extension="rels" '
        + 'ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" '
        + 'ContentType="application/vnd.openxmlformats-officedocument.'
        + 'spreadsheetml.sheet.main+xml"/>'
        + '<Override PartName="/xl/worksheets/sheet1.xml" '
        + 'ContentType="application/vnd.openxmlformats-officedocument.'
        + 'spreadsheetml.worksheet+xml"/>'
        + '<Override PartName="/xl/styles.xml" '
        + 'ContentType="application/vnd.openxmlformats-officedocument.'
        + 'spreadsheetml.styles+xml"/>'
        + '<Override PartName="/docProps/core.xml" '
        + 'ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        + '<Override PartName="/docProps/app.xml" '
        + 'ContentType="application/vnd.openxmlformats-officedocument.'
        + 'extended-properties+xml"/>'
        + '</Types>',
      ],
      [
        '_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/'
        + 'package/2006/relationships">'
        + '<Relationship Id="rId1" '
        + 'Type="http://schemas.openxmlformats.org/officeDocument/'
        + '2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '<Relationship Id="rId2" '
        + 'Type="http://schemas.openxmlformats.org/package/2006/'
        + 'relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        + '<Relationship Id="rId3" '
        + 'Type="http://schemas.openxmlformats.org/officeDocument/'
        + '2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        + '</Relationships>',
      ],
      [
        'docProps/app.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Properties xmlns="http://schemas.openxmlformats.org/'
        + 'officeDocument/2006/extended-properties" '
        + 'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/'
        + '2006/docPropsVTypes">'
        + '<Application>BacSelect</Application>'
        + '</Properties>',
      ],
      [
        'docProps/core.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<cp:coreProperties '
        + 'xmlns:cp="http://schemas.openxmlformats.org/package/2006/'
        + 'metadata/core-properties" '
        + 'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        + 'xmlns:dcterms="http://purl.org/dc/terms/" '
        + 'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        + '<dc:title>BacSelect panel metadata</dc:title>'
        + '<dc:creator>BacSelect</dc:creator>'
        + '</cp:coreProperties>',
      ],
      [
        'xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<workbook xmlns="http://schemas.openxmlformats.org/'
        + 'spreadsheetml/2006/main" '
        + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/'
        + '2006/relationships">'
        + '<sheets>'
        + '<sheet name="Panel metadata" sheetId="1" r:id="rId1"/>'
        + '</sheets>'
        + '</workbook>',
      ],
      [
        'xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/'
        + 'package/2006/relationships">'
        + '<Relationship Id="rId1" '
        + 'Type="http://schemas.openxmlformats.org/officeDocument/'
        + '2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        + '<Relationship Id="rId2" '
        + 'Type="http://schemas.openxmlformats.org/officeDocument/'
        + '2006/relationships/styles" Target="styles.xml"/>'
        + '</Relationships>',
      ],
      [
        'xl/styles.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<styleSheet xmlns="http://schemas.openxmlformats.org/'
        + 'spreadsheetml/2006/main">'
        + '<fonts count="2">'
        + '<font><sz val="11"/><name val="Aptos"/></font>'
        + '<font><b/><color rgb="FFFFFFFF"/><sz val="11"/>'
        + '<name val="Aptos"/></font>'
        + '</fonts>'
        + '<fills count="3">'
        + '<fill><patternFill patternType="none"/></fill>'
        + '<fill><patternFill patternType="gray125"/></fill>'
        + '<fill><patternFill patternType="solid">'
        + '<fgColor rgb="FF6846C7"/><bgColor indexed="64"/>'
        + '</patternFill></fill>'
        + '</fills>'
        + '<borders count="2">'
        + '<border><left/><right/><top/><bottom/><diagonal/></border>'
        + '<border><left/><right/><top/>'
        + '<bottom style="thin"><color rgb="FFD8D3E4"/></bottom>'
        + '<diagonal/></border>'
        + '</borders>'
        + '<cellStyleXfs count="1">'
        + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
        + '</cellStyleXfs>'
        + '<cellXfs count="2">'
        + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" '
        + 'xfId="0"/>'
        + '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" '
        + 'xfId="0" applyFont="1" applyFill="1" applyBorder="1" '
        + 'applyAlignment="1">'
        + '<alignment vertical="center" wrapText="1"/>'
        + '</xf>'
        + '</cellXfs>'
        + '<cellStyles count="1">'
        + '<cellStyle name="Normal" xfId="0" builtinId="0"/>'
        + '</cellStyles>'
        + '</styleSheet>',
      ],
      [
        'xl/worksheets/sheet1.xml',
        buildWorksheetXml(rows),
      ],
    ];
  }

  const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
      let value = index;

      for (let bit = 0; bit < 8; bit += 1) {
        value = (
          value & 1
            ? (0xedb88320 ^ (value >>> 1))
            : (value >>> 1)
        );
      }

      table[index] = value >>> 0;
    }

    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;

    for (const byte of bytes) {
      crc = (
        CRC32_TABLE[
          (crc ^ byte) & 0xff
        ]
        ^ (crc >>> 8)
      );
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  function concatBytes(parts) {
    const total = parts.reduce(
      (sum, part) => sum + part.length,
      0,
    );

    const output = new Uint8Array(total);

    let offset = 0;

    for (const part of parts) {
      output.set(
        part,
        offset,
      );

      offset += part.length;
    }

    return output;
  }

  function localHeader(
    nameBytes,
    dataBytes,
    checksum,
  ) {
    const header = new Uint8Array(
      30 + nameBytes.length,
    );

    const view = new DataView(
      header.buffer,
    );

    view.setUint32(
      0,
      0x04034b50,
      true,
    );

    view.setUint16(
      4,
      20,
      true,
    );

    view.setUint16(
      6,
      0x0800,
      true,
    );

    view.setUint16(
      8,
      0,
      true,
    );

    view.setUint16(
      10,
      0,
      true,
    );

    view.setUint16(
      12,
      0x0021,
      true,
    );

    view.setUint32(
      14,
      checksum,
      true,
    );

    view.setUint32(
      18,
      dataBytes.length,
      true,
    );

    view.setUint32(
      22,
      dataBytes.length,
      true,
    );

    view.setUint16(
      26,
      nameBytes.length,
      true,
    );

    view.setUint16(
      28,
      0,
      true,
    );

    header.set(
      nameBytes,
      30,
    );

    return header;
  }

  function centralHeader(
    nameBytes,
    dataBytes,
    checksum,
    localOffset,
  ) {
    const header = new Uint8Array(
      46 + nameBytes.length,
    );

    const view = new DataView(
      header.buffer,
    );

    view.setUint32(
      0,
      0x02014b50,
      true,
    );

    view.setUint16(
      4,
      20,
      true,
    );

    view.setUint16(
      6,
      20,
      true,
    );

    view.setUint16(
      8,
      0x0800,
      true,
    );

    view.setUint16(
      10,
      0,
      true,
    );

    view.setUint16(
      12,
      0,
      true,
    );

    view.setUint16(
      14,
      0x0021,
      true,
    );

    view.setUint32(
      16,
      checksum,
      true,
    );

    view.setUint32(
      20,
      dataBytes.length,
      true,
    );

    view.setUint32(
      24,
      dataBytes.length,
      true,
    );

    view.setUint16(
      28,
      nameBytes.length,
      true,
    );

    view.setUint16(
      30,
      0,
      true,
    );

    view.setUint16(
      32,
      0,
      true,
    );

    view.setUint16(
      34,
      0,
      true,
    );

    view.setUint16(
      36,
      0,
      true,
    );

    view.setUint32(
      38,
      0,
      true,
    );

    view.setUint32(
      42,
      localOffset,
      true,
    );

    header.set(
      nameBytes,
      46,
    );

    return header;
  }

  function endOfCentralDirectory(
    fileCount,
    centralSize,
    centralOffset,
  ) {
    const record = new Uint8Array(22);
    const view = new DataView(
      record.buffer,
    );

    view.setUint32(
      0,
      0x06054b50,
      true,
    );

    view.setUint16(
      4,
      0,
      true,
    );

    view.setUint16(
      6,
      0,
      true,
    );

    view.setUint16(
      8,
      fileCount,
      true,
    );

    view.setUint16(
      10,
      fileCount,
      true,
    );

    view.setUint32(
      12,
      centralSize,
      true,
    );

    view.setUint32(
      16,
      centralOffset,
      true,
    );

    view.setUint16(
      20,
      0,
      true,
    );

    return record;
  }

  function zipStored(files) {
    const localParts = [];
    const centralParts = [];

    let localOffset = 0;

    for (const [name, content] of files) {
      const nameBytes = textEncoder.encode(
        name,
      );

      const dataBytes = (
        content instanceof Uint8Array
          ? content
          : textEncoder.encode(content)
      );

      const checksum = crc32(
        dataBytes,
      );

      const local = localHeader(
        nameBytes,
        dataBytes,
        checksum,
      );

      localParts.push(
        local,
        dataBytes,
      );

      centralParts.push(
        centralHeader(
          nameBytes,
          dataBytes,
          checksum,
          localOffset,
        ),
      );

      localOffset += (
        local.length
        + dataBytes.length
      );
    }

    const central = concatBytes(
      centralParts,
    );

    const end = endOfCentralDirectory(
      files.length,
      central.length,
      localOffset,
    );

    return concatBytes(
      [
        ...localParts,
        central,
        end,
      ],
    );
  }

  function buildPanelXlsx(referenceRows, n) {
    const rows = publicPanelRows(
      referenceRows,
      n,
    );

    return zipStored(
      workbookFiles(
        rows,
      ),
    );
  }

  async function sha256Hex(bytes) {
    if (
      !globalThis.crypto
      || !globalThis.crypto.subtle
    ) {
      throw new Error(
        'Web Crypto is unavailable; metadata integrity cannot be verified.',
      );
    }

    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      bytes,
    );

    return Array.from(
      new Uint8Array(digest),
      (value) => value.toString(16).padStart(2, '0'),
    ).join('');
  }

  let configurationPromise = null;
  let referenceRowsPromise = null;

  function loadConfiguration() {
    if (!configurationPromise) {
      configurationPromise = fetch(
        'data/site.json',
        {
          cache: 'no-cache',
        },
      )
        .then(
          (response) => {
            if (!response.ok) {
              throw new Error(
                `site.json returned HTTP ${response.status}`,
              );
            }

            return response.json();
          },
        )
        .catch(
          (error) => {
            configurationPromise = null;
            throw error;
          },
        );
    }

    return configurationPromise;
  }

  async function loadReferenceRows() {
    if (referenceRowsPromise) {
      return referenceRowsPromise;
    }

    referenceRowsPromise = (
      async () => {
        const configuration = await loadConfiguration();

        const reference = configuration.reference_panel;

        const name = reference?.metadata_ladder_file;
        const expectedSha = reference?.metadata_ladder_sha256;
        const base = reference?.artifact_base;

        if (
          typeof name !== 'string'
          || name.length === 0
          || typeof expectedSha !== 'string'
          || !/^[0-9a-f]{64}$/.test(expectedSha)
          || typeof base !== 'string'
          || base.length === 0
        ) {
          throw new Error(
            'Frozen reference metadata is not configured.',
          );
        }

        const response = await fetch(
          `${base}/${name}`,
          {
            cache: 'no-cache',
          },
        );

        if (!response.ok) {
          throw new Error(
            `Reference metadata returned HTTP ${response.status}`,
          );
        }

        const bytes = new Uint8Array(
          await response.arrayBuffer(),
        );

        const observedSha = await sha256Hex(
          bytes,
        );

        if (observedSha !== expectedSha) {
          throw new Error(
            `Reference metadata SHA256 mismatch: ${observedSha}`,
          );
        }

        return parseReferenceMetadata(
          textDecoder.decode(
            bytes,
          ),
        );
      }
    )().catch(
      (error) => {
        referenceRowsPromise = null;
        throw error;
      },
    );

    return referenceRowsPromise;
  }

  function browserIntegration() {
    const xlsxLink = document.querySelector(
      '#referenceMetadataXlsx',
    );

    const tsvLink = document.querySelector(
      '#referenceMetadataTsv',
    );

    if (
      !xlsxLink
      || !tsvLink
    ) {
      return;
    }

    const activeUrls = new Map();

    let requestSerial = 0;

    function revoke(format) {
      const url = activeUrls.get(
        format,
      );

      if (url) {
        URL.revokeObjectURL(
          url,
        );

        activeUrls.delete(
          format,
        );
      }
    }

    function disableLink(
      link,
      format,
    ) {
      revoke(
        format,
      );

      link.removeAttribute(
        'href',
      );

      link.removeAttribute(
        'download',
      );

      link.classList.add(
        'disabled',
      );

      link.setAttribute(
        'aria-disabled',
        'true',
      );
    }

    function disableAll() {
      requestSerial += 1;

      disableLink(
        xlsxLink,
        'xlsx',
      );

      disableLink(
        tsvLink,
        'tsv',
      );
    }

    function enableLink(
      link,
      format,
      payload,
      mimeType,
      filename,
    ) {
      revoke(
        format,
      );

      const url = URL.createObjectURL(
        new Blob(
          [payload],
          {
            type: mimeType,
          },
        ),
      );

      activeUrls.set(
        format,
        url,
      );

      link.href = url;
      link.download = filename;

      link.classList.remove(
        'disabled',
      );

      link.setAttribute(
        'aria-disabled',
        'false',
      );
    }

    async function prepare(
      n,
    ) {
      assertPanelSize(
        n,
      );

      disableAll();

      const serial = requestSerial;

      try {
        const configuration = await loadConfiguration();
        const referenceRows = await loadReferenceRows();

        if (serial !== requestSerial) {
          return;
        }

        const identity = (
          configuration.reference_panel?.identity
          ?? 'selector-v1-reference'
        );

        if (
          identity !== 'selector-v1-reference'
        ) {
          throw new Error(
            'Unexpected reference-panel identity.',
          );
        }

        const tsv = buildPanelTsv(
          referenceRows,
          n,
        );

        const xlsx = buildPanelXlsx(
          referenceRows,
          n,
        );

        if (serial !== requestSerial) {
          return;
        }

        const baseName = (
          `bacselect-${identity}-n${n}`
        );

        enableLink(
          tsvLink,
          'tsv',
          tsv,
          'text/tab-separated-values;charset=utf-8',
          `${baseName}.tsv`,
        );

        enableLink(
          xlsxLink,
          'xlsx',
          xlsx,
          'application/vnd.openxmlformats-officedocument.'
          + 'spreadsheetml.sheet',
          `${baseName}.xlsx`,
        );
      } catch (error) {
        console.error(
          'Unable to prepare BacSelect metadata downloads.',
          error,
        );

        if (serial === requestSerial) {
          disableAll();
        }
      }
    }

    window.addEventListener(
      'bacselect:panel-invalidated',
      disableAll,
    );

    window.addEventListener(
      'bacselect:panel-ready',
      (event) => {
        const n = Number(
          event.detail?.n,
        );

        if (Number.isInteger(n)) {
          void prepare(
            n,
          );
        }
      },
    );

    window.addEventListener(
      'beforeunload',
      () => {
        revoke(
          'xlsx',
        );

        revoke(
          'tsv',
        );
      },
    );
  }

  globalThis.BacSelectDownloads = Object.freeze(
    {
      PUBLIC_PANEL_FIELDS,
      REFERENCE_FIELDS,
      buildPanelTsv,
      buildPanelXlsx,
      parseReferenceMetadata,
      publicPanelRows,
    },
  );

  if (
    typeof document !== 'undefined'
    && typeof window !== 'undefined'
  ) {
    browserIntegration();
  }
})();
