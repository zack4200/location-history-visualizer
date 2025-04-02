( function ( $, L, prettySize ) {
	var map, heat,
		heatOptions = {
			tileOpacity: 1,
			heatOpacity: 1,
			radius: 7,
			blur: 4,
			gradient: {0.4: "blue", 0.6: "cyan", 0.7: "lime", 0.8: "yellow", 1: "red"},
		};

	function status( message ) {
		$( '#currentStatus' ).text( message );
	}
	// Start at the beginning
	stageOne();

	function stageOne () {
		var dropzone;

		// Initialize the map
		map = L.map( 'map' ).setView( [0,0], 2 );
		L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '',
			maxZoom: 18,
			minZoom: 2
		} ).addTo( map );

		// Initialize the dropzone
		dropzone = new Dropzone( document.body, {
			url: '/',
			previewsContainer: document.createElement( 'div' ), // >> /dev/null
			clickable: false,
			accept: function ( file, done ) {
				stageTwo( file );
				dropzone.disable(); // Your job is done, buddy
			}
		} );

		// For mobile browsers, allow direct file selection as well
		$( '#file' ).change( function () {
			stageTwo( this.files[0] );
			dropzone.disable();
		} );
	}

	function stageTwo ( file ) {
		heat = L.heatLayer( [], heatOptions ).addTo( map );

		var type;

		try {
			if ( /\.kml$/i.test( file.name ) ) {
				type = 'kml';
			} else 	if ( /\.json$/i.test( file.name ) ) {
				type = 'json';
			} else {
				type = 'other';
			}
		} catch ( ex ) {
			status( 'Something went wrong generating your map. Ensure you\'re uploading a Google Takeout JSON file that contains location data and try again, or create an issue on GitHub if the problem persists. ( error: ' + ex.message + ' )' );
			return;
		}

		// First, change tabs
		$( 'body' ).addClass( 'working' );
		$( '#intro' ).addClass( 'hidden' );
		$( '#working' ).removeClass( 'hidden' );

		var latlngs = [];
		window.latlngs = latlngs; // For debugging
		function done() {
			status( 'Generating map...' );
			heat._latlngs = latlngs;

			heat.redraw();
			stageThree(  /* numberProcessed */ latlngs.length );
		}

		var os = new oboe();
		os.done(done);
		const androidLatlngRegex = /([-+]?[0-9]*\.?[0-9]+)°,\s*([-+]?[0-9]*\.?[0-9]+)°/;
		const iosLatlngRegex = /geo:([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/;

		// Android
		os.node('semanticSegments.*.timelinePath.*.point', function (entry) {
			// Extract latitude and longitude from the 'point' string
			var match = entry.match(androidLatlngRegex);
		
			if (match) {
				var latitude = parseFloat(match[1]);
				var longitude = parseFloat(match[2]);
		
				if (type === 'json' && !isNaN(latitude) && !isNaN(longitude)) {
					latlngs.push([latitude, longitude]);
				} else {
					console.log("latitude or longitude is NaN")
				}
			} else {
				console.log("Android timelinePath-point no match")
			}
		
			return oboe.drop;
		});
		os.node('semanticSegments.*.activity', function (entry) {
			if (!entry.start || !entry.end) { // Ensure the fields exist
				console.log("Either start or end did not exist");
				return oboe.drop;
			}

			// Extract latitude and longitude from the 'start' and 'end' strings
			var startMatch = entry.start.latLng.match(androidLatlngRegex);
			var endMatch = entry.end.latLng.match(androidLatlngRegex);

			if (startMatch) {
				var startLatitude = parseFloat(startMatch[1]);
				var startLongitude = parseFloat(startMatch[2]);

				if (!isNaN(startLatitude) && !isNaN(startLongitude)) {
					latlngs.push([startLatitude, startLongitude]);
				} else {
					console.log("Either start latitude or longitude is NaN");
				}
			} else {
				console.log("No start match");
			}

			if (endMatch) {
				var endLatitude = parseFloat(endMatch[1]);
				var endLongitude = parseFloat(endMatch[2]);

				if (!isNaN(endLatitude) && !isNaN(endLongitude)) {
					latlngs.push([endLatitude, endLongitude]);
				} else {
					console.log("Either end latitude or longitude is NaN");
				}
			} else {
				console.log("No end match");
			}

			return oboe.drop;
		});
		os.node('semanticSegments.*.visit.topCandidate.placeLocation.latLng', function (entry) {
			var match = entry.match(androidLatlngRegex);
			if (match) {
				var latitude = parseFloat(match[1]);
				var longitude = parseFloat(match[2]);
				if (!isNaN(latitude) && !isNaN(longitude)) {
					latlngs.push([latitude, longitude]);
				} else {
					console.log("placeLocation is NaN");
				}
			} else {
				console.log("No placeLocation match");
			}

			return oboe.drop;
		});
		os.node('*.position.LatLng', function (entry) {
			var match = entry.match(androidLatlngRegex);
			if (match) {
				var latitude = parseFloat(match[1]);
				var longitude = parseFloat(match[2]);
				if (!isNaN(latitude) && !isNaN(longitude)) {
					latlngs.push([latitude, longitude]);
				} else {
					console.log("rawSignal position is NaN");
				}
			} else {
				console.log("No rawSignal position match");
			}

			return oboe.drop;
		});

		// iOS
		os.node('!.*.timelinePath.*.point', function (entry) {
			// Extract latitude and longitude from the 'point' string
			var match = entry.match(iosLatlngRegex);
		
			if (match) {
				var latitude = parseFloat(match[1]);
				var longitude = parseFloat(match[2]);
		
				if (type === 'json' && !isNaN(latitude) && !isNaN(longitude)) {
					latlngs.push([latitude, longitude]);
				} else {
					console.log("latitude or longitude is NaN")
				}
			} else {
				console.log("iOS timelinePath-point no match")
			}
		
			return oboe.drop;
		});
		os.node('*.activity', function (entry) {
			if (!entry.start || !entry.end) { // Ensure the fields exist
				console.log("Either start or end did not exist");
				return oboe.drop;
			}

			// Extract latitude and longitude from the 'start' and 'end' strings
			var startMatch = entry.start.match(iosLatlngRegex);
			var endMatch = entry.end.match(iosLatlngRegex);

			if (startMatch) {
				var startLatitude = parseFloat(startMatch[1]);
				var startLongitude = parseFloat(startMatch[2]);

				if (!isNaN(startLatitude) && !isNaN(startLongitude)) {
					latlngs.push([startLatitude, startLongitude]);
				} else {
					console.log("Either start latitude or longitude is NaN");
				}
			} else {
				console.log("No start match");
			}

			if (endMatch) {
				var endLatitude = parseFloat(endMatch[1]);
				var endLongitude = parseFloat(endMatch[2]);

				if (!isNaN(endLatitude) && !isNaN(endLongitude)) {
					latlngs.push([endLatitude, endLongitude]);
				} else {
					console.log("Either end latitude or longitude is NaN");
				}
			} else {
				console.log("No end match");
			}

			return oboe.drop;
		});
		os.node('*.visit', function (entry) {
			if (!entry.topCandidate) { // Ensure the field exist
				console.log("topCandidate doesn't exist");
				return oboe.drop;
			}
			if (!entry.topCandidate.placeLocation) {
				console.log("placeLocation doesn't exist");
				return oboe.drop;
			}

			var match = entry.topCandidate.placeLocation.match(iosLatlngRegex);
			if (match) {
				var latitude = parseFloat(match[1]);
				var longitude = parseFloat(match[2]);
				if (!isNaN(latitude) && !isNaN(longitude)) {
					latlngs.push([latitude, longitude]);
				} else {
					console.log("placeLocation is NaN");
				}
			} else {
				console.log("No placeLocation match");
			}

			return oboe.drop;
		});

		var fileSize = prettySize( file.size );

		status( 'Preparing to import file ( ' + fileSize + ' )...' );

		// Now start working!
		if ( type === 'json' ) parseJSONFile( file, os );
		if ( type === 'kml' ) parseKMLFile( file );
		if ( type === 'other' ) status('ERROR: Please make sure the file you\'re uploading has a .json extension');
	}

	function stageThree ( numberProcessed ) {
		var $done = $( '#done' );

		// Change tabs :D
		$( 'body' ).removeClass( 'working' );
		$( '#working' ).addClass( 'hidden' );
		$done.removeClass( 'hidden' );

		// Update count
		$( '#numberProcessed' ).text( numberProcessed.toLocaleString() );

		$( '#launch' ).click( function () {
			$( this ).text( 'Launching... ' );
			$( 'body' ).addClass( 'map-active' );
			$done.fadeOut();
			activateControls();
		} );

		function activateControls () {
			var $tileLayer = $( '.leaflet-tile-pane' ),
				$heatmapLayer = $( '.leaflet-heatmap-layer' ),
				originalHeatOptions = $.extend( {}, heatOptions ); // for reset

			// Update values of the dom elements
			function updateInputs () {
				document.querySelectorAll("#controls input.control").forEach(input => {
					if (heatOptions[input.id] !== undefined) {
						input.value = heatOptions[input.id];
					}
				});				
			}

			updateInputs();

			$( '.control' ).change( function () {
				switch ( this.id ) {
					case 'tileOpacity':
						$tileLayer.css( 'opacity', this.value );
						break;
					case 'heatOpacity':
						$heatmapLayer.css( 'opacity', this.value );
						break;
					default:
						heatOptions[ this.id ] = Number( this.value );
						heat.setOptions( heatOptions );
						break;
				}
			} );

			$( '#reset' ).click( function () {
				$.extend( heatOptions, originalHeatOptions );
				updateInputs();
				heat.setOptions( heatOptions );
				// Reset opacity too
				$heatmapLayer.css( 'opacity', originalHeatOptions.heatOpacity );
				$tileLayer.css( 'opacity', originalHeatOptions.tileOpacity );
			} );
		}
	}

	/*
	Break file into chunks and emit 'data' to oboe instance
	*/

	function parseJSONFile( file, oboeInstance ) {
		var fileSize = file.size;
		var prettyFileSize = prettySize(fileSize);
		var chunkSize = 512 * 1024; // bytes
		var offset = 0;
		var chunkReaderBlock = null;
		var decoder = new TextDecoder("utf-8");

		var readEventHandler = function (evt) {
			if (evt.target.error == null) {
				offset += evt.target.result.byteLength;
				var chunk = decoder.decode(evt.target.result, { stream: true }); // Preserve multi-byte characters
				var percentLoaded = (100 * offset / fileSize).toFixed(0);
				status(percentLoaded + "% of " + prettyFileSize + " loaded...");
				oboeInstance.emit("data", chunk);
			} else {
				return;
			}
			if ( offset >= fileSize ) {
				oboeInstance.emit( 'done' );
				return;
			}
			chunkReaderBlock(offset, chunkSize, file);
		};

		chunkReaderBlock = function (_offset, length, _file) {
			var r = new FileReader();
			var blob = _file.slice(_offset, length + _offset);
			r.onload = readEventHandler;
			r.readAsArrayBuffer(blob); // Use ArrayBuffer instead of readAsText
		};

		// now let's start the read with the first block
		chunkReaderBlock( offset, chunkSize, file );
	}

	/*
        Default behavior for file upload (no chunking)	
	*/

	function parseKMLFile( file ) {
		var fileSize = prettySize( file.size );
		var reader = new FileReader();
		reader.onprogress = function ( e ) {
			var percentLoaded = Math.round( ( e.loaded / e.total ) * 100 );
			status( percentLoaded + '% of ' + fileSize + ' loaded...' );
		};

		reader.onload = function ( e ) {
			var latlngs;
			status( 'Generating map...' );
			latlngs = getLocationDataFromKml( e.target.result );
			heat._latlngs = latlngs;
			heat.redraw();
			stageThree( latlngs.length );
		}
		reader.onerror = function () {
			status( 'Something went wrong reading your JSON file. Ensure you\'re uploading a "direct-from-Google" JSON file and try again, or create an issue on GitHub if the problem persists. ( error: ' + reader.error + ' )' );
		}
		reader.readAsText( file );
	}

	function getLocationDataFromKml( data ) {
		var KML_DATA_REGEXP = /<when>( .*? )<\/when>\s*<gx:coord>( \S* )\s( \S* )\s( \S* )<\/gx:coord>/g,
			locations = [],
			match = KML_DATA_REGEXP.exec( data );

		// match
		//  [ 1 ] ISO 8601 timestamp
		//  [ 2 ] longitude
		//  [ 3 ] latitude
		//  [ 4 ] altitude ( not currently provided by Location History )
		while ( match !== null ) {
			locations.push( [ Number( match[ 3 ] ), Number( match[ 2 ] ) ] );
			match = KML_DATA_REGEXP.exec( data );
		}

		return locations;
	}

}( jQuery, L, prettySize ) );
