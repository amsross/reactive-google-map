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

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
          // instantiate the map a the user"s location
          this.buildMap( position.coords.latitude, position.coords.longitude );
        }.bind(this), function() {
          this.buildMap( this.options.lat, this.options.lng );
        }.bind(this));
      } else {
        // instantiate the map a the default location
        this.buildMap( this.options.lat, this.options.lng );
      }
    },

    buildMap: function( lat, lng ) {

      var mapOpts = $.extend( {
        center: {
          lat: lat,
          lng: lng
        }
      }, this.options.mapOpts );

      this.map = new google.maps.Map( this.element, mapOpts);

      this.map.on = this.map.addListener;

      var change = h( "bounds_changed", this.map )
        .debounce( 500 )
        .flatMap(function() {
          var latLngBounds = this.map.getBounds();

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
        .each(function( locations ) {
          var latLngBounds = this.map.getBounds();
          _.each( locations, function( location ) {
            if ( !this.markers[location.id] && latLngBounds.contains( new google.maps.LatLng( location.lat, location.lng ) ) ) {
              var marker = this.placeMarker( location, this.map );
              var infoPane = this.attachInfoWindow( marker, location, this.map );
              this.markers[location.id] = {
                marker: marker,
                infoPane: infoPane
              };
            } else if ( this.markers[location.id] && !latLngBounds.contains( new google.maps.LatLng( location.lat, location.lng ) ) ) {
              this.markers[location.id].marker.setMap( null );
              delete this.markers[location.id];
            }
          }.bind(this));
        }.bind(this))
        ;
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
