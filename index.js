const remote = require('electron').remote
const main = remote.require('./main.js')
const request = require('request')
const jsdom = require('jsdom')

const olxUrl = 'http://olx.ua/ajax/kiev/search/list/'
var olxParams = {
    'search[city_id]': 268,
    'search[region_id]': 25,
    'search[district_id]': 0,
    'search[dist]': 0,
    'search[filter_float_price:from]': 5500,
    'search[filter_float_price:to]': 7501,
    'search[filter_float_number_of_rooms:from]': 1,
    'search[filter_float_number_of_rooms:to]': 1,
    'search[category_id]': 1147
}

const lunUrl = 'http://www.lun.ua/%D0%B0%D1%80%D0%B5%D0%BD%D0%B4%D0%B0-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80-%D0%BA%D0%B8%D0%B5%D0%B2?subway=6&subway=7&subway=9&subway=12&subway=25&subway=24&subway=21&subway=20&subway=19&subway=48&subway=49&subway=46&subway=45&subway=42&subway=41&subway=40&subway=39&subwayDistanceMax=1000&roomCount=1&priceMin=5800&priceMax=7300&currency=2&updateTime=today&order=update-time'
const hundredRealtyUrl = 'http://100realty.ua/realty_search/apartment/rent/id_last-week/nr_1/f_notfirst%2Cnotlast/ro_2/p_5500_7500/cur_3/sort/id_DESC?extended=1#realty-search-sort'

// notification about new property will be shown only if description contains some of these words
const neededWords = ['лукьян', 'лукъ', 'лукя', 'кпи', 'политех', 'дорогожич', 'олимпийс', 'демеев', 'печерск', 'кловск']

var button = document.createElement('button'),
    searchStarted = false,
    lastSavedState = false

button.textContent = 'Start search'
document.body.appendChild(button)

button.addEventListener('click', startInterval, false)

function startInterval(){
  var interval = null;
  if(!searchStarted){
    console.log('Interval started!')
    button.textContent = 'Stop search'
    searchStarted = true
    interval = setInterval(mainLoop, 30000)
  }
  else{
    console.log('Interval stopped!')
    button.textContent = 'Start search'
    searchStarted = false
    clearInterval(interval)
  }
}
savedOlxFlats = []
savedLunFlats = []
savedHundredRealtyFlats = []

function getRandomInt(min, max){
  return Math.floor(Math.random() * (max - min) + min)
}

function mainLoop(){
  //olxParams['search[filter_float_price:from]'] = getRandomInt(4500, 4700)
  //olxParams['search[filter_float_price:to]'] = getRandomInt(7010, 7100)
  generalCycle(getOlxDataPromise, olxUrl, olxParams, savedOlxFlats, parseOlxData, 'olx-content', updateOlxSavedList, isOlxTextAcceptable)
  generalCycle(getLunDataPromise, lunUrl, null, savedLunFlats, parseLunData, 'lun-content', updateLunSavedList, isLunTextAcceptable)
  generalCycle(getHundredRealtyDataPromise, hundredRealtyUrl, null, savedHundredRealtyFlats,
    parseHundredRealtyData, 'hundred-realty-content', updateHundredRealtySavedList, isHundredRealtyTextAcceptable)
}

function getOlxDataPromise(olxUrl, olxParams){
  return new Promise(function(resolve, reject){
    request.post({url: olxUrl , form: olxParams}, function(error, response, body){
      if(!error && response.statusCode == 200){
        resolve(body)
      }
      else{
        reject(error)
      }
    })
  })
}

function parseOlxData(data){
  return new Promise(function(resolve, reject){
    jsdom.env(data, ['http://code.jquery.com/jquery.js'], function(err, window){
      if(!err && window.$){
        var result = []
        links = window.$("#offers_table ").find("a.marginright5.link.linkWithHash.detailsLink")
        for(var i = 0; i < links.length; i++){
          result.push({href: links[i].href, text: links[i].text})
        }
        resolve(result)
      }
      else{
        reject(err)
      }
    })
  })
}

function updateOlxSavedList(list){
  savedOlxFlats = list
}

function isOlxTextAcceptable(text){
  return generalIsTextAcceptable(text, neededWords)
}

function getLunDataPromise(lunUrl){
  return new Promise(function(resolve, reject){
    request.get({url: lunUrl}, function(error, response, body){
      if(!error && response.statusCode == 200){
        resolve(body)
      }
      else{
        reject(error)
      }
    })
  })
}

function parseLunData(data){
  return new Promise(function(resolve, reject){
    jsdom.env(data, ['http://code.jquery.com/jquery.js'], function(err, window){
      if(!err && window.$){
        var result = []
        var links = window.$("#obj-left").find(".obj-title").find("a[data-page-id]")
        for(var i = 0; i < links.length; i++){
          result.push({href: 'http://lun.ua'+links[i].href, text: links[i].text})
        }
        resolve(result)
      }
      else{
        reject(err)
      }
    })
  })
}

function updateLunSavedList(list){
  savedLunFlats = list
}

function isLunTextAcceptable(text){
  // var neededWords = ['лукьян', 'лукъ', 'лукя']
  // return generalIsTextAcceptable(text, neededWords)
  return true;
}

function getHundredRealtyDataPromise(hundredRealtyUrl){
  return new Promise(function(resolve, reject){
    request.get({url: hundredRealtyUrl}, function(error, response, body){
      if(!error && response.statusCode == 200){
        resolve(body)
      }
      else{
        reject(error)
      }
    })
  })
}

function parseHundredRealtyData(data){
  return new Promise(function(resolve, reject){
    jsdom.env(data, ['http://code.jquery.com/jquery.js'], function(err, window){
      if(!err && window.$){
        var result = []
        var links = window.$(".object-address").find("a")
        for(var i = 0; i < links.length; i++){
          result.push({
            href: 'http://100realty.ua' + links[i].href,
            text: links[i].text.slice(0, links[i].text.length - 9)
          })
        }
        resolve(result)
      }
      else{
        reject(err)
      }
    })
  })
}

function updateHundredRealtySavedList(list){
  savedHundredRealtyFlats = list
}

function isHundredRealtyTextAcceptable(text){
   return generalIsTextAcceptable(text, neededWords)
}

function updateUI(targetUIElement, flats){
  content = document.getElementById(targetUIElement)
  while(content.firstChild){
    content.removeChild(content.firstChild)
  }

  for(i = 0; i < flats.length; i++){
    var node = document.createElement('li')
    var a = document.createElement('a')
    a.href = flats[i].href
    a.target="_blank"
    a.appendChild(document.createTextNode(flats[i].text))
    node.appendChild(a)
    content.appendChild(node)
  }
}

function generalCycle(dataPromiseFunction, url, params, savedFlatsList, parserFunction, targetUIElement, updateSavedList, isTextAcceptable){
    dataPromiseFunction(url, params).then(function(data){
      parserFunction(data).then(function(flats){
        var foundFlats = []
        updateUI(targetUIElement, flats)
        if(savedFlatsList.length != 0){
          for(var i = 0; i < flats.length; i++){
            var uniqueNoteFlag = true;
            for(var j = 0; j < savedFlatsList.length; j++){
               if(flats[i].href == savedFlatsList[j].href || flats[i].text == savedFlatsList[j].text || typeof(flats[i].href) == 'undefined'){
                 uniqueNoteFlag = false
                 break
               }
            }
            if(uniqueNoteFlag && isTextAcceptable(flats[i].text)){
              foundFlats.push(flats[i].href)
            }
          }

          for(var i = foundFlats.length - 1; i > -1; i--){
            noteFound(foundFlats[i])
          }
        }
        updateSavedList(flats)
      },
      function(err){
        console.log(err)
      })
  },
  function(err){
    console.log(err)
  })

}

function generalIsTextAcceptable(text, neededWords){
  for(var i = 0; i < neededWords.length; i++){
    if(text.toLowerCase().indexOf(neededWords[i]) != -1){
      return true;
    }
  }
  return false;
}

function noteFound(link){
  console.log('New note found!' + link)
  openWindow(link)
}

function openWindow(link){
  main.openWindow(link)
}
startInterval()
mainLoop()
