# 🚲 Cycloparking demand analysis — Schaerbeek 1030

> Spatial and statistical analysis of bicycle parking demand for the municipality of Schaerbeek (1030) · Data as of June 2026

---

## 🔗 Quick Access

| Tool | Description | Link |
|---|---|---|
| 🏠 **Home page** | Project portal | [gis1030.github.io/RH-Agents1030]([[https://gis1030.github.io/RH-Agents1030/]](https://gis1030.github.io/DSD-Cycloparking1030/)) |
| 🗺️ **Cartography** | Interactive map — facilities, demand density, individual requests | [indexFR.html](indexFR.html) |
| 📊 **Dashboard** | Demand table — filters, sorting, CSV export | [cycloparkin1030_demandes.html](cycloparkin1030_demandes.html) |

---

## 📋 About the Project

This project provides a comprehensive spatial and statistical analysis of **bicycle parking demand in the municipality of Schaerbeek**, covering **2,287 individual requests** recorded between 2017 and 2026.

Data is sourced from the municipal cycloparking demand register and open mobility datasets, and processed to produce interactive visualisations accessible from any browser, with no installation required.

---

## 🧭 Contents

### 🗺️ Interactive Map

The map combines existing bicycle parking infrastructure with demand data across multiple aggregation levels.

**Available layers**

- 🔵 **Demandes individuelles** — each request plotted as a point (2,287 records)
- 🟥 **Par Quartiers** — demand aggregated by administrative district (6 intensity classes)
- 🟩 **Par Îlot urbain** — demand aggregated by urban block (3 intensity classes)
- 📍 **Cycloparking** — secured bicycle parking facilities (cabins, closed boxes)
- 📍 **Arceau isolé** — individual bicycle racks
- 📍 **Box vélo** — bicycle lockers
- 📍 **Groupe d'arceaux** — grouped rack installations
- 🏘️ **Quartiers Schaerbeek** — administrative district boundaries
- 🔲 **Limites Schaerbeek** — municipal boundary

**Available filters**

- **Quartier** — filter all layers by administrative district (14 quartiers)
- **Période** — filter individual requests by year range (visible when *Demandes individuelles* is active)
- **Type de demande** — filter individual requests by demand type (visible when *Demandes individuelles* is active)

**Key indicators — individual requests**

- 📬 **2,287 requests** recorded between 2017 and 2026
- 📅 **2017–2021** — 83 requests
- 📅 **2022–2024** — 1,128 requests
- 📅 **2025–2026** — 1,076 requests
- 🏠 **homeClassic** — home address, standard bicycle
- 🏢 **otherClassic** — other address, standard bicycle
- 📌 **poiClassic** — point of interest, standard bicycle
- 🛒 **homeCargo** — home address, cargo bicycle
- 🏭 **poiCargo** — point of interest, cargo bicycle

**Base maps** — Google Terrain (default) · Google Satellite · OpenStreetMap

### 📊 Demand Dashboard

The dashboard allows individual demand records to be explored and filtered across multiple dimensions, with dynamic chip-based filtering and real-time result counts.

**Available filters**

- Quartier, Îlot urbain (BlockParcel)
- Type de demande (homeClassic, otherClassic, poiClassic, homeCargo, poiCargo)
- Période (2017–2021, 2022–2024, 2025–2026)
- Adresse (rue, numéro)

**Exports**

- 📥 **CSV export** — filtered dataset downloadable at any time

---

## 🛠️ Technologies

- **HTML / CSS / JavaScript** — 100% client-side application, no server required
- **Leaflet.js** — interactive mapping with marker clustering and animated cluster icons
- **Chart.js** — statistical visualisations in the dashboard
- **L.Control.Layers.Tree** — hierarchical layer control with radio groups
- **Leaflet MarkerCluster** — clustered point rendering with animated pulse icons
- **Leaflet Photon / Nominatim** — address search bar integrated in the map
- **GitHub Pages** — static hosting

---

## 🌐 Compatibility

Compatible with recent versions of **Firefox**, **Chrome**, and **Edge**.  
Optimised for desktop use; the map is responsive but the dashboard is best viewed on a wide screen.

---

## 📁 Repository Structure

```
DSD-Cycloparking1030/
├── indexFR.html                          # Interactive map
├── cycloparkin1030_demandes.html         # Demand dashboard
├── index.html                            # Entry point / landing page
├── css/                                  # Stylesheets and UI images
│   └── images/                           # Icons and logos
├── data/                                 # GeoJSON data (JS wrapper format)
│   ├── requests_cycloparking1030_0512026.js        # 2,287 individual requests
│   ├── cycloparking_opendata_20260611112407.js      # Secured facilities (opendata)
│   ├── cycloparking_mobility_20260611124740.js      # Street-level infrastructure
│   ├── DemandesCycloparking_BlockParcel_3.js        # Demand by urban block
│   ├── DemandesCycloparking_Quartiers_4.js          # Demand by quartier
│   ├── QuartiersSchaerbeek_1.js                     # Administrative districts
│   └── LimitesSchaerbeek_2.js                       # Municipal boundary
├── js/                                   # Leaflet libraries + application logic
│   ├── mapFR.js                          # Main map logic
│   ├── dashboard_common.js               # Shared dashboard logic
│   └── dashboard_shadowbroker.js         # Dashboard rendering
├── markers/                              # Map point icons (PNG)
├── legend/                               # Legend swatches (PNG)
├── webfonts/                             # FontAwesome subset
└── REFERENCE_Cartographie_Leaflet_1030.md  # Technical cartography reference
```

---

## 📅 Changelog

| Date | Description |
|---|---|
| June 2026 | Map updated with mobility infrastructure data (arceaux, boxes, grouped racks) |
| June 2026 | Period and demand-type filters added to the interactive map |
| May 2026 | Individual requests dataset frozen (2,287 records, 2017–2026) |
| 2024–2025 | Demand aggregation layers added (by quartier and by urban block) |

---

## 📄 Data Sources

| Dataset | Source | Date |
|---|---|---|
| Individual cycloparking requests | Municipal demand register | May 2026 |
| Secured facilities (Cycloparking) | Open data — Région de Bruxelles-Capitale | June 2026 |
| Street-level infrastructure | Mobility open data — Brussels | June 2026 |
| Administrative boundaries | Quartiers and limits of Schaerbeek | Reference |

Data is processed and packaged as static GeoJSON files for client-side rendering. No server-side queries are performed at runtime.

---

## 🔒 Data Protection (GDPR)

### Nature of Published Data

Individual demand records contain address-level data linked to specific requests. No direct personal identifiers (names, contact details) are published in this application.

| Data | Nature | Justification |
|---|---|---|
| Demand ID | Technical identifier | Anonymous reference |
| Demand type | Typological | Category of use (home, POI, cargo) |
| Request date | Temporal | Statistical analysis |
| Street address + number | Geographical | Spatial aggregation and mapping |
| Quartier / Îlot urbain | Geographical | Administrative aggregation |

Data published in **aggregated layers** (by quartier or urban block) consists exclusively of **anonymised headcounts** that do not allow identification of any individual.

### Legal Basis

The publication of this data is grounded in:
- **Article 6.1(e) of the GDPR** — processing necessary for the performance of a task carried out in the public interest
- **Principle of administrative transparency** applicable to Belgian public administrations

> ⚠️ *Full compliance of this processing activity, in particular regarding the terms of public access to address-level demand data, should be reviewed with the Data Protection Officer (DPO) of the municipality of Schaerbeek prior to any public deployment.*

### Data Controller

**Commune de Schaerbeek** · Place Colignon · 1030 Brussels · Belgium

---

## 📄 Licence

This project is licensed under the **European Union Public Licence v. 1.2 (EUPL-1.2)**.  
See the [LICENSE](LICENSE) file for the full text.

[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL%201.2-blue.svg)](https://eupl.eu/1.2/en/)

> © 2024–2026 Direction des Systèmes d'Information (DSI) · Commune de Schaerbeek · 1030 Brussels · Belgium

---

*Commune de Schaerbeek · Direction des Systèmes d'Information (DSI) · 1030 Brussels · Belgium*
