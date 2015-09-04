(function($, h) {

  $(document).ready(function() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        // instantiate the map a the user"s location
        buildMap( position.coords.latitude, position.coords.longitude );
      }, function() {
        buildMap( 39.916888, -75.070367 );
      });
    } else {
      // instantiate the map a the default location
      buildMap( 39.916888, -75.070367 );
    }
  });

  function buildMap( lat, lng ) {

    var map = new google.maps.Map(document.getElementById("google-map-container"), {
      center: {
        lat: lat,
        lng: lng,
      },
      zoom: 15,
      zoomControl: true,
      panControl: true
    });

    map.on = map.addListener;
    window.markers = {};
    var change = h( "bounds_changed", map )
      .debounce( 500 )
      .flatMap(function() {
        var latLngBounds = this.getBounds();

        return h( $.getJSON(
          "locations.json",
          {
            top: latLngBounds.getNorthEast().G,
            right: latLngBounds.getNorthEast().K,
            bottom: latLngBounds.getSouthWest().G,
            left: latLngBounds.getSouthWest().K
          }
        ));
      }.bind(map))
      .each(function( locations ) {
        var latLngBounds = this.getBounds();
        _.each( locations, function( location ) {
          if ( !window.markers[location.id] && latLngBounds.contains( new google.maps.LatLng( location.lat, location.lng ) ) ) {
            var marker = placeMarker( location, map );
            var infoPane = attachInfoWindow( marker, location, map );

            window.markers[location.id] = {
              marker: marker,
              infoPane: infoPane
            };
          } else if ( window.markers[location.id] && !latLngBounds.contains( new google.maps.LatLng( location.lat, location.lng ) ) ) {
            removeMarker( location );
          }
        });
      }.bind(map))
      ;

    function placeMarker( location, map ) {
      // add a marker for each location
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng( location.lat, location.lng ),
        icon: location.icon
      });
      marker.setMap( map );

      return marker;
    }

    function removeMarker( location ) {
      detachInfoWindow( window.markers[location.id] );
      window.markers[location.id].marker.setMap( null );
      delete window.markers[location.id];
    }

    function attachInfoWindow( marker, location, map ) {
      // add an infoWindow for each marker
      var infoPane = new google.maps.InfoWindow({
        content: location.content
      });
      marker.addListener( "click", function() {
        infoPane.open( map, marker );
      });

      return infoPane;
    }

    function detachInfoWindow( marker ) {
      marker.removeListener( "click" );
    }
  }

}(jQuery, highland));
