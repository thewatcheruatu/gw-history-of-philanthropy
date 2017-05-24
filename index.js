'use strict';

const HistoryOfPhilanthropy = ( function() {
	//const path = 'http://gwalumni.org/projects/history-of-philanthropy/';
	//const path = '';
	const path = 'https://growlfrequency.com/work/gw-history-of-philanthropy/';
	const imagePath = 'http://gwalumni.org/projects/history-of-philanthropy/images/';
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
					/*
					 * Putting this in a timeout, because there was a race condition with
					 * the stylesheet load that sometimes caused the initial scroll to
					 * be off by a small amount. I don't like it.
					 * TODO - maybe
					**/
					setTimeout( () => {
						scrollToEntry( entryIds[0] );
					}, 200 );
				} )
				.catch( () => {
					_handleError( new Error( 'Error loading html.' ) );
				} );
		}
	}

	function lightboxOpen() {
		const $body = $( 'body' );
		let $overlay;

		$overlay = $( '#hop-lightbox-overlay' );

		if ( ! $overlay.length ) {
			$overlay = $( '<div id="hop-lightbox-overlay"></div>' );
			$body.append( $overlay );
		}

		$body.addClass( 'active-overlay' );
		$container.detach().appendTo( $overlay );
	}

	function scrollToEntry( entryId ) {
		if ( entryId === currentEntryId ) {
			return;
		}

		const $entry = $( '#' + entryId );
		if ( ! $entry.length ) {
			handleError(
				new Error( 'Cannot scroll to invalid timeline entry.' )
			);
			return;
		}
		currentEntryId = entryId;
		$timelineEntries.stop();

		const entryIndex = entryIds.indexOf( entryId );
		const entryPosition = $entry.position();
		const newScrollTop = Math.floor( 
			entryPosition.top + $timelineEntries.scrollTop() );
		const scrollDuration = _calculateScrollDuration(
			newScrollTop - $timelineEntries.scrollTop()
		);

		if ( entryIndex === entryIds.length - 1 ) {
			$( '#scroll-down' ).addClass( 'disabled' );
		} else {
			$( '#scroll-down' ).removeClass( 'disabled' );
		}

		if ( entryIndex === 0 ) {
			$( '#scroll-up' ).addClass( 'disabled' );
		} else {
			$( '#scroll-up' ).removeClass( 'disabled' );
		}

		$timelineEntries.animate( {
			scrollTop : newScrollTop,
		}, scrollDuration );

		function _calculateScrollDuration( pixelMoveAmount ) {
			const e = Math.E;
			const durationMax = 500;
			const curveMidpoint = 300; 

			pixelMoveAmount = Math.abs( pixelMoveAmount );
			/*
			 * Logistic function just to get a basic S curve
			**/
			return durationMax / 
				( 1 + 
					Math.pow( 
					e, ( -.01 * ( pixelMoveAmount - curveMidpoint ) ) 
					) 
				);
		}
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

		$( '#lightbox-toggle' ).on( 'click', ( e ) => {
			e.preventDefault();
			lightboxOpen();
		} );

		$( '#scroll-down' ).on( 'click', ( e ) => {
			e.preventDefault();
			scrollInDirection( 'forward' );
		} );

		$( '#scroll-up' ).not( '.disabled' ).on( 'click', ( e ) => {
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

	function _loadHtml( thing, url, dataProcessor ) {
		thing = typeof thing === 'string' ? $( thing ) : thing;

		return new Promise( ( resolve, reject ) => {
			if ( ! thing.length ) {
				return reject(
					new Error( 'Could not find thing.' )
				);
			}
			const frag = document.createDocumentFragment();
			$.get( url, {}, ( data ) => {
				if ( typeof dataProcessor === 'function' ) {
					const div = document.createElement( 'div' );
					div.innerHTML = data;
					frag.appendChild( div );
					dataProcessor( $( div ) );
					thing.html( div.innerHTML );
				} else {
					thing.html( data );
				}
				resolve();
			} );
			/*
			thing.load( url, () => {
				resolve();
			} );
			*/
		} );
	}

	function _loadTimelineEntries() {
		return new Promise( ( resolve, reject ) => {
			_loadHtml( $timelineEntries, path + 'timeline-gw.html', _processEntries )
				.then( () => {
					entryIds = [];
					$timelineEntries.children( 'li' ).each( ( i, el ) => {
						entryIds.push( $( el ).attr( 'id' ) );
					} );
					resolve();
				} )
				.catch( reject );
		} );

		function _processEntries( $html ) {
			$html.children( 'li' ).each( ( i, el ) => {
				let bg;
				bg = $( el ).css( 'background-image' );
				bg = bg.replace( /images\//g, imagePath );
				$( el ).css( 'background-image', bg );
			} );
		}
	}


	return {
		init : init,
	};
} )();
