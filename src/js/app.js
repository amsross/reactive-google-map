;(function( $, h, _, window, document, undefined ) {

  var pluginName = "ReactiveGMap",
    defaults = {
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

    this.init();
  }

  Plugin.prototype = {

    markers: {},

    init: function() {

      h(this.getCoords())
        .map(function( coords ) {
          // use the coords to center the map
          return this.buildMap( coords.lat, coords.lng );
        }.bind(this))
        .apply(function( map ) {
          // return an event stream
          h( "bounds_changed", map )
            .debounce( 500 )
            .map(function( x ) {
              var latLngBounds = map.getBounds();

              return h( $.getJSON(
                "locations.json",
                {
                  top: latLngBounds.getNorthEast().G,
                  right: latLngBounds.getNorthEast().K,
                  bottom: latLngBounds.getSouthWest().G,
                  left: latLngBounds.getSouthWest().K
                }
              ));
            }.bind(this))
            .map(function( locations ) {
              return h(locations);
            })
              .flatten()
            .each(function( location ) {
              var latLngBounds = map.getBounds();
              if ( !this.markers[location.id] && latLngBounds.contains( new google.maps.LatLng( location.lat, location.lng ) ) ) {
                var marker = this.placeMarker( location, map );
                var infoPane = this.attachInfoWindow( marker, location, map );
                this.markers[location.id] = {
                  marker: marker,
                  infoPane: infoPane
                };
              } else if ( this.markers[location.id] && !latLngBounds.contains( new google.maps.LatLng( location.lat, location.lng ) ) ) {
                this.markers[location.id].marker.setMap( null );
                delete this.markers[location.id];
              }

              return location;
            }.bind(this))
            .each(function( x ) {
              console.log( x );
            })
            ;

          return map;
        }.bind(this))
        ;
    },

    getCoords: function() {

      return function( push, next ) {

        if ( "geolocation" in navigator ) {
          navigator.geolocation.getCurrentPosition(function( position ) { // success
            // the user's location
            push( null, { lat: position.coords.latitude, lng: position.coords.longitude } );
            push( null, h.nil );
          }.bind(this), function() { // error
            // the default location
            push( null, { lat: this.options.lat, lng: this.options.lng } );
            push( null, h.nil );
          }.bind(this));
        } else {
          // the default location
          push( null, { lat: this.options.lat, lng: this.options.lng } );
          push( null, h.nil );
        }
      }.bind(this);
    },

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

    placeMarker: function( location, map ) {
      // add a marker for each location
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng( location.lat, location.lng ),
        icon: location.icon
      });
      marker.setMap( map );

      return marker;
    },

    attachInfoWindow: function( marker, location, map ) {
      // add an infoWindow for each marker
      var infoPane = new google.maps.InfoWindow({
        content: location.content
      });
      marker.addListener( "click", function() {
        infoPane.open( map, marker );
      });

      return infoPane;
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
