# BacSelect product specification

## Status

Draft product, communication, and website specification.

This document describes how BacSelect should be presented, accessed, cited, and
maintained as a public resource.

It does not define scientific selection behaviour. Scientific behaviour is
defined separately in `docs/scientific-specification.md`.

## Product principle

BacSelect should make a technically rigorous genome-selection method unusually
easy to use.

The public experience should be:

1. choose how many genomes are needed;
2. see what that panel represents;
3. download it immediately;
4. obtain everything needed to reproduce and cite it.

Scientific detail should always be accessible but should not obstruct the main
task.

## Core public description

Preferred short description:

> Bacterial genome diversity, at the scale you need.

Preferred functional description:

> Choose how many bacterial genomes you need. BacSelect returns a reproducible
> panel designed to span genome architecture across its current public
> complete-genome universe.

BacSelect must not be described as:

- unbiased;
- representative of all bacteria;
- a catalogue of the most important bacteria;
- a gold-standard collection;
- a random sample.

## Homepage

The homepage should answer three questions within seconds:

1. What is BacSelect?
2. Why would I use it?
3. How do I get a panel?

The genome-number selector is the principal homepage interaction.

Initial presets:

- 10
- 20
- 50
- 100
- 200
- 500

A custom integer input should also be available within the supported public
range.

The homepage should not require a user to understand the selection algorithm
before generating or downloading a panel.

## Panel result

A generated panel page should show at minimum:

- requested N;
- BacSelect release;
- selector version;
- architecture-schema version;
- number of species represented;
- source-universe size;
- structural-distance summary;
- panel identifier.

Primary actions should be immediately visible:

- Download metadata (Excel)
- Download metadata (TSV)
- Download accessions
- Retrieve genome FASTA sequences
- Copy citation
- Copy Methods text

The interface should not require users to navigate through GitHub releases to
obtain routine downloads.

## Releases

BacSelect releases should be visible as a first-class part of the website.

The current release should show:

- release identifier;
- source-universe size;
- number of eligible species groups;
- selector version;
- architecture-schema version;
- release date;
- validation status.

Historical releases must remain accessible.

Release comparisons should eventually show:

- genomes retained;
- genomes entering;
- genomes leaving;
- changes in the eligible source universe;
- changes in structural-distance metrics.

## Source-universe communication

The website must state clearly that BacSelect does not represent all bacterial
life.

Preferred public-facing wording:

> BacSelect works within a defined public genome universe. That universe reflects
> what has been sampled, sequenced, assembled to completion, deposited, and
> classified. BacSelect can reduce arbitrary selection within that universe; it
> cannot remove biases already present in the underlying data.

A shorter version may appear near panel results, with the full explanation on
the Method or About page.

The website should describe the BacSelect v1 source as eligible public complete
bacterial genome assemblies in the INSDC/GenBank archive, retrieved
reproducibly through NCBI Datasets.

## Citation

Every released panel should provide a copy-ready citation interface.

The citation page should provide:

- preferred BacSelect citation;
- DOI when available;
- BibTeX;
- plain-text citation;
- `CITATION.cff`;
- software/release version;
- copy-ready Methods wording.

Until a BacSelect paper exists, citation should point to the versioned software
and archived release record.

When a BacSelect publication becomes available, the website may make the paper
the preferred scholarly citation while retaining version-specific release
identifiers.

## Copy-ready Methods wording

The website should generate Methods text using the actual selected release and
N.

Template:

> Complete bacterial genomes were selected using BacSelect release YYYY.MM
> (selector vX.Y.Z, architecture schema vX, N=N).

When a DOI exists, append the DOI.

Where scientifically relevant, the generated Methods text may additionally
state that selection was based on sequence-derived genome-architecture
features and did not use organism names or downstream benchmark performance.

The generated wording must never imply that the resulting panel represents all
bacterial diversity.

## How to refer to BacSelect in a paper

For most applications, BacSelect belongs in the Methods because it defines how
the genome set was selected.

BacSelect may also appear in Results when the composition, structural coverage,
or behaviour of the selected panel is itself analysed.

The website should provide brief guidance for both cases.

## Licensing

BacSelect uses the MIT License for BacSelect-authored software, website code,
documentation, and bespoke website graphics.

The licence does not alter the terms applying to third-party source data.
BacSelect does not claim ownership of, or attempt to relicense, underlying
INSDC genome sequence records.

Release artefacts must distinguish BacSelect-authored metadata and provenance
from third-party source records where relevant.

## Cost and access

BacSelect should remain free to access and use.

No core panel-generation, metadata, citation, or release-history functionality
should require payment.

## Voluntary support

A voluntary support mechanism may be added later.

It should be secondary and unobtrusive.

Preferred framing:

> BacSelect is free and open to use. If it saves you time, you can support
> ongoing development and maintenance.

Avoid framing that suggests scientific access depends on payment.

Do not place donation prompts in the main panel-generation workflow.

Potential placement:

- About page;
- footer;
- repository README.

The support platform itself remains undecided.

## Metrics

Metrics are useful for understanding whether BacSelect is being used and which
outputs are useful.

They should not become vanity counters on the main homepage.

Potential longitudinal metrics include:

- website visits;
- unique visitors where privacy-preserving measurement permits;
- generated panel requests by N;
- metadata downloads;
- accession-list downloads;
- FASTA retrievals;
- release-asset downloads;
- citation-copy actions;
- Methods-text copy actions;
- GitHub stars and forks;
- external citations.

Metrics should be collected only where technically reliable and ethically
reasonable.

Public metrics should distinguish cumulative measurements from short-window
platform statistics.

## Analytics

Analytics should be privacy-conscious and lightweight.

Preferred requirements:

- no advertising trackers;
- no unnecessary cookies;
- no invasive cross-site tracking;
- minimal effect on page performance;
- transparent disclosure if analytics are enabled.

A lightweight privacy-oriented analytics system may be added after the site
architecture is stable.

Analytics are not required for BacSelect v1 scientific release.

## Visual language

BacSelect should look like a high-quality scientific data product rather than a
generic bioinformatics documentation site.

Preferred characteristics:

- restrained colour;
- large, confident typography;
- generous whitespace;
- sharp vector geometry;
- strong information hierarchy;
- excellent responsive behaviour;
- accessible contrast;
- minimal decorative imagery.

Avoid:

- generic DNA helices;
- cartoon bacteria;
- microscope clip-art;
- stock laboratory imagery;
- decorative molecular graphics without scientific meaning.

## Bespoke vector graphics

Graphics should explain BacSelect rather than merely decorate it.

All principal scientific illustrations should be native vector graphics where
possible.

Initial visual system should include four carefully designed concepts.

### 1. Universe to panel

A large source genome universe passes through structural feature space and
resolves into a small selected panel.

Purpose:

- explain the core selection idea;
- show that BacSelect reduces a large public universe to a tractable set.

### 2. Nested N

Show panel growth such as:

10 → 20 → 50 → 100

The intended selector behaviour is that earlier selections remain present as N
increases.

Purpose:

- explain nested panels;
- make arbitrary N intuitive;
- distinguish BacSelect from independently regenerated fixed panels.

### 3. Genome space through time

Show successive monthly releases filling previously sparse regions of genome
architecture space.

Purpose:

- explain why BacSelect is refreshed;
- communicate archival releases;
- visualise change in the underlying public genome universe.

These graphics should use the same visual grammar as the BacSelect mark and
interactive genome-space visualisations.

## Interactive graphics

Where useful, static explanatory SVGs may become interactive on the website.

Potential interactions include:

- changing N and watching selected points accumulate;
- hovering over selected genomes;
- comparing current and previous releases;
- showing structural-distance change as N increases.

Animation should be purposeful, restrained, and optional.

The site must remain understandable without animation.

## Accessibility

BacSelect should meet a high accessibility standard.

Requirements include:

- keyboard-accessible controls;
- meaningful focus states;
- semantic HTML;
- appropriate ARIA only where needed;
- sufficient colour contrast;
- no information encoded by colour alone;
- reduced-motion support;
- responsive text sizing;
- useful alternative text for scientific graphics;
- downloadable information available independently of interactive graphics.

## Mobile design

The website must remain fully usable on phones and tablets.

The principal N selector and download actions should work without horizontal
scrolling.

Large scientific visualisations may simplify on small screens but must not lose
their core meaning.

## Explore

A future Explore interface should allow users to inspect:

- the current selected ladder;
- structural features;
- species groups;
- assembly accessions;
- entry and retirement history;
- panel membership at different N values.

Search and filtering should aid inspection but must never modify the canonical
BacSelect selection.

## Downloads

Human-readable and machine-readable outputs should both be first-class.

Expected formats include:

- `.xlsx`
- `.tsv`
- `.json`
- plain accession lists

FASTA delivery requires a separate implementation decision because sequence
archives may be large and the underlying sequence records are maintained by
INSDC.

The website repository should not become a permanent store of large duplicate
genome sequence archives without a clear reason.

## Repository and website relationship

The website should be generated from the same validated release artefacts that
drive downloads.

Displayed counts, release identifiers, selected genomes, and methodological
metadata must not be manually duplicated in HTML where they can drift from the
underlying release.

Scientific release data should be machine-readable and treated as the source
of truth.

## Marketing and communication

BacSelect should be easy to describe without overstating what it does.

Preferred message:

> We need a manageable set of bacterial genomes. Which ones?

BacSelect provides a reproducible way to answer that selection problem.

Public communication should emphasise:

- tractability;
- reproducibility;
- structural diversity;
- arbitrary N;
- versioned releases;
- ease of download.

Avoid inflated claims such as:

- complete representation;
- universal bacterial diversity;
- elimination of bias;
- gold standard;
- definitive genome panel.

## Future publication

BacSelect should be developed so that the resource itself can support a
standalone methods/resource publication.

A future manuscript could evaluate:

- the genome-selection problem;
- the BacSelect architecture space;
- selector validation;
- species-abundance effects;
- panel behaviour across N;
- stability across releases;
- comparison with random and conventional genome selection;
- growth of public bacterial genome architecture space over time.

The website, software, validation archive, and release system should be
designed from the start to support that eventual publication.
