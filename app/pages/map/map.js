import {Page} from 'ionic-angular';


const EPSILON = 1e-6

@Page({
  templateUrl: 'build/pages/map/map.html'
})
export class Map {
  constructor() {
  	this.map = null
    this.isTracking = false
		this.loadMap()
    this.currentPosition = null
    this.previousPosition = null

    this.elapsedSecond = 0
    this.distance = 0
    this.velocity = 0
    this.lat = 0.0
    this.lng = 0.0
  }

  startTracking() {
    this.isTracking = true

    let onSuccess = position => {
      let {timestamp, coords: {latitude, longitude}} = position
      this.lat = latitude
      this.lng = longitude
      if (!this.currentPosition
        || Math.abs(this.currentPosition.latitude - latitude) <= EPSILON
        || Math.abs(this.currentPosition.longitude - longitude) <= EPSILON) {

        if (this.currentPosition)
          this.previousPosition = Object.assign({}, this.currentPosition)
        this.currentPosition = {
          latitude: latitude,
          longitude: longitude,
          timestamp: timestamp
        }
        console.log('currentPosition', this.currentPosition)
        if (this.previousPosition) {
          this.distance += this.calcDistance(
            this.previousPosition.latitude, this.previousPosition.longitude,
            this.currentPosition.latitude, this.currentPosition.longitude)
          this.updateVelocity()
        }
        this.updateMarker(this.currentPosition)
      }
    }

    let onError = error => {
      console.log('onError', error)
    }

    let geoOptions = {
      enableHighAccuracy: true, 
      maximumAge        : 30000, 
      timeout           : 27000
    }

    this.trackingID = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions)
    console.log('startTracking', this.trackingID)
    this.startTimer()
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      ++this.elapsedSecond
      this.minute = parseInt(this.elapsedSecond / 60) % 60
      this.second = this.elapsedSecond % 60
      this.updateVelocity()
    }, 1000)
  }

  updateVelocity() {
    this.velocity = this.distance / (this.elapsedSecond / 3600)
  }

  stopTimer() {
    clearInterval(this.timerInterval)
  }

  stopTracking() {
    console.log('stopTracking', this.trackingID)
    this.isTracking = false
    navigator.geolocation.clearWatch(this.trackingID)
    this.trackingID = null
    this.stopTimer()
  }

  getCurrentPosition() {
  	return new Promise((resolve, reject) => {
  		if (!navigator.geolocation) reject(new Error('no geolocation api'))
  		navigator.geolocation.getCurrentPosition(position => {
  			resolve({
  				timestamp: position.timestamp,
  				latitude: position.coords.latitude,
  				longitude: position.coords.longitude
  			})
  		}, error => {
  			reject(error)
  		})
  	})
  }

  loadMap() {
  	let checkMapInterval = setInterval(() => {
  		if (mapDownloaded) {
  			clearInterval(checkMapInterval)
  			this.getCurrentPosition()
  				.then(currentPosition => {
  					const {latitude, longitude} = currentPosition
						let latLng = new google.maps.LatLng(latitude, longitude)
					  let mapOptions = {
					    center: latLng,
					    zoom: 15,
					    mapTypeId: google.maps.MapTypeId.ROADMAP,
              scrollwheel: true,
              mapTypeControl: true,
              mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER
              },
              zoomControl: true,
              zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER
              },
              scaleControl: true,
              streetViewControl: false,
              fullscreenControl: false
					  }
					  this.map = new google.maps.Map(document.getElementById('gmap'), mapOptions)
            this.poly = new google.maps.Polyline({
              strokeColor: '#1e88e5',
              strokeOpacity: 1.0,
              strokeWeight: 3
            })
            this.poly.setMap(this.map)
            this.currentMarker = new google.maps.Marker({
              position: latLng,
              map: this.map
            })
  				})
  				.catch(function(err) {
  					console.log(err)
  				})
  		}
  	}, 100)
  }

  updateMarker(position) {
    let path = this.poly.getPath()
    const {latitude, longitude} = position
    let latLng = new google.maps.LatLng(latitude, longitude)
    path.push(latLng)

    this.currentMarker.setPosition(latLng)
  }

  paddingZero(number) {
    if (!number) return
    let result = number + ''
    while (result.length < 2) result = '0' + result
    return result
  }

  calcDistance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  }
}
