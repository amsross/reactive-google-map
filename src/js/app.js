;(function( $, h, _, window, document, undefined ) {

  var pluginName = "ReactiveGMap",
    defaults = {
      url: null,
      mapOpts: {
        zoom: 15,
        zoomControl: true,
        panControl: true
      }
    };

  function Plugin( element, options ) {
    this.element = element;

    this.options = $.extend( {}, defaults, options );

    this._defaults = defaults;
    this._name = pluginName;

    this.markers = {};
    this.infoWindow = null;

    this.init();
  }

  Plugin.prototype = {

    init: function() {

      h(this.getCoords())
        .map(function( coords ) {
          // use the coords to center the map
          return this.buildMap( coords.lat, coords.lng );
        }.bind(this))
        .apply(function( map ) {

          // listen to map events
          h( "bounds_changed", map )
            .debounce( 500 )
            // get locations from the API based on the view
            .map( this.getLocations.bind(this, map) )
            .merge()
            // remove markers that aren't in the request
            .map( this.removeMarkers.bind(this) )
            .flatten()
            // process each object in the response separately
            .each( this.processLocation.bind(this, map) )
            ;
        }.bind(this))
        ;
    },

    // get either the users current location, or the provided defaults
    getCoords: function() {

      return function( push, next ) {

        if ( "geolocation" in navigator && ( !this.options.lat || !this.options.lng ) ) {
          navigator.geolocation.getCurrentPosition(function( position ) { // success
            // the user's location
            push( null, { lat: position.coords.latitude, lng: position.coords.longitude } );
            push( null, h.nil );
          }.bind(this), function( err ) { // error
            push( null, h.nil );
          }.bind(this));
        } else {
          // the default location
          push( null, { lat: this.options.lat, lng: this.options.lng } );
          push( null, h.nil );
        }
      }.bind(this);
    },

    // construct the map object
    buildMap: function( lat, lng ) {

      var mapOpts = $.extend( {
        center: {
          lat: lat,
          lng: lng
        }
      }, this.options.mapOpts );

      var map = new google.maps.Map( this.element, mapOpts );
      map.on = map.addListener;

      return map;
    },

    // hit the endpoint to get the locations
    getLocations: function( map ) {
      var latLngBounds = map.getBounds();

      return h( $.getJSON(
        this.options.url,
        {
          top: latLngBounds.getNorthEast().lat(),
          right: latLngBounds.getNorthEast().lng(),
          bottom: latLngBounds.getSouthWest().lat(),
          left: latLngBounds.getSouthWest().lng()
        }
      ));
    },

    // process each location
    processLocation: function( map, location ) {

      var latLngBounds = map.getBounds();

      if ( !this.markers[location.id] && latLngBounds.contains( new google.maps.LatLng( location.lat, location.lng ) ) ) {

        // create and place a marker
        var marker = this.placeMarker( location, map );

        // attach an InfoWindow to the marker
        var infoWindow = this.attachInfoWindow( marker, location, map );

        // store a reference to the marker
        this.markers[location.id] = {
          marker: marker,
          infoWindow: infoWindow
        };
      }
    },

    // add a marker for a location
    placeMarker: function( location, map ) {

      // create the marker
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng( location.lat, location.lng ),
        icon: location.icon
      });

      // add it to the map
      marker.setMap( map );

      return marker;
    },

    // attach and InfoWindow to a marker
    attachInfoWindow: function( marker, location, map ) {

      // create the InfoWindow
      var infoWindow = new google.maps.InfoWindow({
        content: location.content
      });

      // attach a click handler to show the InfoWindow
      marker.addListener( "click", function() {

        // if there is an open InfoWindow, close it
        if ( this.infoWindow ) {
          this.infoWindow.close();
        }

        // open the desired InfoWindow
        infoWindow.open( map, marker );

        // set this InforWindow as the current one
        this.infoWindow = infoWindow;
      }.bind(this));

      return infoWindow;
    },

    removeMarkers: function( locations ) {
      // the location ids from the response
      var location_ids = _.pluck( locations, "id" );
      // the ids of the markers on the map
      var markers = _.map(_.keys( this.markers ), _.parseInt);
      // the ids of locations still on the map, but not in the response
      var defunct = _.difference( markers, location_ids );

      _.each( defunct, function( location_id ) {
        this.removeMarker( location_id );
      }, this);

      return locations;
    },

    removeMarker: function( location_id ) {
      this.markers[location_id].marker.setMap( null );
      delete this.markers[location_id];
    }
  };

  $.fn[pluginName] = function( options ) {
    return this.each(function() {
      if ( !$.data( this, "plugin_" + pluginName ) ) {
        $.data(
          this, "plugin_" + pluginName,
          new Plugin( this, options )
          );
      }
    });
  };
})( jQuery, highland, _, window, document );
