const { baseurl } = process.env;

const { resolve, extname } = require('path');
const { readdir } = require('fs').promises;


async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

const defStyle = (collection, datatype, vector_layers) => {
  const minZoom = Number(collection.minzoom) || 0;
  const maxZoom = Number(collection.maxzoom) || 18;
  const [w,s,e,n] = collection.bbox;

  let style = {
    "version": 8,
    "center": [(w+e)/2,(n+s)/2],
    "zoom": Math.ceil(maxZoom+minZoom)/2,
    "name": collection.id + ":default",
    "glyphs": baseurl + "/resources/fonts/{fontstack}/{range}",
    "sources": {
      's2maps-tiles': {
        'type': 'raster',
        'tiles': [
          'https://s2maps-tiles.eu/wmts?layer=s2cloudless-2020_3857&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}'
        ],
        'tileSize': 256,
        'maxzoom': 14,
      },
      "collection-tiles": {
        "type": datatype,
        "bounds":collection.bbox,
        "tiles": [
          baseurl + "/collections/" + collection.id + "/tiles/webmercator/{z}/{x}/{y}"
        ],
        "tileSize": datatype == "vector" ? 512 : 256,
        "scheme": "xyz",
        "minzoom": minZoom,
        "maxzoom": maxZoom
      }
    },
    "layers": [
      {
        "id": "background",
        "type": "background",
        "paint": {
          "background-color": "#0f0f0f"
        }
      },
      {
        'id': 's2maps',
        'type': 'raster',
        'source': 's2maps-tiles',
        'paint':{
          'raster-saturation': -0.5
        }
      }
    ]
  }

  if (datatype == "raster") {
    style.layers.push({
      "id": "collection-tiles",
      "type": "raster",
      "source": "collection-tiles",
    })
  }
  else if (datatype == "vector") {
    vector_layers.forEach(layer => {
      const layerColor = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99'][Math.random() * 11 | 0]

      style.layers.push({
        'id': layer.id + '-polygons',
        'type': 'fill',
        "source": "collection-tiles",
        'source-layer': layer.id,
        'filter': ["==", "$type", "Polygon"],
        'layout': {},
        'paint': {
          'fill-opacity': ["case", ["boolean", ["feature-state", "hover"], false], 0.8, 0.4],
          'fill-color': layerColor
        }
      });

      style.layers.push({
        'id': layer.id + '-polygons-outline',
        'type': 'line',
        "source": "collection-tiles",
        'source-layer': layer.id,
        'filter': ["==", "$type", "Polygon"],
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': layerColor,
          'line-width': 1,
          'line-opacity': 0.7
        }
      });

      style.layers.push({
        'id': layer.id + '-lines',
        'type': 'line',
        "source": "collection-tiles",
        'source-layer': layer.id,
        'filter': ["==", "$type", "LineString"],
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': layerColor,
          'line-width': 1,
          'line-opacity': ["case", ["boolean", ["feature-state", "hover"], false], 0.8, 0.4]
        }
      });

      style.layers.push({
        'id': layer.id + '-pts',
        'type': 'circle',
        "source": "collection-tiles",
        'source-layer': layer.id,
        'filter': ["==", "$type", "Point"],
        'paint': {
          'circle-color': layerColor,
          'circle-radius': 2.5,
          'circle-opacity': ["case", ["boolean", ["feature-state", "hover"], false], 0.8, 0.4]
        }
      });

    })

  }
  return style
}


module.exports = {
  fromWS: async (path) => {
    var collections = await require('./sources/wms').getCollections(path)

    collections.forEach(collection => {
      require('./configDB').addCollection(collection)
      require('./configDB').addStyle(collection.id, "default", defStyle(collection, "raster"))
    })

  },

  fromFolder: async (dir) => {
    for await (const f of getFiles(dir)) {
      const ext = extname(f)
      if (ext == ".mbtiles") {
        const collection = require('./sources/mbtiles').getCollections(f)[0]
        await require('./configDB').addCollection(collection)

        const type = collection.sources.format.split("/")[0] == "image" ? "raster" : "vector";
        await require('./configDB').addStyle(collection.id, "default", defStyle(collection, type, collection.vector_layers))
      }
      else if (ext == ".sqlite") {
        const collections = require('./sources/sqlite').getCollections(f)
        collections.forEach(collection => {
          require('./configDB').addCollection(collection)
          require('./configDB').addStyle(collection.id, "default", defStyle(collection, "vector", collection.vector_layers))
        })
       }
    }
  }
}