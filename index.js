'use strict';

const HistoryOfPhilanthropy = ( function() {
	const path = 'http://gwalumni.org/projects/history-of-philanthropy/';
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
					return _loadHtml( $timelineEntries, path + 'timeline-gw.html' );
				} )
				.then( () => {
					$( window ).trigger( 'resize' );
				} )
				.catch( () => {
					console.log( 'error loading html' );
				} );
		}
	}

	function _attachEventHandlers() {
		$( window )
			.on( 'resize', () => {
				adjustLayout();
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

	return {
		init : init,
	};
} )();
