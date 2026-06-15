        /* =============================================================
           INITIALISATION DE LA CARTE
           ============================================================= */
        var map = L.map('map', {
            zoomControl:false, maxZoom:28, minZoom:1
        }).setView([50.8619, 4.3932], 14);
        var hash = new L.Hash(map);
        map.attributionControl.setPrefix('<a href="https://github.com/tomchadwin/qgis2web" target="_blank">qgis2web</a> &middot; <a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> &middot; <a href="https://qgis.org">QGIS</a>');
        var autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});
        /* =============================================================
           FONCTIONS UTILITAIRES
           ============================================================= */
        // Masque les lignes du popup dont la valeur est nulle
        function removeEmptyRowsFromPopupContent(content, feature) {
         var tempDiv = document.createElement('div');
         tempDiv.innerHTML = content;
         var rows = tempDiv.querySelectorAll('tr');
         for (var i = 0; i < rows.length; i++) {
             var td = rows[i].querySelector('td.visible-with-data');
             var key = td ? td.id : '';
             if (td && td.classList.contains('visible-with-data') && feature.properties[key] == null) {
                 rows[i].parentNode.removeChild(rows[i]);
             }
         }
         return tempDiv.innerHTML;
        }
        // Adapte le popup si le contenu est un média (image, audio, vidéo)
        function addClassToPopupIfMedia(content, popup) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            var imgTd = tempDiv.querySelector('td img');
            if (imgTd) {
                var src = imgTd.getAttribute('src');
                if (/\.(jpg|jpeg|png|gif|bmp|webp|avif)$/i.test(src)) {
                    popup._contentNode.classList.add('media');
                    setTimeout(function() {
                        popup.update();
                    }, 10);
                } else if (/\.(mp3|wav|ogg|aac)$/i.test(src)) {
                    var audio = document.createElement('audio');
                    audio.controls = true;
                    audio.src = src;
                    imgTd.parentNode.replaceChild(audio, imgTd);
                    popup._contentNode.classList.add('media');
                    setTimeout(function() {
                        popup.setContent(tempDiv.innerHTML);
                        popup.update();
                    }, 10);
                } else if (/\.(mp4|webm|ogg|mov)$/i.test(src)) {
                    var video = document.createElement('video');
                    video.controls = true;
                    video.src = src;
                    video.style.width = "400px";
                    video.style.height = "300px";
                    video.style.maxHeight = "60vh";
                    video.style.maxWidth = "60vw";
                    imgTd.parentNode.replaceChild(video, imgTd);
                    popup._contentNode.classList.add('media');
                    video.addEventListener('loadedmetadata', function() {
                        popup.update();
                    });
                    setTimeout(function() {
                        popup.setContent(tempDiv.innerHTML);
                        popup.update();
                    }, 10);
                } else {
                    popup._contentNode.classList.remove('media');
                }
            } else {
                popup._contentNode.classList.remove('media');
            }
        }
        /* =============================================================
           TITRE ET LOGO (WATERMARK)
           ============================================================= */
        var title = new L.Control({ 'position': 'topleft' });
        title.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };
        title.update = function () {
            this._div.innerHTML = '<h2>Parkings Velo 1030<br><small style="display:block; margin-top:5px;">Demandes de cycloparking entre 2017-2026</small></h2>';
        };
        title.addTo(map);
        L.Control.Watermark = L.Control.extend({
            onAdd: function (map) {
                var img = L.DomUtil.create('img');
                img.src = 'css/images/schaerbeek1030_logo.png';
                img.style.width = '75px';
                return img;
            },
            onRemove: function (map) {}
        });
        L.control.watermark = function (opts) { return new L.Control.Watermark(opts); };
        L.control.watermark({ position: 'bottomleft' }).addTo(map);
        /* =============================================================
           CONTROLES DE CARTE (Zoom, Localisation)
           ============================================================= */
        var zoomControl = L.control.zoom({
            position: 'topleft'
        }).addTo(map);
        L.control.locate({locateOptions: {maxZoom: 19}}).addTo(map);
        var bounds_group = new L.featureGroup([]);
        /* =============================================================
           FONDS DE CARTE (Tiles) — Google Terrain (défaut), Satellite, OSM
           ============================================================= */
        map.createPane('pane_GoogleTerrain_0');
        map.getPane('pane_GoogleTerrain_0').style.zIndex = 400;
        var layer_GoogleTerrain_0 = L.tileLayer('https://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}', {
            pane: 'pane_GoogleTerrain_0',
            opacity: 1.0,
            attribution: '',
            minZoom: 1,
            maxZoom: 28,
            minNativeZoom: 0,
            maxNativeZoom: 18
        });
        map.addLayer(layer_GoogleTerrain_0);
        map.createPane('pane_GoogleSatellite_0');
        map.getPane('pane_GoogleSatellite_0').style.zIndex = 400;
        var layer_GoogleSatellite_0 = L.tileLayer('https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', {
            pane: 'pane_GoogleSatellite_0',
            opacity: 1.0,
            attribution: '',
            minZoom: 1,
            maxZoom: 28,
            minNativeZoom: 0,
            maxNativeZoom: 18
        });
        map.createPane('pane_OpenStreetMap_0');
        map.getPane('pane_OpenStreetMap_0').style.zIndex = 400;
        var layer_OpenStreetMap_0 = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            pane: 'pane_OpenStreetMap_0',
            opacity: 1.0,
            attribution: '',
            minZoom: 1,
            maxZoom: 28,
            minNativeZoom: 0,
            maxNativeZoom: 19
        });
        /* =============================================================
           COUCHE : Quartiers Schaerbeek
           Polygones de référence des quartiers administratifs
           ============================================================= */
        function pop_QuartiersSchaerbeek_1(feature, layer) {
            var popupContent = '<table>\
                    <tr>\
                        <th scope="row">Quartier</th>\
                        <td class="visible-with-data" id="SectorName">' + (feature.properties['SectorName'] !== null ? autolinker.link(String(feature.properties['SectorName']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                </table>';
            var content = removeEmptyRowsFromPopupContent(popupContent, feature);
			layer.on('popupopen', function(e) {
				addClassToPopupIfMedia(content, e.popup);
			});
			layer.bindPopup(content, { maxHeight: 400, maxWidth: 240 });
        }

        function style_QuartiersSchaerbeek_1_0() {
            return {
                pane: 'pane_QuartiersSchaerbeek_1',
                opacity: 1,
                color: 'rgba(88,151,202,1.0)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 4.0,
                fill: true,
                fillOpacity: 1,
                fillColor: 'rgba(88,151,202,1.0)',
                interactive: true,
            }
        }
        map.createPane('pane_QuartiersSchaerbeek_1');
        map.getPane('pane_QuartiersSchaerbeek_1').style.zIndex = 401;
        map.getPane('pane_QuartiersSchaerbeek_1').style['mix-blend-mode'] = 'normal';
        var layer_QuartiersSchaerbeek_1 = new L.geoJson(json_QuartiersSchaerbeek_1, {
            attribution: '',
            interactive: true,
            dataVar: 'json_QuartiersSchaerbeek_1',
            layerName: 'layer_QuartiersSchaerbeek_1',
            pane: 'pane_QuartiersSchaerbeek_1',
            onEachFeature: pop_QuartiersSchaerbeek_1,
            style: style_QuartiersSchaerbeek_1_0,
        });
        bounds_group.addLayer(layer_QuartiersSchaerbeek_1);
        map.addLayer(layer_QuartiersSchaerbeek_1);
        /* =============================================================
           COUCHE : Limites Schaerbeek
           Périmètre administratif de la commune
           ============================================================= */
        function pop_LimitesSchaerbeek_2(feature, layer) {
            var content = '<b>Limites de Schaerbeek</b>';
			layer.bindPopup(content, { maxHeight: 400, maxWidth: 240 });
        }

        function style_LimitesSchaerbeek_2_0() {
            return {
                pane: 'pane_LimitesSchaerbeek_2',
                opacity: 1,
                color: 'rgba(100,100,100,1.0)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 2.0,
                fill: true,
                fillOpacity: 1,
                fillColor: 'rgba(100,100,100,1.0)',
                interactive: true,
            }
        }
        map.createPane('pane_LimitesSchaerbeek_2');
        map.getPane('pane_LimitesSchaerbeek_2').style.zIndex = 402;
        map.getPane('pane_LimitesSchaerbeek_2').style['mix-blend-mode'] = 'normal';
        var layer_LimitesSchaerbeek_2 = new L.geoJson(json_LimitesSchaerbeek_2, {
            attribution: '',
            interactive: true,
            dataVar: 'json_LimitesSchaerbeek_2',
            layerName: 'layer_LimitesSchaerbeek_2',
            pane: 'pane_LimitesSchaerbeek_2',
            onEachFeature: pop_LimitesSchaerbeek_2,
            style: style_LimitesSchaerbeek_2_0,
        });
        bounds_group.addLayer(layer_LimitesSchaerbeek_2);
        map.addLayer(layer_LimitesSchaerbeek_2);
        /* =============================================================
           COUCHE : Demandes Cycloparking — Par Îlot urbain
           Agrégation des demandes par îlot (BlockParcel)
           Données : DemandesCycloparking_BlockParcel_3.js
           ============================================================= */
        function pop_DemandesCycloparking_BlockParcel_3(feature, layer) {
            var popupContent = '<table>\
                    <tr><th colspan="2" style="text-align:left; font-size:13px; padding-bottom:4px;">Type de demande :</th></tr>\
                    <tr>\
                        <th scope="row">îlot</th>\
                        <td class="visible-with-data" id="BlockParcel">' + (feature.properties['BlockParcel'] !== null ? autolinker.link(String(feature.properties['BlockParcel']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">quartier</th>\
                        <td class="visible-with-data" id="Quartier">' + (feature.properties['Quartier'] !== null ? autolinker.link(String(feature.properties['Quartier']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">homeClassic</th>\
                        <td class="visible-with-data" id="BlockParcel_homeClassic">' + (feature.properties['BlockParcel_homeClassic'] !== null ? autolinker.link(String(feature.properties['BlockParcel_homeClassic']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">otherClassic</th>\
                        <td class="visible-with-data" id="BlockParcel_otherClassic">' + (feature.properties['BlockParcel_otherClassic'] !== null ? autolinker.link(String(feature.properties['BlockParcel_otherClassic']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">poiClassic</th>\
                        <td class="visible-with-data" id="BlockParcel_poiClassic">' + (feature.properties['BlockParcel_poiClassic'] !== null ? autolinker.link(String(feature.properties['BlockParcel_poiClassic']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">homeCargo</th>\
                        <td class="visible-with-data" id="BlockParcel_homeCargo">' + (feature.properties['BlockParcel_homeCargo'] !== null ? autolinker.link(String(feature.properties['BlockParcel_homeCargo']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">poiCargo</th>\
                        <td class="visible-with-data" id="BlockParcel_poiCargo">' + (feature.properties['BlockParcel_poiCargo'] !== null ? autolinker.link(String(feature.properties['BlockParcel_poiCargo']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">Total</th>\
                        <td class="visible-with-data" id="BlockParcel_total_demande">' + (feature.properties['BlockParcel_total_demande'] !== null ? autolinker.link(String(feature.properties['BlockParcel_total_demande']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                </table>';
            var content = removeEmptyRowsFromPopupContent(popupContent, feature);
			layer.on('popupopen', function(e) {
				addClassToPopupIfMedia(content, e.popup);
			});
			layer.bindPopup(content, { maxHeight: 400, maxWidth: 220 });
        }

        function style_DemandesCycloparking_BlockParcel_3_0(feature) {
            if (feature.properties['BlockParcel_total_demande'] >= 0.000000 && feature.properties['BlockParcel_total_demande'] <= 5.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_BlockParcel_3',
                opacity: 1,
                color: 'rgba(35,35,35,1.0)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(232,243,233,1.0)',
                interactive: true,
            }
            }
            if (feature.properties['BlockParcel_total_demande'] >= 5.000000 && feature.properties['BlockParcel_total_demande'] <= 20.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_BlockParcel_3',
                opacity: 1,
                color: 'rgba(35,35,35,1.0)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(179,235,184,1.0)',
                interactive: true,
            }
            }
            if (feature.properties['BlockParcel_total_demande'] >= 20.000000 && feature.properties['BlockParcel_total_demande'] <= 30.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_BlockParcel_3',
                opacity: 1,
                color: 'rgba(35,35,35,1.0)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(20,209,39,1.0)',
                interactive: true,
            }
            }
        }
        map.createPane('pane_DemandesCycloparking_BlockParcel_3');
        map.getPane('pane_DemandesCycloparking_BlockParcel_3').style.zIndex = 403;
        map.getPane('pane_DemandesCycloparking_BlockParcel_3').style['mix-blend-mode'] = 'normal';
        var layer_DemandesCycloparking_BlockParcel_3 = new L.geoJson(json_DemandesCycloparking_BlockParcel_3, {
            attribution: '',
            interactive: true,
            dataVar: 'json_DemandesCycloparking_BlockParcel_3',
            layerName: 'layer_DemandesCycloparking_BlockParcel_3',
            pane: 'pane_DemandesCycloparking_BlockParcel_3',
            onEachFeature: pop_DemandesCycloparking_BlockParcel_3,
            style: style_DemandesCycloparking_BlockParcel_3_0,
        });
        bounds_group.addLayer(layer_DemandesCycloparking_BlockParcel_3);
        map.addLayer(layer_DemandesCycloparking_BlockParcel_3);
        /* =============================================================
           COUCHE : Demandes Cycloparking — Par Quartiers
           Agrégation des demandes par quartier administratif
           Données : DemandesCycloparking_Quartiers_4.js
           ============================================================= */
        function pop_DemandesCycloparking_Quartiers_4(feature, layer) {
            var popupContent = '<table>\
                    <tr><th colspan="2" style="text-align:left; font-size:13px; padding-bottom:4px;">Type de demande :</th></tr>\
                    <tr>\
                        <th scope="row">quartier</th>\
                        <td class="visible-with-data" id="SectorName">' + (feature.properties['SectorName'] !== null ? autolinker.link(String(feature.properties['SectorName']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">homeClassic</th>\
                        <td class="visible-with-data" id="Quartier_homeClassic">' + (feature.properties['Quartier_homeClassic'] !== null ? autolinker.link(String(feature.properties['Quartier_homeClassic']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">otherClassic</th>\
                        <td class="visible-with-data" id="Quartier_otherClassic">' + (feature.properties['Quartier_otherClassic'] !== null ? autolinker.link(String(feature.properties['Quartier_otherClassic']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">poiClassic</th>\
                        <td class="visible-with-data" id="Quartier_poiClassic">' + (feature.properties['Quartier_poiClassic'] !== null ? autolinker.link(String(feature.properties['Quartier_poiClassic']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">homeCargo</th>\
                        <td class="visible-with-data" id="Quartier_homeCargo">' + (feature.properties['Quartier_homeCargo'] !== null ? autolinker.link(String(feature.properties['Quartier_homeCargo']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">poiCargo</th>\
                        <td class="visible-with-data" id="Quartier_poiCargo">' + (feature.properties['Quartier_poiCargo'] !== null ? autolinker.link(String(feature.properties['Quartier_poiCargo']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">Total</th>\
                        <td class="visible-with-data" id="Quartier_total_demande">' + (feature.properties['Quartier_total_demande'] !== null ? autolinker.link(String(feature.properties['Quartier_total_demande']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                </table>';
            var content = removeEmptyRowsFromPopupContent(popupContent, feature);
			layer.on('popupopen', function(e) {
				addClassToPopupIfMedia(content, e.popup);
			});
			layer.bindPopup(content, { maxHeight: 400, maxWidth: 220 });
        }

        function style_DemandesCycloparking_Quartiers_4_0(feature) {
            if (feature.properties['Quartier_total_demande'] >= 0.000000 && feature.properties['Quartier_total_demande'] <= 5.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_Quartiers_4',
                opacity: 1,
                color: 'rgba(35,35,35,0.5)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(255,255,255,0.5)',
                interactive: true,
            }
            }
            if (feature.properties['Quartier_total_demande'] >= 5.000000 && feature.properties['Quartier_total_demande'] <= 30.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_Quartiers_4',
                opacity: 1,
                color: 'rgba(35,35,35,0.5)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(255,204,204,0.5)',
                interactive: true,
            }
            }
            if (feature.properties['Quartier_total_demande'] >= 30.000000 && feature.properties['Quartier_total_demande'] <= 100.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_Quartiers_4',
                opacity: 1,
                color: 'rgba(35,35,35,0.5)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(255,153,153,0.5)',
                interactive: true,
            }
            }
            if (feature.properties['Quartier_total_demande'] >= 100.000000 && feature.properties['Quartier_total_demande'] <= 200.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_Quartiers_4',
                opacity: 1,
                color: 'rgba(35,35,35,0.5)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(255,102,102,0.5)',
                interactive: true,
            }
            }
            if (feature.properties['Quartier_total_demande'] >= 200.000000 && feature.properties['Quartier_total_demande'] <= 400.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_Quartiers_4',
                opacity: 1,
                color: 'rgba(35,35,35,0.5)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(255,51,51,0.5)',
                interactive: true,
            }
            }
            if (feature.properties['Quartier_total_demande'] >= 400.000000 && feature.properties['Quartier_total_demande'] <= 600.000000 ) {
                return {
                pane: 'pane_DemandesCycloparking_Quartiers_4',
                opacity: 1,
                color: 'rgba(35,35,35,0.5)',
                dashArray: '',
                lineCap: 'butt',
                lineJoin: 'miter',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.55,
                fillColor: 'rgba(255,0,0,0.5)',
                interactive: true,
            }
            }
        }
        map.createPane('pane_DemandesCycloparking_Quartiers_4');
        map.getPane('pane_DemandesCycloparking_Quartiers_4').style.zIndex = 404;
        map.getPane('pane_DemandesCycloparking_Quartiers_4').style['mix-blend-mode'] = 'normal';
        var layer_DemandesCycloparking_Quartiers_4 = new L.geoJson(json_DemandesCycloparking_Quartiers_4, {
            attribution: '',
            interactive: true,
            dataVar: 'json_DemandesCycloparking_Quartiers_4',
            layerName: 'layer_DemandesCycloparking_Quartiers_4',
            pane: 'pane_DemandesCycloparking_Quartiers_4',
            onEachFeature: pop_DemandesCycloparking_Quartiers_4,
            style: style_DemandesCycloparking_Quartiers_4_0,
        });
        bounds_group.addLayer(layer_DemandesCycloparking_Quartiers_4);
        /* =============================================================
           COUCHE : Cycloparking
           Parkings vélo sécurisés (cabines, boxes fermés)
           Données : cycloparking_opendata_20260611112407.js
           ============================================================= */
        function pop_Cycloparking_5(feature, layer) {
            var popupContent = '<table>\
                    <tr>\
                        <th scope="row">nom</th>\
                        <td class="visible-with-data" id="name">' + (feature.properties['name'] !== null ? autolinker.link(String(feature.properties['name']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">type</th>\
                        <td class="visible-with-data" id="type_fr">' + (feature.properties['type_fr'] !== null ? autolinker.link(String(feature.properties['type_fr']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">capacite velo classic</th>\
                        <td class="visible-with-data" id="capacity_classic">' + (feature.properties['capacity_classic'] !== null ? autolinker.link(String(feature.properties['capacity_classic']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">capacite velo cargo</th>\
                        <td class="visible-with-data" id="capacity_cargo">' + (feature.properties['capacity_cargo'] !== null ? autolinker.link(String(feature.properties['capacity_cargo']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">status</th>\
                        <td class="visible-with-data" id="statut_fr">' + (feature.properties['statut_fr'] !== null ? autolinker.link(String(feature.properties['statut_fr']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">adresse</th>\
                        <td>' + ((feature.properties['RueFR'] !== null && feature.properties['NumeroMaison'] !== null) ? autolinker.link((String(feature.properties['RueFR']) + ' ' + String(feature.properties['NumeroMaison'])).replace(/'/g, '\'')) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">quartier</th>\
                        <td class="visible-with-data" id="Quartier">' + (feature.properties['Quartier'] !== null ? autolinker.link(String(feature.properties['Quartier']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">localite</th>\
                        <td>1030 Schaerbeek</td>\
                    </tr>\
                </table>';
            var content = removeEmptyRowsFromPopupContent(popupContent, feature);
			layer.on('popupopen', function(e) {
				addClassToPopupIfMedia(content, e.popup);
			});
			layer.bindPopup(content, { maxHeight: 400 });
        }

        map.createPane('pane_Cycloparking_5');
        map.getPane('pane_Cycloparking_5').style.zIndex = 405;
        map.getPane('pane_Cycloparking_5').style['mix-blend-mode'] = 'normal';
        // Génère une icône de cluster animée (anneaux pulsants) avec couleur configurable
        function createPulseClusterIcon(count, bgColor, textColor) {
            return L.divIcon({
                html: '<div class="pulse-cluster" style="--clr:' + bgColor + ';--txt:' + textColor + '">' +
                      '<div class="pulse-ring r1"></div>' +
                      '<div class="pulse-ring r2"></div>' +
                      '<div class="cluster-inner">' + count + '</div>' +
                      '</div>',
                className: '',
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            });
        }
        var icon_Cycloparking = L.icon({
            iconUrl: 'markers/Cycloparking.png',
            iconSize: [26, 32],
            iconAnchor: [13, 32],
            popupAnchor: [0, -32]
        });
        var layer_Cycloparking_5 = new L.geoJson(json_Cycloparking_5, {
            attribution: '',
            interactive: true,
            dataVar: 'json_Cycloparking_5',
            layerName: 'layer_Cycloparking_5',
            pane: 'pane_Cycloparking_5',
            onEachFeature: pop_Cycloparking_5,
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: icon_Cycloparking});
            },
        });
        var cluster_Cycloparking_5 = new L.MarkerClusterGroup({
            showCoverageOnHover: false, spiderfyDistanceMultiplier: 2,
            iconCreateFunction: function(cluster) {
                return createPulseClusterIcon(cluster.getChildCount(), '#9D00D6', '#fff');
            }
        });
        cluster_Cycloparking_5.addLayer(layer_Cycloparking_5);
        bounds_group.addLayer(layer_Cycloparking_5);
        cluster_Cycloparking_5.addTo(map);
        /* =============================================================
           COUCHES : Parkings Velo — Arceau isolé / Box vélo / Groupe d'arceaux
           Source commune : cycloparking_mobility_20260611124740.js
           Séparées en 3 layers via filtre sur le champ type_fr
           Icônes pulsantes (MarkerCluster) avec couleur propre à chaque type
           ============================================================= */
        function pop_ServicesVello_6(feature, layer) {
            var popupContent = '<table>\
                    <tr><th scope="row">type</th><td class="visible-with-data" id="type_fr">' + (feature.properties['type_fr'] !== null ? autolinker.link(String(feature.properties['type_fr']).replace(/'/g, '\'').toLocaleString()) : '') + '</td></tr>\
                    <tr><th scope="row">operator</th><td class="visible-with-data" id="operator_fr">' + (feature.properties['operator_fr'] !== null ? autolinker.link(String(feature.properties['operator_fr']).replace(/'/g, '\'').toLocaleString()) : '') + '</td></tr>\
                    <tr><th scope="row">status</th><td class="visible-with-data" id="state_fr">' + (feature.properties['state_fr'] !== null ? autolinker.link(String(feature.properties['state_fr']).replace(/'/g, '\'').toLocaleString()) : '') + '</td></tr>\
                    <tr><th scope="row">situation</th><td class="visible-with-data" id="situation_fr">' + (feature.properties['situation_fr'] !== null ? autolinker.link(String(feature.properties['situation_fr']).replace(/'/g, '\'').toLocaleString()) : '') + '</td></tr>\
                    <tr><th scope="row">capacite de velos</th><td class="visible-with-data" id="capacity">' + (feature.properties['capacity'] !== null ? autolinker.link(String(feature.properties['capacity']).replace(/'/g, '\'').toLocaleString()) : '') + '</td></tr>\
                    <tr><th scope="row">adresse</th><td>' + ((feature.properties['RueFR'] !== null && feature.properties['NumeroMaison'] !== null) ? autolinker.link((String(feature.properties['RueFR']) + ' ' + String(feature.properties['NumeroMaison'])).replace(/'/g, '\'')) : '') + '</td></tr>\
                    <tr><th scope="row">quartier</th><td class="visible-with-data" id="Quartier">' + (feature.properties['Quartier'] !== null ? autolinker.link(String(feature.properties['Quartier']).replace(/'/g, '\'').toLocaleString()) : '') + '</td></tr>\
                    <tr><th scope="row">localite</th><td>1030 Schaerbeek</td></tr>\
                </table>';
            var content = removeEmptyRowsFromPopupContent(popupContent, feature);
			layer.on('popupopen', function(e) {
				addClassToPopupIfMedia(content, e.popup);
			});
			layer.bindPopup(content, { maxHeight: 400 });
        }

        map.createPane('pane_ServicesVello_6');
        map.getPane('pane_ServicesVello_6').style.zIndex = 406;
        map.getPane('pane_ServicesVello_6').style['mix-blend-mode'] = 'normal';
        var icon_ArceauIsole = L.icon({
            iconUrl: 'markers/ArceauIsole.png',
            iconSize: [26, 32],
            iconAnchor: [13, 32],
            popupAnchor: [0, -32]
        });
        var layer_ArceauIsole = new L.geoJson(json_ServicesVello_6, {
            attribution: '',
            interactive: true,
            pane: 'pane_ServicesVello_6',
            onEachFeature: pop_ServicesVello_6,
            filter: function(feature) { return feature.properties['type_fr'] === 'Arceau isolé'; },
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: icon_ArceauIsole});
            },
        });
        var cluster_ArceauIsole = new L.MarkerClusterGroup({
            showCoverageOnHover: false, spiderfyDistanceMultiplier: 2,
            iconCreateFunction: function(cluster) {
                return createPulseClusterIcon(cluster.getChildCount(), '#E15989', '#fff');
            }
        });
        cluster_ArceauIsole.addLayer(layer_ArceauIsole);
        bounds_group.addLayer(layer_ArceauIsole);
        cluster_ArceauIsole.addTo(map);

        var icon_BoxVelo = L.icon({
            iconUrl: 'markers/BoxVelo.png',
            iconSize: [26, 32],
            iconAnchor: [13, 32],
            popupAnchor: [0, -32]
        });
        var layer_BoxVelo = new L.geoJson(json_ServicesVello_6, {
            attribution: '',
            interactive: true,
            pane: 'pane_ServicesVello_6',
            onEachFeature: pop_ServicesVello_6,
            filter: function(feature) { return feature.properties['type_fr'] === 'Box vélo'; },
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: icon_BoxVelo});
            },
        });
        var cluster_BoxVelo = new L.MarkerClusterGroup({
            showCoverageOnHover: false, spiderfyDistanceMultiplier: 2,
            iconCreateFunction: function(cluster) {
                return createPulseClusterIcon(cluster.getChildCount(), '#DC59E1', '#fff');
            }
        });
        cluster_BoxVelo.addLayer(layer_BoxVelo);
        bounds_group.addLayer(layer_BoxVelo);
        cluster_BoxVelo.addTo(map);

        var icon_GroupeArceaux = L.icon({
            iconUrl: 'markers/GroupeArceaux.png',
            iconSize: [26, 32],
            iconAnchor: [13, 32],
            popupAnchor: [0, -32]
        });
        var layer_GroupeArceaux = new L.geoJson(json_ServicesVello_6, {
            attribution: '',
            interactive: true,
            pane: 'pane_ServicesVello_6',
            onEachFeature: pop_ServicesVello_6,
            filter: function(feature) { return feature.properties['type_fr'] === "Groupe d'arceaux"; },
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: icon_GroupeArceaux});
            },
        });
        var cluster_GroupeArceaux = new L.MarkerClusterGroup({
            showCoverageOnHover: false, spiderfyDistanceMultiplier: 2,
            iconCreateFunction: function(cluster) {
                return createPulseClusterIcon(cluster.getChildCount(), '#DCD746', '#333');
            }
        });
        cluster_GroupeArceaux.addLayer(layer_GroupeArceaux);
        bounds_group.addLayer(layer_GroupeArceaux);
        cluster_GroupeArceaux.addTo(map);
        /* =============================================================
           COUCHE : Demandes individuelles — Points bruts
           Chaque demande de cycloparking représentée par un cercle de 2px
           Données : requests_cycloparking1030_0512026.js
           ============================================================= */
        function pop_RequestsCycloparking_7(feature, layer) {
            var p = feature.properties;
            var dateRaw = p['demande_requestdate'] ? String(p['demande_requestdate']).substring(0, 10).split('-') : null;
            var dateFmt = dateRaw ? dateRaw[2] + '/' + dateRaw[1] + '/' + dateRaw[0] : '';
            var adresse = (p['adresses_rue_fr'] !== null && p['adresses_numero'] !== null)
                ? String(p['adresses_rue_fr']) + ' ' + String(p['adresses_numero']) : '';
            var popupContent = '<table>\
                    <tr><th colspan="2" style="text-align:left; font-size:13px; padding-bottom:4px;">Demandes individuelles :</th></tr>\
                    <tr>\
                        <th scope="row">code id</th>\
                        <td>' + (p['demande_id'] !== null ? String(p['demande_id']) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">type</th>\
                        <td class="visible-with-data" id="demande_type">' + (p['demande_type'] !== null ? autolinker.link(String(p['demande_type']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">date</th>\
                        <td>' + dateFmt + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">adresse</th>\
                        <td>' + autolinker.link(adresse.replace(/'/g, '\'')) + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">quartier</th>\
                        <td class="visible-with-data" id="adresses_quartier">' + (p['adresses_quartier'] !== null ? autolinker.link(String(p['adresses_quartier']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                    <tr>\
                        <th scope="row">îlot</th>\
                        <td class="visible-with-data" id="adresses_blockparcel">' + (p['adresses_blockparcel'] !== null ? autolinker.link(String(p['adresses_blockparcel']).replace(/'/g, '\'').toLocaleString()) : '') + '</td>\
                    </tr>\
                </table>';
            var content = removeEmptyRowsFromPopupContent(popupContent, feature);
            layer.on('popupopen', function(e) {
                addClassToPopupIfMedia(content, e.popup);
            });
            layer.bindPopup(content, { maxHeight: 400 });
        }

        map.createPane('pane_RequestsCycloparking_7');
        map.getPane('pane_RequestsCycloparking_7').style.zIndex = 407;
        map.getPane('pane_RequestsCycloparking_7').style['mix-blend-mode'] = 'normal';
        var layer_RequestsCycloparking_7 = new L.geoJson(json_Request_Cycloparquinq, {
            attribution: '',
            interactive: true,
            dataVar: 'json_Request_Cycloparquinq',
            layerName: 'layer_RequestsCycloparking_7',
            pane: 'pane_RequestsCycloparking_7',
            onEachFeature: pop_RequestsCycloparking_7,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    pane: 'pane_RequestsCycloparking_7',
                    radius: 2,
                    fillColor: '#00129A',
                    color: '#00109A',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                });
            },
        });
        bounds_group.addLayer(layer_RequestsCycloparking_7);
        /* =============================================================
           CONTROLE DE RECHERCHE (Photon / Nominatim OSM)
           Barre de recherche d'adresse intégrée dans la carte
           ============================================================= */
        const url = {"Nominatim OSM": "https://nominatim.openstreetmap.org/search?format=geojson&addressdetails=1&"};
        var photonControl = L.control.photon({
            url: url["Nominatim OSM"],
            feedbackLabel: '',
            position: 'topleft',
            includePosition: true,
            initial: true,
        }).addTo(map);
        photonControl._container.childNodes[0].style.borderRadius="10px"
        var x = null;
        var z = null;
        photonControl.on('selected', function(e) {
            console.log(photonControl.search.resultsContainer);
            if (x != null) {
                map.removeLayer(obj3.marker);
                map.removeLayer(x);
            }
            obj2.gcd = e.choice;
            x = L.geoJSON(obj2.gcd).addTo(map);
            var label = typeof obj2.gcd.properties.label === 'undefined' ? obj2.gcd.properties.display_name : obj2.gcd.properties.label;
            obj3.marker = L.marker(x.getLayers()[0].getLatLng()).bindPopup(label).addTo(map);
            map.setView(x.getLayers()[0].getLatLng(), 17);
            z = typeof e.choice.properties.label === 'undefined'? e.choice.properties.display_name : e.choice.properties.label;
            console.log(e);
            e.target.input.value = z;
        });
        var search = document.getElementsByClassName("leaflet-photon leaflet-control")[0];
        search.classList.add("leaflet-control-search")
        search.style.display = "flex";
        search.style.backgroundColor="rgba(255,255,255,0.5)"

        var button = document.createElement("div");
        button.id = "gcd-button-control";
        button.className = "gcd-gl-btn fa fa-search search-button";
        search.insertBefore(button, search.firstChild);
        last = search.lastChild;
        last.style.display = "none";
        button.addEventListener("click", function (e) {
            if (last.style.display === "none") {
                last.style.display = "block";
            } else {
                last.style.display = "none";
            }
        });
        /* =============================================================
           MENU DES COUCHES (Layer Control Tree)
           Structure : Parkings Velo 1030 / Demandes Cycloparking /
                       Schaerbeek / Fonds de carte
           ============================================================= */
        var overlaysTree = [
            {label: '<b>Parkings Velo 1030</b>', selectAllCheckbox: true, children: [
            {label: '<img src="legend/ArceauIsole.png" /> Arceau isolé', layer: cluster_ArceauIsole},
            {label: '<img src="legend/BoxVelo.png" /> Box vélo', layer: cluster_BoxVelo},
            {label: '<img src="legend/GroupeArceaux.png" /> Groupe d\'arceaux', layer: cluster_GroupeArceaux},
            {label: '<img src="legend/Cycloparking.png" /> Cycloparking', layer: cluster_Cycloparking_5},]},
        {label: '<input type="checkbox" id="cb-demandes" checked onclick="handleCbDemandes(event, this)"> <b>Demandes Cycloparking</b>', children: [
            {label: '<svg width="12" height="12" style="vertical-align:middle;margin-right:4px;"><circle cx="6" cy="6" r="4" fill="#00129A" stroke="#00109A" stroke-width="1"/></svg> Demandes individuelles', layer: layer_RequestsCycloparking_7},
            {label: 'Par Quartiers<br /><table><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_Quartiers_4_050.png" /></td><td>0 - 5</td></tr><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_Quartiers_4_5301.png" /></td><td>5 - 30</td></tr><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_Quartiers_4_301002.png" /></td><td>30 - 100</td></tr><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_Quartiers_4_1002003.png" /></td><td>100 - 200</td></tr><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_Quartiers_4_2004004.png" /></td><td>200 - 400</td></tr><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_Quartiers_4_4006005.png" /></td><td>400 - 600</td></tr></table>', radioGroup: 'demandes', layer: layer_DemandesCycloparking_Quartiers_4},
            {label: 'Par Îlot urbain<br /><table><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_BlockParcel_3_050.png" /></td><td>0 - 5</td></tr><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_BlockParcel_3_5201.png" /></td><td>5 - 20</td></tr><tr><td style="text-align: center;"><img src="legend/DemandesCycloparking_BlockParcel_3_20302.png" /></td><td>20 - 30</td></tr></table>', radioGroup: 'demandes', layer: layer_DemandesCycloparking_BlockParcel_3},]},
        {label: '<b>Schaerbeek</b>',  selectAllCheckbox: true, children: [
            {label: '<img src="legend/LimitesSchaerbeek_2.png" /> Limites Schaerbeek', layer: layer_LimitesSchaerbeek_2},
            {label: '<img src="legend/QuartiersSchaerbeek_1.png" /> Quartiers Schaerbeek', layer: layer_QuartiersSchaerbeek_1},]},
        {label: "Google Terrain",   layer: layer_GoogleTerrain_0,   radioGroup: 'bm'},
        {label: "Google Satellite", layer: layer_GoogleSatellite_0, radioGroup: 'bm'},
        {label: "OpenStreet Map",   layer: layer_OpenStreetMap_0,   radioGroup: 'bm'},]
        var lay = L.control.layers.tree(null, overlaysTree, {
            collapsed: false,
        });
        lay.addTo(map);
        /* =============================================================
           LOGIQUE CHECKBOX — Demandes Cycloparking
           La checkbox parente active/désactive les deux sous-couches.
           Les radio buttons garantissent qu'une seule sous-couche
           est visible à la fois (Par Quartiers OU Par Îlot urbain).
           ============================================================= */
        var _lastDemandesLayer = layer_DemandesCycloparking_BlockParcel_3;
        var _requestsWasVisible = false;
        map.on('layeradd', function(e) {
            if (e.layer === layer_DemandesCycloparking_Quartiers_4 || e.layer === layer_DemandesCycloparking_BlockParcel_3) {
                _lastDemandesLayer = e.layer;
                var cb = document.getElementById('cb-demandes');
                if (cb && !cb.checked) cb.checked = true;
            }
            if (e.layer === layer_RequestsCycloparking_7) {
                var cb = document.getElementById('cb-demandes');
                if (cb && !cb.checked) cb.checked = true;
            }
        });
        map.on('layerremove', function(e) {
            if (e.layer === layer_DemandesCycloparking_Quartiers_4 || e.layer === layer_DemandesCycloparking_BlockParcel_3 || e.layer === layer_RequestsCycloparking_7) {
                setTimeout(function() {
                    if (!map.hasLayer(layer_DemandesCycloparking_Quartiers_4) && !map.hasLayer(layer_DemandesCycloparking_BlockParcel_3) && !map.hasLayer(layer_RequestsCycloparking_7)) {
                        var cb = document.getElementById('cb-demandes');
                        if (cb) cb.checked = false;
                    }
                }, 0);
            }
        });
        function handleCbDemandes(event, cb) {
            event.stopPropagation();
            if (cb.checked) {
                map.addLayer(_lastDemandesLayer);
                if (_requestsWasVisible) map.addLayer(layer_RequestsCycloparking_7);
            } else {
                _requestsWasVisible = map.hasLayer(layer_RequestsCycloparking_7);
                map.removeLayer(layer_DemandesCycloparking_Quartiers_4);
                map.removeLayer(layer_DemandesCycloparking_BlockParcel_3);
                map.removeLayer(layer_RequestsCycloparking_7);
            }
        }
        /* =============================================================
           FILTRE PAR QUARTIER
           Menu déroulant (topleft) pour filtrer toutes les couches
           ============================================================= */
        var _initialView = { center: [50.8619, 4.3932], zoom: 14 };
        var _savedLayerState = null;
        var _currentPeriod = '';
        var _periodFilterContainer = null;
        var _currentType = '';
        var _typeFilterContainer = null;

        var _quartierNames = [];
        json_QuartiersSchaerbeek_1.features.forEach(function(f) {
            if (f.properties['SectorName']) _quartierNames.push(f.properties['SectorName']);
        });
        _quartierNames.sort();

        function yearInPeriod(dateStr, period) {
            if (!period) return true;
            var year = parseInt((dateStr || '').substring(0, 4), 10);
            if (period === '2017-2021') return year >= 2017 && year <= 2021;
            if (period === '2022-2024') return year >= 2022 && year <= 2024;
            if (period === '2025-2026') return year >= 2025 && year <= 2026;
            return true;
        }

        L.Control.MainButtons = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function(map) {
                var div = L.DomUtil.create('div', 'quartier-filter-control');
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);

                var btn = document.createElement('button');
                btn.id = 'reinitialiser-btn';
                btn.textContent = 'Réinitialiser';
                btn.addEventListener('click', function() {
                    // Filtre quartier → tout afficher
                    _savedLayerState = null;
                    var sel = document.getElementById('quartier-filter-select');
                    if (sel) sel.value = '';
                    _currentPeriod = '';
                    var psel = document.getElementById('period-filter-select');
                    if (psel) psel.value = '';
                    _currentType = '';
                    var tsel = document.getElementById('type-filter-select');
                    if (tsel) tsel.value = '';
                    applyQuartierFilter('');

                    // Demandes Cycloparking → Par Îlot urbain actif, les autres désactivés
                    if (map.hasLayer(layer_DemandesCycloparking_Quartiers_4))
                        map.removeLayer(layer_DemandesCycloparking_Quartiers_4);
                    if (map.hasLayer(layer_RequestsCycloparking_7))
                        map.removeLayer(layer_RequestsCycloparking_7);
                    if (!map.hasLayer(layer_DemandesCycloparking_BlockParcel_3))
                        map.addLayer(layer_DemandesCycloparking_BlockParcel_3);
                    _lastDemandesLayer = layer_DemandesCycloparking_BlockParcel_3;
                    var cb = document.getElementById('cb-demandes');
                    if (cb) cb.checked = true;

                    // Parkings Velo 1030 → tous actifs
                    if (!map.hasLayer(cluster_Cycloparking_5))   map.addLayer(cluster_Cycloparking_5);
                    if (!map.hasLayer(cluster_ArceauIsole))       map.addLayer(cluster_ArceauIsole);
                    if (!map.hasLayer(cluster_BoxVelo))           map.addLayer(cluster_BoxVelo);
                    if (!map.hasLayer(cluster_GroupeArceaux))     map.addLayer(cluster_GroupeArceaux);

                    // Schaerbeek → actif
                    if (!map.hasLayer(layer_QuartiersSchaerbeek_1)) map.addLayer(layer_QuartiersSchaerbeek_1);
                    if (!map.hasLayer(layer_LimitesSchaerbeek_2))   map.addLayer(layer_LimitesSchaerbeek_2);

                    // Fond de carte → Google Terrain
                    if (!map.hasLayer(layer_GoogleTerrain_0))    map.addLayer(layer_GoogleTerrain_0);
                    if (map.hasLayer(layer_GoogleSatellite_0))   map.removeLayer(layer_GoogleSatellite_0);
                    if (map.hasLayer(layer_OpenStreetMap_0))     map.removeLayer(layer_OpenStreetMap_0);

                    // Vue initiale
                    map.setView(_initialView.center, _initialView.zoom);
                });
                div.appendChild(btn);

                var link = document.createElement('a');
                link.href = 'cycloparkin1030_demandes.html';
                link.textContent = 'Tableau de bord';
                link.style.cssText = 'display:block;margin-top:4px;padding:3px 6px;background:#113a6b;color:#fff;border-radius:3px;font-size:12px;text-align:center;text-decoration:none;';
                link.addEventListener('mouseover', function() { this.style.background = '#1a5599'; });
                link.addEventListener('mouseout',  function() { this.style.background = '#113a6b'; });
                div.appendChild(link);
                return div;
            }
        });
        new L.Control.MainButtons().addTo(map);

        L.Control.QuartierFilter = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function(map) {
                var div = L.DomUtil.create('div', 'quartier-filter-control');
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);

                var sel = document.createElement('select');
                sel.id = 'quartier-filter-select';
                var opt0 = document.createElement('option');
                opt0.value = '';
                opt0.text = '— tous les quartiers —';
                sel.appendChild(opt0);
                _quartierNames.forEach(function(q) {
                    var opt = document.createElement('option');
                    opt.value = q;
                    opt.text = q;
                    sel.appendChild(opt);
                });
                sel.addEventListener('change', function() {
                    applyQuartierFilter(this.value);
                });
                div.appendChild(sel);
                return div;
            }
        });
        new L.Control.QuartierFilter().addTo(map);

        /* =============================================================
           FILTRE PAR PÉRIODE
           Visible uniquement quand "Demandes individuelles" est actif
           ============================================================= */
        L.Control.PeriodFilter = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function(map) {
                var div = L.DomUtil.create('div', 'quartier-filter-control');
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);

                var label = document.createElement('div');
                label.style.cssText = 'font-size:11px;color:#666;margin-bottom:2px;';
                label.textContent = 'Période :';
                div.appendChild(label);

                var sel = document.createElement('select');
                sel.id = 'period-filter-select';
                [['', '— toutes les années —'],
                 ['2017-2021', '2017 – 2021'],
                 ['2022-2024', '2022 – 2024'],
                 ['2025-2026', '2025 – 2026']].forEach(function(item) {
                    var o = document.createElement('option');
                    o.value = item[0]; o.text = item[1];
                    sel.appendChild(o);
                });
                sel.addEventListener('change', function() {
                    _currentPeriod = this.value;
                    var qsel = document.getElementById('quartier-filter-select');
                    applyQuartierFilter(qsel ? qsel.value : '');
                });
                div.appendChild(sel);
                _periodFilterContainer = div;
                div.style.display = 'none';
                return div;
            }
        });
        new L.Control.PeriodFilter().addTo(map);

        /* =============================================================
           FILTRE PAR TYPE DE DEMANDE
           Visible uniquement quand "Demandes individuelles" est actif
           ============================================================= */
        L.Control.TypeFilter = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function(map) {
                var div = L.DomUtil.create('div', 'quartier-filter-control');
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);

                var label = document.createElement('div');
                label.style.cssText = 'font-size:11px;color:#666;margin-bottom:2px;';
                label.textContent = 'Type de demande :';
                div.appendChild(label);

                var sel = document.createElement('select');
                sel.id = 'type-filter-select';
                [['', '— tous les types —'],
                 ['homeClassic',  'homeClassic'],
                 ['otherClassic', 'otherClassic'],
                 ['poiClassic',   'poiClassic'],
                 ['homeCargo',    'homeCargo'],
                 ['poiCargo',     'poiCargo']].forEach(function(item) {
                    var o = document.createElement('option');
                    o.value = item[0]; o.text = item[1];
                    sel.appendChild(o);
                });
                sel.addEventListener('change', function() {
                    _currentType = this.value;
                    var qsel = document.getElementById('quartier-filter-select');
                    applyQuartierFilter(qsel ? qsel.value : '');
                });
                div.appendChild(sel);
                _typeFilterContainer = div;
                div.style.display = 'none';
                return div;
            }
        });
        new L.Control.TypeFilter().addTo(map);

        function updatePeriodFilterVisibility() {
            var visible = map.hasLayer(layer_RequestsCycloparking_7);
            if (_periodFilterContainer) _periodFilterContainer.style.display = visible ? '' : 'none';
            if (_typeFilterContainer)   _typeFilterContainer.style.display   = visible ? '' : 'none';
        }
        map.on('layeradd', function(e) {
            if (e.layer === layer_RequestsCycloparking_7) updatePeriodFilterVisibility();
        });
        map.on('layerremove', function(e) {
            if (e.layer === layer_RequestsCycloparking_7) updatePeriodFilterVisibility();
        });

        function applyQuartierFilter(q) {
            var all = (q === '');

            // Sauvegarde l'état de visibilité avant le premier filtrage
            if (!all && _savedLayerState === null) {
                _savedLayerState = {
                    BlockParcel:   map.hasLayer(layer_DemandesCycloparking_BlockParcel_3),
                    Quartiers4:    map.hasLayer(layer_DemandesCycloparking_Quartiers_4),
                    Requests7:     map.hasLayer(layer_RequestsCycloparking_7),
                    Cycloparking:  map.hasLayer(cluster_Cycloparking_5),
                    ArceauIsole:   map.hasLayer(cluster_ArceauIsole),
                    BoxVelo:       map.hasLayer(cluster_BoxVelo),
                    GroupeArceaux: map.hasLayer(cluster_GroupeArceaux),
                };
            }

            // Filtrage des données
            layer_DemandesCycloparking_BlockParcel_3.clearLayers();
            json_DemandesCycloparking_BlockParcel_3.features.forEach(function(f) {
                if (all || f.properties['Quartier'] === q)
                    layer_DemandesCycloparking_BlockParcel_3.addData(f);
            });

            layer_DemandesCycloparking_Quartiers_4.clearLayers();
            json_DemandesCycloparking_Quartiers_4.features.forEach(function(f) {
                if (all || f.properties['SectorName'] === q)
                    layer_DemandesCycloparking_Quartiers_4.addData(f);
            });

            layer_RequestsCycloparking_7.clearLayers();
            json_Request_Cycloparquinq.features.forEach(function(f) {
                if ((all || f.properties['adresses_quartier'] === q)
                        && yearInPeriod(f.properties['demande_requestdate'], _currentPeriod)
                        && (!_currentType || f.properties['demande_type'] === _currentType))
                    layer_RequestsCycloparking_7.addData(f);
            });

            cluster_Cycloparking_5.clearLayers();
            layer_Cycloparking_5.clearLayers();
            json_Cycloparking_5.features.forEach(function(f) {
                if (all || f.properties['Quartier'] === q)
                    layer_Cycloparking_5.addData(f);
            });
            cluster_Cycloparking_5.addLayer(layer_Cycloparking_5);

            cluster_ArceauIsole.clearLayers();
            layer_ArceauIsole.clearLayers();
            json_ServicesVello_6.features.forEach(function(f) {
                if ((all || f.properties['Quartier'] === q) && f.properties['type_fr'] === 'Arceau isolé')
                    layer_ArceauIsole.addData(f);
            });
            cluster_ArceauIsole.addLayer(layer_ArceauIsole);

            cluster_BoxVelo.clearLayers();
            layer_BoxVelo.clearLayers();
            json_ServicesVello_6.features.forEach(function(f) {
                if ((all || f.properties['Quartier'] === q) && f.properties['type_fr'] === 'Box vélo')
                    layer_BoxVelo.addData(f);
            });
            cluster_BoxVelo.addLayer(layer_BoxVelo);

            cluster_GroupeArceaux.clearLayers();
            layer_GroupeArceaux.clearLayers();
            json_ServicesVello_6.features.forEach(function(f) {
                if ((all || f.properties['Quartier'] === q) && f.properties['type_fr'] === "Groupe d'arceaux")
                    layer_GroupeArceaux.addData(f);
            });
            cluster_GroupeArceaux.addLayer(layer_GroupeArceaux);

            // Gestion active de la visibilité des couches
            if (all) {
                // Restaure l'état de visibilité d'avant le filtre
                if (_savedLayerState) {
                    var s = _savedLayerState;
                    if ( s.BlockParcel  && !map.hasLayer(layer_DemandesCycloparking_BlockParcel_3)) map.addLayer(layer_DemandesCycloparking_BlockParcel_3);
                    if (!s.BlockParcel  &&  map.hasLayer(layer_DemandesCycloparking_BlockParcel_3)) map.removeLayer(layer_DemandesCycloparking_BlockParcel_3);
                    if ( s.Quartiers4   && !map.hasLayer(layer_DemandesCycloparking_Quartiers_4))   map.addLayer(layer_DemandesCycloparking_Quartiers_4);
                    if (!s.Quartiers4   &&  map.hasLayer(layer_DemandesCycloparking_Quartiers_4))   map.removeLayer(layer_DemandesCycloparking_Quartiers_4);
                    if ( s.Requests7    && !map.hasLayer(layer_RequestsCycloparking_7))              map.addLayer(layer_RequestsCycloparking_7);
                    if (!s.Requests7    &&  map.hasLayer(layer_RequestsCycloparking_7))             map.removeLayer(layer_RequestsCycloparking_7);
                    if ( s.Cycloparking  && !map.hasLayer(cluster_Cycloparking_5))  map.addLayer(cluster_Cycloparking_5);
                    if (!s.Cycloparking  &&  map.hasLayer(cluster_Cycloparking_5))  map.removeLayer(cluster_Cycloparking_5);
                    if ( s.ArceauIsole   && !map.hasLayer(cluster_ArceauIsole))     map.addLayer(cluster_ArceauIsole);
                    if (!s.ArceauIsole   &&  map.hasLayer(cluster_ArceauIsole))     map.removeLayer(cluster_ArceauIsole);
                    if ( s.BoxVelo       && !map.hasLayer(cluster_BoxVelo))         map.addLayer(cluster_BoxVelo);
                    if (!s.BoxVelo       &&  map.hasLayer(cluster_BoxVelo))         map.removeLayer(cluster_BoxVelo);
                    if ( s.GroupeArceaux && !map.hasLayer(cluster_GroupeArceaux))   map.addLayer(cluster_GroupeArceaux);
                    if (!s.GroupeArceaux &&  map.hasLayer(cluster_GroupeArceaux))   map.removeLayer(cluster_GroupeArceaux);
                    _savedLayerState = null;
                }
            } else {
                // Active/désactive automatiquement selon le nombre de résultats
                var st = _savedLayerState;
                function autoToggle(layer, count, wasVisible) {
                    if (count > 0) { if (wasVisible && !map.hasLayer(layer)) map.addLayer(layer); }
                    else           { if (map.hasLayer(layer)) map.removeLayer(layer); }
                }
                function autoToggleCluster(cluster, geoJsonLayer, wasVisible) {
                    var count = geoJsonLayer.getLayers().length;
                    if (count > 0) { if (wasVisible && !map.hasLayer(cluster)) map.addLayer(cluster); }
                    else           { if (map.hasLayer(cluster)) map.removeLayer(cluster); }
                }
                autoToggle(layer_DemandesCycloparking_BlockParcel_3,
                           layer_DemandesCycloparking_BlockParcel_3.getLayers().length,
                           st ? st.BlockParcel  : true);
                autoToggle(layer_DemandesCycloparking_Quartiers_4,
                           layer_DemandesCycloparking_Quartiers_4.getLayers().length,
                           st ? st.Quartiers4   : false);
                autoToggle(layer_RequestsCycloparking_7,
                           layer_RequestsCycloparking_7.getLayers().length,
                           st ? st.Requests7    : false);
                autoToggleCluster(cluster_Cycloparking_5,  layer_Cycloparking_5,  st ? st.Cycloparking  : true);
                autoToggleCluster(cluster_ArceauIsole,     layer_ArceauIsole,     st ? st.ArceauIsole   : true);
                autoToggleCluster(cluster_BoxVelo,         layer_BoxVelo,         st ? st.BoxVelo        : true);
                autoToggleCluster(cluster_GroupeArceaux,   layer_GroupeArceaux,   st ? st.GroupeArceaux  : true);
            }

            resetLabels([layer_DemandesCycloparking_Quartiers_4]);
        }
        /* =============================================================
           EVENEMENTS CARTE ET RENDU DES ETIQUETTES
           ============================================================= */
		document.addEventListener("DOMContentLoaded", function() {
            function newLayersListHeight() {
                var layerScrollbarElement = document.querySelector('.leaflet-control-layers-scrollbar');
                if (layerScrollbarElement) {
                    var layersListElement = document.querySelector('.leaflet-control-layers-list');
                    var originalHeight = layersListElement.style.height
                        || window.getComputedStyle(layersListElement).height;
                    var newHeight = parseFloat(originalHeight) - 50;
                    layersListElement.style.height = newHeight + 'px';
                }
            }
            var isLayersListExpanded = true;
            var controlLayersElement = document.querySelector('.leaflet-control-layers');
            var toggleLayerControl = document.querySelector('.leaflet-control-layers-toggle');
            toggleLayerControl.addEventListener('click', function() {
                if (isLayersListExpanded) {
                    controlLayersElement.classList.remove('leaflet-control-layers-expanded');
                } else {
                    controlLayersElement.classList.add('leaflet-control-layers-expanded');
                }
                isLayersListExpanded = !isLayersListExpanded;
                newLayersListHeight()
            });
			if (controlLayersElement) {
				controlLayersElement.addEventListener('click', function(event) {
					var toggleLayerHeaderPointer = event.target.closest('.leaflet-layerstree-header-pointer span');
					if (toggleLayerHeaderPointer) {
						newLayersListHeight();
					}
				});
			}
            setTimeout(function() { toggleLayerControl.click(); }, 10);
            setTimeout(function() { toggleLayerControl.click(); }, 10);
            var isSmallScreen = window.innerWidth < 650;
            if (isSmallScreen) {
                setTimeout(function() {
                    controlLayersElement.classList.remove('leaflet-control-layers-expanded');
                    isLayersListExpanded = !isLayersListExpanded;
                }, 500);
            }
        });
        resetLabels([layer_DemandesCycloparking_Quartiers_4]);
        map.on("zoomend", function(){
            resetLabels([layer_DemandesCycloparking_Quartiers_4]);
        });
        map.on("layeradd", function(){
            resetLabels([layer_DemandesCycloparking_Quartiers_4]);
        });
        map.on("layerremove", function(){
            resetLabels([layer_DemandesCycloparking_Quartiers_4]);
        });
