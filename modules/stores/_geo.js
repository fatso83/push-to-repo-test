var geolib = require('geolib');
var repository = require('./data/kiwistores');

function GetClosestStores( latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance )
{
  var mypos = {"latitude" : latitude, "longitude" : longitude};

  var coordsArray = [];

  for( i = 0; i < repository.length; i++ )
  {
    var storepos = {"latitude" : repository[i].location.latitude, "longitude" : repository[i].location.longitude};
    var d = geolib.getDistance(mypos, storepos);

    coordsArray.push(CreateStoreDistanceObject(repository[i], d))
    ;
  }

  var sorted = coordsArray.sort(function(a, b) { return a.distance - b.distance; });
  
  if( maxNumberOfStores > 0 )
  {   
    sorted = sorted.slice(0,maxNumberOfStores);
  }

  if( maxDistance > 0 )
  {
    var withinMaxDistance = WithinMaxDistance( sorted, maxDistance); 
    if( minNumberOfStores > 0 && withinMaxDistance.length < minNumberOfStores ) 
    {
      return sorted.slice(0,minNumberOfStores);
    }
    else
    {
      return withinMaxDistance;
    }
  }

  return sorted;
}

function WithinMaxDistance( sorted, maxDistance)
{
  var within = [];
  for( i = 0 ; i < sorted.length; i++ )
  {
    if( sorted[i].distance > maxDistance)
    {
      return within;
    }
    within.push(sorted[i]);
  }
  return within;
}

function CreateStoreDistanceObject(storeObject, distance)
{
  var distanceStore = {
    "distance" : distance,
    "store" : storeObject    
  };
  return distanceStore;
}

exports.GetClosestStores = GetClosestStores;