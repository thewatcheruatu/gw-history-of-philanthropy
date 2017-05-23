'use strict';

const HistoryOfPhilanthropy = ( function() {
	//const path = 'http://gwalumni.org/projects/history-of-philanthropy/';
	const path = '';
	let currentEntryId;
	let entryIds = [];
	let initialized;
	let $;
	let $container;
	let $timelineEntries;

	initialized = false;

	function adjustLayout() {
		const width = $timelineEntries.outerWidth();
		const height = Math.round( width * .6 );

		//$timelineEntries.children( 'li' ).css( 'height', height + 'px' );
	}

	function init( dependencies ) {
		if ( initialized ) {
			return _handleError( 
				new Error( 'History of Philanthropy already initialized.' ) 
			);
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || 
			( typeof jQuery !== 'undefined' ? jQuery : null );

		if ( ! $ ) {
			return _handleError( 
				new Error( 'jQuery is a required dependency.' ) 
			);
		}

		// Basic validity checks out of the way. Can make the content now.
		$( _docReady );

		function _docReady() {
			initialized = true;
			$container = $( '#history-of-philanthropy' );
			if ( ! $container.length ) {
				return _handleError( 
					new Error( 'Did not find #history-of-philanthropy container.' ) 
				);
			}
			_loadStylesheet( path + 'style.css' );
			_loadHtml( $container,  path + 'container.html' )
				.then( () => {
					$timelineEntries = $( '#timeline-entries' );
					_attachEventHandlers();
					return _loadTimelineEntries();
				} )
				.then( () => {
					$( window ).trigger( 'resize' );
				} )
				.catch( () => {
					console.log( 'error loading html' );
				} );
		}
	}

	function scrollToEntry( entryId ) {
		if ( entryId === currentEntryId ) {
			return;
		}

		console.log( 'scrolling to entryId', entryId );
	}

	function scrollInDirection( direction ) {
		let newEntryId;

		direction = direction || 'forward';

		if ( entryIds <= 1 ) {
			return;
		}

		if ( ! currentEntryId ) {
			currentEntryId = entryIds[0];
		}

		const currentEntryIndex = entryIds.indexOf( currentEntryId );
		if ( 
			direction === 'forward' && 
			currentEntryIndex < entryIds.length - 1 ) {
			newEntryId = entryIds[currentEntryIndex + 1];
		} else if (
			direction === 'backward' &&
			currentEntryIndex > 0 ) {
			newEntryId = entryIds[currentEntryIndex - 1];
		}

		if ( newEntryId ) {
			scrollToEntry( newEntryId );
		}
	}

	function _attachEventHandlers() {
		$( window )
			.on( 'resize', () => {
				adjustLayout();
			} );

		$( '#scroll-down' ).on( 'click', ( e ) => {
			e.preventDefault();
			scrollInDirection( 'forward' );
		} );

		$( '#scroll-up' ).on( 'click', ( e ) => {
			e.preventDefault();
			scrollInDirection( 'backward' );
		} );
	}

	function _handleError( error ) {
		console.log( error.message );
	}

	function _loadStylesheet( url ) {
		$( '<link>' )
			.attr( 'href', url )
			.attr( 'rel', 'stylesheet' )
			.appendTo( 'head' );
	}

	function _loadHtml( thing, url ) {
		thing = typeof thing === 'string' ? $( thing ) : thing;
		if ( ! thing.length ) {
			_handleError(
				new Error( 'Could not find thing.' )
			);
		}

		return new Promise( ( resolve ) => {
			thing.load( url, () => {
				resolve();
			} );
		} );
	}

	function _loadTimelineEntries() {
		return new Promise( ( resolve, reject ) => {
			_loadHtml( $timelineEntries, path + 'timeline-gw.html' )
				.then( () => {
					entryIds = [];
					$timelineEntries.children( 'li' ).each( ( i, el ) => {
						entryIds.push( $( el ).attr( 'id' ) );
					} );
					console.log( 'entry ids', entryIds );
					resolve();
				} )
				.catch( reject );
		} );
	}


	return {
		init : init,
	};
} )();
