'use strict';

const HistoryOfPhilanthropy = ( function() {
	const environments = {
		prod : {
			path : 'http://gwalumni.org/projects/history-of-philanthropy/',
			imagePath : 'http://gwalumni.org/projects/history-of-philanthropy/images/',
		},

		dev : {
			path : 'https://growlfrequency.com/work/gw-history-of-philanthropy/',
			imagePath : 'https://growlfrequency.com/work/gw-history-of-philanthropy/images/',
		},
	};

	// jQuery objects
	let $; // jQuery
	let $appContainer; // all app HTML, id='history-of-philanthropy'
	let $timelineEntries; // unordered list, id='timeline-entries'

	// Environment variables
	let appPath;
	let imagePath;

	// Timeline tracking-related
	let currentEntryId; // String
	let entryIds = []; // Array

	// General App Globals
	let errorLog = []; // Array
	let initialized; // Bool
	let resizingTimeout;
	let widthToHeight; // Percentage representation of app aspect ratio

	function adjustLayout() {
		_ensureScreenFit();
		scrollToCurrent();
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
		dependencies.env = dependencies.env || 'prod';
		_setEnvironmentVariables();

		initialized = true;

		// Basic validity checks out of the way. Can make the content now.
		$( _docReady );

		function _docReady() {
			$appContainer = $( '#history-of-philanthropy' );
			if ( ! $appContainer.length ) {
				return _handleError( 
					new Error( 'Did not find #history-of-philanthropy container.' ) 
				);
			}
			_loadStylesheet( appPath + 'style.css' );
			_loadStylesheet( appPath + 'typography.css' );
			_loadHtml( $appContainer,  appPath + 'container.html' )
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

		function _setEnvironmentVariables() {
			let env;
			
			env = dependencies.env;
			env = environments[env] ? env : 'prod';

			appPath = environments[env].path;
			imagePath = environments[env].imagePath;
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
		$appContainer.before( '<div id="history-of-philanthropy-placeholder"></div>' );
		$appContainer.detach().appendTo( $overlay );
		$( '#lightbox-toggle' ).removeClass( 'pop-out' ).addClass( 'pop-in' );
	}

	function lightboxClose() {
		const $body = $( 'body' );
		const $placeholder = $( '#history-of-philanthropy-placeholder' );
		$appContainer.detach().insertAfter( $placeholder );
		$placeholder.remove();
		$body.removeClass( 'active-overlay' );
		$( '#lightbox-toggle' ).removeClass( 'pop-in' ).addClass( 'pop-out' );
	}

	function lightboxToggle() {
		if ( $( 'body' ).hasClass( 'active-overlay' ) ) {
			lightboxClose();
		} else {
			lightboxOpen();
		}
		scrollToCurrent();
	}

	function scrollToCurrent() {
		scrollToEntry( currentEntryId );
	}

	function scrollToEntry( entryId ) {
		const $entry = $( '#' + entryId );
		if ( ! $entry.length ) {
			_handleError(
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
				if ( resizingTimeout ) {
					clearTimeout( resizingTimeout );
				}
				resizingTimeout = setTimeout( () => {
					adjustLayout();
					clearTimeout( resizingTimeout );
					resizingTimeout = null;
				}, 100 );
			} )
			.trigger( 'resize' );

		$( '#lightbox-toggle' ).on( 'click', ( e ) => {
			e.preventDefault();
			lightboxToggle();
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

	function _ensureScreenFit() {
		const screenWidth = $( window ).width();
		const screenHeight = $( window ).height();
		const appWidth = $appContainer.outerWidth();
		const appHeight = $appContainer.outerHeight();
		
		_calculateWidthToHeight();

		if ( appHeight < screenHeight ) {
			$appContainer.css( 'width', '' );
			return;
		}

		const newAppWidth = Math.max( 480, Math.floor( screenHeight * widthToHeight ) );

		$appContainer.css( 'width', Math.min( screenWidth, newAppWidth ) + 'px' );

		/*
		 * Moved this inside _ensureScreenFit, because I don't think I will
		 * need it anywhere else. Initially, I thought I might.
		**/
		function _calculateWidthToHeight() {
			widthToHeight = Math.floor( appWidth / appHeight * 10 ) / 10;
		}

	}

	function _handleError( error ) {
		// Just swallow these up silently - we can check with debugger
		errorLog.push( error.message );
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
			$.get( url, {}, ( data ) => {
				if ( typeof dataProcessor === 'function' ) {
					const div = document.createElement( 'div' );
					div.innerHTML = data;
					dataProcessor( $( div ) );
					thing.html( div.innerHTML );
				} else {
					thing.html( data );
				}
				resolve();
			} );
		} );
	}

	function _loadTimelineEntries() {
		return new Promise( ( resolve, reject ) => {
			_loadHtml( $timelineEntries, appPath + 'timeline-gw.html', _processEntries )
				.then( () => {
					entryIds = [];
					$timelineEntries.children( 'li' ).each( ( i, el ) => {
						entryIds.push( $( el ).attr( 'id' ) );
					} );
					currentEntryId = entryIds[0];
					resolve();
				} )
				.catch( reject );
		} );

		function _processEntries( $html ) {
			$html.children( 'li' ).each( ( i, el ) => {
				let bg;
				bg = $( el ).css( 'background-image' );
				bg = bg.replace( /(http.*?)?images\//g, imagePath );
				$( el ).css( 'background-image', bg );
			} );
		}
	}


	return {
		init : init,
	};
} )();
